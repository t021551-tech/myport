/* Munsif — shared runtime.
   State, the fairness maths, and the recording player. No framework, no build
   step. State lives in localStorage so the demo keeps what you do to it; the
   "Reset demo data" control in the footer puts the seed back. */

(function (global) {
  'use strict';

  var KEY = 'munsif.state';
  var ME_KEY = 'munsif.me';
  var BUCKET = 5;                       // listening coverage granularity, seconds

  var M = {};

  // ── state ────────────────────────────────────────────────────
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function fresh() {
    var s = clone(global.KFAS_DATA);
    s.interviews.forEach(function (iv) {
      iv.listenedBuckets = iv.listenedBuckets || {};
      iv.flags.forEach(function (f) { f.thread = f.thread || []; });
    });
    return s;
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var saved = JSON.parse(raw);
        if (saved && saved.version === global.KFAS_DATA.version) return saved;
      }
    } catch (e) { /* private mode, cleared storage — fall through to the seed */ }
    return fresh();
  }

  M.state = load();

  M.save = function () {
    try { localStorage.setItem(KEY, JSON.stringify(M.state)); } catch (e) {}
  };

  M.reset = function () {
    try { localStorage.removeItem(KEY); } catch (e) {}
    M.state = fresh();
  };

  // ── who is using the workspace ───────────────────────────────
  M.meId = (function () {
    try { return localStorage.getItem(ME_KEY) || 'u-nadia'; } catch (e) { return 'u-nadia'; }
  })();

  M.setMe = function (id) {
    M.meId = id;
    try { localStorage.setItem(ME_KEY, id); } catch (e) {}
  };

  M.person = function (id) { return M.state.people[id] || { name: id, job: '', unit: '' }; };
  M.me = function () { return M.person(M.meId); };
  M.can = function (what) {
    var p = M.state.permissions[M.meId] || {};
    return !!p[what];
  };

  // ── lookups ──────────────────────────────────────────────────
  M.role = function (id) {
    return M.state.roles.filter(function (r) { return r.id === id; })[0];
  };
  M.interview = function (id) {
    return M.state.interviews.filter(function (i) { return i.id === id; })[0];
  };
  M.question = function (id) {
    return M.state.questions.filter(function (q) { return q.id === id; })[0];
  };
  M.criterion = function (roleId, cid) {
    var r = M.role(roleId);
    return r && r.criteria.filter(function (c) { return c.id === cid; })[0];
  };
  M.coreQuestions = function (roleId) {
    return M.state.questions.filter(function (q) {
      return q.roleId === roleId && q.kind === 'core' && q.status !== 'retired';
    });
  };

  // ── formatting ───────────────────────────────────────────────
  M.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  };

  M.clock = function (sec) {
    sec = Math.max(0, Math.round(sec));
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  };

  M.mins = function (sec) { return Math.round(sec / 60) + ' min'; };

  M.pct = function (n) { return Math.round(n * 100) + '%'; };

  M.now = function () {
    var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
           ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  };

  M.statusPill = function (status) {
    var map = {
      'scoring':           ['grey',  'Scoring in progress'],
      'awaiting-review':   ['amber', 'Awaiting review'],
      'changes-requested': ['red',   'Changes requested'],
      'approved':          ['green', 'Approved'],
      'decided':           ['blue',  'Decision recorded']
    };
    var m = map[status] || ['grey', status];
    return '<span class="pill ' + m[0] + '"><i class="dot"></i>' + m[1] + '</span>';
  };

  // ── scoring ──────────────────────────────────────────────────
  // Every number below is computed from the interview record. Nothing is
  // stored pre-baked, so editing a score moves the fairness page too.

  M.scoresFor = function (iv, cid) {
    var out = [];
    iv.panel.forEach(function (uid) {
      var s = iv.scores[uid] && iv.scores[uid][cid];
      if (s && typeof s.score === 'number') out.push({ uid: uid, score: s.score, evidence: s.evidence || '' });
    });
    return out;
  };

  M.spread = function (iv, cid) {
    var v = M.scoresFor(iv, cid).map(function (s) { return s.score; });
    if (v.length < 2) return 0;
    return Math.max.apply(null, v) - Math.min.apply(null, v);
  };

  M.mean = function (arr) {
    if (!arr.length) return 0;
    return arr.reduce(function (a, b) { return a + b; }, 0) / arr.length;
  };

  /* Weighted panel score out of 100. Criteria with no scores yet are left out
     and the weights are renormalised, so a part-scored interview is not
     silently penalised. */
  M.weighted = function (iv) {
    var role = M.role(iv.roleId), num = 0, den = 0;
    role.criteria.forEach(function (c) {
      var v = M.scoresFor(iv, c.id).map(function (s) { return s.score; });
      if (!v.length) return;
      num += M.mean(v) * c.weight;
      den += c.weight;
    });
    if (!den) return null;
    return (num / den) / 5 * 100;
  };

  M.talkShare = function (iv) {
    var cand = 0, pan = 0;
    iv.segments.forEach(function (s) { cand += s.candidateSec; pan += s.panelSec; });
    return cand + pan ? cand / (cand + pan) : 0;
  };

  M.askedCore = function (iv) {
    var asked = {};
    iv.segments.forEach(function (s) { if (s.qid) asked[s.qid] = true; });
    return M.coreQuestions(iv.roleId).map(function (q) {
      return { q: q, asked: !!asked[q.id] };
    });
  };

  M.unscripted = function (iv) {
    return iv.segments.filter(function (s) { return !s.qid; });
  };

  M.openFlags = function (iv) {
    return iv.flags.filter(function (f) { return !f.ruling; });
  };

  // ── listening coverage ───────────────────────────────────────
  M.buckets = function (iv, uid) {
    iv.listenedBuckets = iv.listenedBuckets || {};
    if (!iv.listenedBuckets[uid]) iv.listenedBuckets[uid] = [];
    return iv.listenedBuckets[uid];
  };

  M.markListened = function (iv, uid, sec) {
    var b = M.buckets(iv, uid), i = Math.floor(sec / BUCKET);
    if (b.indexOf(i) === -1) { b.push(i); return true; }
    return false;
  };

  /* Demo only. A real deployment has no way to say you listened without
     listening — the whole point of the gate. */
  M.markAllListened = function (iv, uid) {
    var b = M.buckets(iv, uid);
    for (var i = 0; i < Math.ceil(iv.durationSec / BUCKET); i++) if (b.indexOf(i) === -1) b.push(i);
    M.save();
  };

  M.coverage = function (iv, uid) {
    var total = Math.ceil(iv.durationSec / BUCKET);
    return total ? Math.min(1, M.buckets(iv, uid).length / total) : 0;
  };

  /* Coverage of the segments someone has flagged — a reviewer should not be
     able to sign off on a flag they never listened to. */
  M.flaggedCoverage = function (iv, uid) {
    var flagged = iv.flags.map(function (f) { return f.segId; });
    var segs = iv.segments.filter(function (s) { return flagged.indexOf(s.id) > -1; });
    if (!segs.length) return 1;
    var have = {};
    M.buckets(iv, uid).forEach(function (b) { have[b] = 1; });
    var need = 0, got = 0;
    segs.forEach(function (s) {
      for (var t = Math.floor(s.start / BUCKET); t < Math.ceil(s.end / BUCKET); t++) {
        need++;
        if (have[t] === 1) got++;
      }
    });
    return need ? got / need : 1;
  };

  // ── readiness checks: what stands between here and a sign-off ─
  M.checks = function (iv, uid) {
    uid = uid || M.meId;
    var role = M.role(iv.roleId);
    var expected = role.criteria.length * iv.panel.length;
    var given = 0, withEvidence = 0, worstSpread = 0;

    role.criteria.forEach(function (c) {
      var rows = M.scoresFor(iv, c.id);
      given += rows.length;
      rows.forEach(function (r) { if (r.evidence.trim()) withEvidence++; });
      worstSpread = Math.max(worstSpread, M.spread(iv, c.id));
    });

    var core = M.askedCore(iv);
    var missing = core.filter(function (r) { return !r.asked; });
    var cov = M.coverage(iv, uid), fcov = M.flaggedCoverage(iv, uid);

    return [
      { id: 'scored',   ok: given === expected,
        label: 'Every panellist has scored every criterion',
        detail: given + ' of ' + expected + ' scores in' },
      { id: 'evidence', ok: given > 0 && withEvidence === given,
        label: 'Every score carries written evidence',
        detail: withEvidence + ' of ' + given + ' scores cite the recording' },
      { id: 'bank',     ok: missing.length === 0,
        label: 'Every core question was asked',
        detail: missing.length ? 'Missing: ' + missing.map(function (r) { return r.q.id; }).join(', ')
                               : core.length + ' of ' + core.length + ' asked' },
      { id: 'flags',    ok: M.openFlags(iv).length === 0,
        label: 'No unresolved question flags',
        detail: M.openFlags(iv).length ? M.openFlags(iv).length + ' awaiting a ruling' : 'nothing open' },
      { id: 'spread',   ok: worstSpread <= 2,
        label: 'Panel scores agree within two points',
        detail: 'widest gap is ' + worstSpread + ' point' + (worstSpread === 1 ? '' : 's') },
      { id: 'listened', ok: cov >= 0.8 && fcov >= 0.999,
        label: 'You have listened to the recording',
        detail: M.pct(cov) + ' of the recording' + (iv.flags.length ? ', ' + M.pct(fcov) + ' of flagged answers' : '') }
    ];
  };

  M.ready = function (iv, uid) {
    return M.checks(iv, uid).every(function (c) { return c.ok; });
  };

  // ── fairness maths across the whole round ────────────────────
  M.metrics = function (roleId) {
    var ivs = M.state.interviews.filter(function (i) {
      return !roleId || i.roleId === roleId;
    });

    var scored = 0, withEvidence = 0, agree = 0, criteriaCount = 0;
    var parityNum = 0, parityDen = 0, unscriptedCount = 0, openFlags = 0;
    var talk = [], bySlot = {}, byPanellist = {}, dist = [0, 0, 0, 0, 0];

    ivs.forEach(function (iv) {
      var role = M.role(iv.roleId);

      role.criteria.forEach(function (c) {
        var rows = M.scoresFor(iv, c.id);
        if (!rows.length) return;
        criteriaCount++;
        if (M.spread(iv, c.id) <= 1) agree++;
        rows.forEach(function (r) {
          scored++;
          if (r.evidence.trim()) withEvidence++;
          dist[r.score - 1]++;
          if (!byPanellist[r.uid]) byPanellist[r.uid] = { mine: [], panel: [] };
          byPanellist[r.uid].mine.push(r.score);
          byPanellist[r.uid].panel.push(M.mean(rows.map(function (x) { return x.score; })));
        });
      });

      var core = M.askedCore(iv);
      parityDen += core.length;
      parityNum += core.filter(function (r) { return r.asked; }).length;
      unscriptedCount += M.unscripted(iv).length;
      openFlags += M.openFlags(iv).length;
      talk.push({ iv: iv, share: M.talkShare(iv) });

      var w = M.weighted(iv);
      if (w != null) {
        if (!bySlot[iv.slot]) bySlot[iv.slot] = [];
        bySlot[iv.slot].push(w);
      }
    });

    // Leniency: how far each panellist sits from the panel mean on the same answer.
    var leniency = Object.keys(byPanellist).map(function (uid) {
      var d = byPanellist[uid].mine.map(function (v, i) { return v - byPanellist[uid].panel[i]; });
      return { uid: uid, drift: M.mean(d), n: d.length };
    }).sort(function (a, b) { return b.drift - a.drift; });

    var slots = Object.keys(bySlot).map(Number).sort(function (a, b) { return a - b; })
      .map(function (s) { return { slot: s, mean: M.mean(bySlot[s]), n: bySlot[s].length }; });

    // Order effect: difference between the first half and second half of the day.
    var half = Math.ceil(slots.length / 2);
    var early = M.mean(slots.slice(0, half).map(function (s) { return s.mean; }));
    var late = M.mean(slots.slice(half).map(function (s) { return s.mean; }));

    return {
      interviews: ivs,
      evidence: scored ? withEvidence / scored : 0,
      agreement: criteriaCount ? agree / criteriaCount : 0,
      parity: parityDen ? parityNum / parityDen : 0,
      unscripted: unscriptedCount,
      openFlags: openFlags,
      talk: talk.sort(function (a, b) { return a.share - b.share; }),
      talkMean: M.mean(talk.map(function (t) { return t.share; })),
      leniency: leniency,
      slots: slots,
      orderGap: early - late,
      dist: dist,
      reviewed: ivs.filter(function (i) { return i.approvals.length; }).length
    };
  };

  // ── the recording ────────────────────────────────────────────
  /* No real audio ships with this demo, so the player runs a clock over the
     real segment timings and draws the real talk-time split. Attach an audio
     file and the same transport drives the file instead. */
  function prng(seed) {
    var h = 2166136261;
    for (var i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
    return function () {
      h += 0x6D2B79F5;
      var t = h;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* Lay the turns out inside each segment from its real talk-time totals:
     the panel asks, the candidate answers, with a couple of interjections. */
  function turns(iv) {
    var out = [];
    iv.segments.forEach(function (s) {
      var t = s.start;
      var panChunks = [s.panelSec * 0.6, s.panelSec * 0.25, s.panelSec * 0.15];
      var candChunks = [s.candidateSec * 0.55, s.candidateSec * 0.3, s.candidateSec * 0.15];
      for (var i = 0; i < 3; i++) {
        out.push({ who: 'pan', start: t, end: t + panChunks[i] });  t += panChunks[i];
        out.push({ who: 'cand', start: t, end: t + candChunks[i] }); t += candChunks[i];
      }
    });
    return out;
  }

  function speakerAt(list, t) {
    for (var i = 0; i < list.length; i++) if (t >= list[i].start && t < list[i].end) return list[i].who;
    return null;
  }

  M.player = function (opts) {
    var iv = opts.interview, canvas = opts.canvas, onTick = opts.onTick;
    var dur = iv.durationSec, cur = 0, rate = 1, playing = false, raf = null, last = 0;
    var audio = null;
    var speakers = turns(iv);
    var rnd = prng(iv.id);
    var amps = [];
    for (var i = 0; i < 900; i++) amps.push(0.25 + rnd() * 0.75);

    var css = getComputedStyle(document.documentElement);
    var COL = {
      cand: css.getPropertyValue('--green').trim() || '#0B6E4F',
      pan: css.getPropertyValue('--blue').trim() || '#2B5E86',
      idle: '#D8D3C7',
      flag: css.getPropertyValue('--flag').trim() || '#A93B26'
    };

    function flaggedSpans() {
      var ids = iv.flags.map(function (f) { return f.segId; });
      return iv.segments.filter(function (s) { return ids.indexOf(s.id) > -1; });
    }

    function draw() {
      var w = canvas.clientWidth, h = canvas.clientHeight, dpr = global.devicePixelRatio || 1;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr; canvas.height = h * dpr;
      }
      var c = canvas.getContext('2d');
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, w, h);

      // flagged stretches sit behind the waveform
      flaggedSpans().forEach(function (s) {
        c.fillStyle = 'rgba(169,59,38,.09)';
        c.fillRect(s.start / dur * w, 0, (s.end - s.start) / dur * w, h);
      });

      /* The candidate reads above the centre line and the panel below it, so
         who was doing the talking is visible without playing anything. */
      var bars = Math.max(48, Math.floor(w / 5)), bw = w / bars, mid = h / 2;
      var covered = {};
      M.buckets(iv, M.meId).forEach(function (b) { covered[b] = 1; });
      var room = h / 2 - 6;

      c.fillStyle = 'rgba(18,33,28,.12)';
      c.fillRect(0, mid - 0.5, w, 1);

      for (var i = 0; i < bars; i++) {
        var t = (i + 0.5) / bars * dur;
        var who = speakerAt(speakers, t);
        var wobble = 0.55 + amps[i % amps.length] * 0.45;
        var past = t <= cur;
        var heard = covered[Math.floor(t / BUCKET)] === 1;
        c.globalAlpha = past ? 1 : (heard ? 0.7 : 0.45);

        var x = i * bw + bw * 0.2, bwid = Math.max(1.5, bw * 0.6);
        if (who === 'cand') {
          var bh = Math.max(3, wobble * room);
          c.fillStyle = COL.cand;
          c.fillRect(x, mid - bh, bwid, bh);
        } else if (who === 'pan') {
          var ph = Math.max(3, wobble * room * 0.8);
          c.fillStyle = COL.pan;
          c.fillRect(x, mid, bwid, ph);
        } else {
          c.fillStyle = COL.idle;
          c.fillRect(x, mid - 1.5, bwid, 3);
        }
      }
      c.globalAlpha = 1;

      var x = cur / dur * w;
      c.fillStyle = '#12211C';
      c.fillRect(x - 1, 0, 2, h);
    }

    function tick(ts) {
      if (!playing) return;
      if (!last) last = ts;
      var dt = (ts - last) / 1000; last = ts;
      if (audio) cur = audio.currentTime;
      else cur = Math.min(dur, cur + dt * rate);
      var fresh = M.markListened(iv, M.meId, cur);
      if (fresh) M.save();
      draw();
      if (onTick) onTick(cur, fresh);
      if (cur >= dur) { api.pause(); cur = dur; }
      raf = requestAnimationFrame(tick);
    }

    var api = {
      get time() { return cur; },
      get playing() { return playing; },
      play: function () {
        playing = true; last = 0;
        if (audio) audio.play().catch(function () {});
        raf = requestAnimationFrame(tick);
        if (opts.onState) opts.onState(true);
      },
      pause: function () {
        playing = false;
        if (audio) audio.pause();
        if (raf) cancelAnimationFrame(raf);
        if (opts.onState) opts.onState(false);
      },
      toggle: function () { playing ? api.pause() : api.play(); },
      seek: function (t) {
        cur = Math.max(0, Math.min(dur, t));
        if (audio) audio.currentTime = cur;
        M.markListened(iv, M.meId, cur); M.save();
        draw();
        if (onTick) onTick(cur, true);
      },
      rate: function (r) {
        rate = r;
        if (audio) audio.playbackRate = r;
      },
      attach: function (file) {
        audio = new Audio(URL.createObjectURL(file));
        audio.playbackRate = rate;
        audio.addEventListener('loadedmetadata', function () {
          if (isFinite(audio.duration) && audio.duration > 0) { dur = audio.duration; draw(); }
        });
        return audio;
      },
      redraw: draw
    };

    canvas.addEventListener('click', function (e) {
      var r = canvas.getBoundingClientRect();
      api.seek((e.clientX - r.left) / r.width * dur);
    });
    canvas.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { api.seek(cur + 15); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { api.seek(cur - 15); e.preventDefault(); }
      if (e.key === ' ' || e.key === 'Enter') { api.toggle(); e.preventDefault(); }
    });
    global.addEventListener('resize', draw);
    draw();
    return api;
  };

  // ── page chrome: the identity switcher and the reset control ──
  M.mountChrome = function () {
    var sel = document.getElementById('who');
    if (sel) {
      Object.keys(M.state.people).forEach(function (id) {
        var p = M.state.people[id], o = document.createElement('option');
        o.value = id;
        o.textContent = p.name + ' — ' + p.job;
        if (id === M.meId) o.selected = true;
        sel.appendChild(o);
      });
      sel.addEventListener('change', function () {
        M.setMe(sel.value);
        location.reload();
      });
    }
    var reset = document.getElementById('reset-demo');
    if (reset) {
      reset.addEventListener('click', function () {
        if (confirm('Put the sample data back to how it started? Anything you changed in this demo will be lost.')) {
          M.reset(); M.save(); location.reload();
        }
      });
    }
  };

  global.M = M;
  document.addEventListener('DOMContentLoaded', M.mountChrome);
})(window);
