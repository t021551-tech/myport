/* The review screen: one interview, its recording, its scores, its flags and
   its sign-off. Everything writes back into M.state and saves. */

(function () {
  'use strict';

  var params = new URLSearchParams(location.search);
  var iv = M.interview(params.get('id')) ||
           M.state.interviews.filter(function (i) { return i.status === 'awaiting-review'; })[0] ||
           M.state.interviews[0];
  var role = M.role(iv.roleId);
  var amPanel = iv.panel.indexOf(M.meId) > -1 && M.can('score');

  var $ = function (id) { return document.getElementById(id); };
  var player;

  // ── head ─────────────────────────────────────────────────────
  function renderHead() {
    var w = M.weighted(iv);
    var named = iv.status === 'decided';
    $('head').innerHTML =
      '<p class="eyebrow">' + M.esc(role.title) + ' &middot; ' + M.esc(role.dept) + '</p>' +
      '<h1>' + M.esc(named ? iv.name : iv.code) + '</h1>' +
      '<div class="btn-row" style="margin-top:.7rem">' +
        M.statusPill(iv.status) +
        '<span class="pill grey">Recorded ' + iv.date + ' &middot; slot ' + iv.slot + '</span>' +
        '<span class="pill grey mono">' + M.mins(iv.durationSec) + '</span>' +
        (w == null ? '<span class="pill grey">Not yet scored</span>'
                   : '<span class="pill blue mono">Panel score ' + w.toFixed(0) + ' / 100</span>') +
      '</div>' +
      '<p class="small muted" style="margin-top:.7rem">' +
        (named
          ? 'The decision is recorded, so the candidate&rsquo;s name is now shown.'
          : 'Names are withheld from reviewers until a decision is recorded. This candidate is ' + iv.code + ' throughout.') +
      '</p>';
  }

  // ── the recording ────────────────────────────────────────────
  function setupPlayer() {
    $('rec-note').textContent = M.mins(iv.durationSec) + ' · ' + iv.segments.length +
      ' answers chaptered against the question bank · candidate spoke ' + M.pct(M.talkShare(iv)) + ' of the time';

    player = M.player({
      interview: iv,
      canvas: $('wave'),
      onTick: function (t, fresh) { paintTime(t, fresh); highlight(t); },
      onState: function (on) {
        $('play-icon').innerHTML = on
          ? '<rect x="4" y="2.5" width="3" height="11" fill="currentColor"></rect><rect x="9" y="2.5" width="3" height="11" fill="currentColor"></rect>'
          : '<path d="M4 2.5v11l9-5.5z" fill="currentColor"></path>';
        $('play').setAttribute('aria-label', on ? 'Pause the recording' : 'Play the recording');
      }
    });

    $('play').addEventListener('click', function () { player.toggle(); });

    Array.prototype.forEach.call(document.querySelectorAll('.speeds button'), function (b) {
      b.addEventListener('click', function () {
        Array.prototype.forEach.call(document.querySelectorAll('.speeds button'), function (o) {
          o.setAttribute('aria-pressed', String(o === b));
        });
        player.rate(parseFloat(b.dataset.rate));
      });
    });

    $('heard').addEventListener('click', function () {
      M.markAllListened(iv, M.meId);
      paintTime(player.time, true);
      player.redraw();
    });

    $('audio-file').addEventListener('change', function (e) {
      var f = e.target.files && e.target.files[0];
      if (!f) return;
      player.attach(f);
      $('rec-note').textContent = 'Playing ' + f.name + ' — the transport, coverage and flags all run against this file.';
    });

    paintTime(0);
  }

  function paintTime(t, fresh) {
    $('time').textContent = M.clock(t) + ' / ' + M.clock(iv.durationSec);
    $('wave').setAttribute('aria-valuenow', Math.round(t));
    $('wave').setAttribute('aria-valuetext', M.clock(t) + ' of ' + M.clock(iv.durationSec));
    if (fresh === false) return;                 // nothing new heard, nothing to recount
    var cov = M.coverage(iv, M.meId);
    $('cov-bar').style.width = (cov * 100) + '%';
    $('cov-txt').textContent = M.pct(cov);
    renderChecks(); renderActions();
  }

  function highlight(t) {
    Array.prototype.forEach.call(document.querySelectorAll('.seg'), function (el) {
      var s = seg(el.dataset.seg);
      el.classList.toggle('playing', !!s && t >= s.start && t < s.end);
    });
  }

  function seg(id) {
    return iv.segments.filter(function (s) { return s.id === id; })[0];
  }

  // ── what was asked ───────────────────────────────────────────
  function renderSegments() {
    var core = M.askedCore(iv), missing = core.filter(function (c) { return !c.asked; });
    $('seg-note').innerHTML =
      'Each stretch of the recording is tied to a question from the approved bank for this vacancy. ' +
      (missing.length
        ? '<strong>' + missing.length + ' core question' + (missing.length === 1 ? ' was' : 's were') +
          ' never asked:</strong> ' + missing.map(function (c) { return M.esc(c.q.id) + ' — ' + M.esc(c.q.text); }).join(' ')
        : 'All ' + core.length + ' core questions were asked.');

    $('segments').innerHTML = iv.segments.map(function (s) {
      var q = s.qid ? M.question(s.qid) : null;
      var flag = iv.flags.filter(function (f) { return f.segId === s.id; })[0];
      var total = s.candidateSec + s.panelSec || 1;

      var title = q
        ? '<span class="pill green">' + M.esc(q.id) + '</span> <span class="seg-q">' + M.esc(q.text) + '</span>'
        : '<span class="pill red">Unscripted</span> <span class="seg-q">' + M.esc(s.label || 'Question outside the bank') + '</span>';

      var crit = q && q.criterionId ? M.criterion(iv.roleId, q.criterionId) : null;

      return '<li class="seg' + (s.qid ? '' : ' unscripted') + '" data-seg="' + s.id + '">' +
        '<div class="seg-top">' +
          '<button class="btn sm ghost" type="button" data-play="' + s.start + '">&#9654; ' + M.clock(s.start) + '</button>' +
          title +
        '</div>' +
        (crit ? '<p class="small muted" style="margin:0">Scores against: ' + M.esc(crit.name) + '</p>' : '') +
        (s.excluded ? '<p class="small" style="margin:0;color:var(--flag);font-weight:600">Excluded from scoring by HR ruling.</p>' : '') +
        '<p class="seg-x">' + M.esc(s.excerpt) + '</p>' +
        '<div class="seg-top">' +
          '<span class="talk" title="Who was speaking">' +
            '<i class="cand" style="width:' + (s.candidateSec / total * 100) + '%"></i>' +
            '<i class="pan" style="width:' + (s.panelSec / total * 100) + '%"></i>' +
          '</span>' +
          '<span class="small muted mono">candidate ' + Math.round(s.candidateSec / total * 100) + '%</span>' +
        '</div>' +
        flagBlock(s, flag) +
      '</li>';
    }).join('');
  }

  function flagBlock(s, flag) {
    var canFlag = M.can('review') || M.can('rule');

    if (!flag) {
      if (!canFlag) return '';
      return '<details class="small" style="margin-top:.3rem">' +
        '<summary style="cursor:pointer;color:var(--flag);font-weight:600">Flag this question</summary>' +
        '<div style="margin-top:.6rem">' +
          '<div class="field"><label for="fc-' + s.id + '">Why is this a problem?</label>' +
          '<select id="fc-' + s.id + '" data-fcat="' + s.id + '">' +
            '<option value="off-rubric">Outside the rubric — maps to no criterion</option>' +
            '<option value="prohibited">Should not have been asked at all</option>' +
            '<option value="unclear">Unclear, leading, or answered by the panel</option>' +
            '<option value="parity">Asked of this candidate only</option>' +
          '</select></div>' +
          '<div class="field"><label for="fr-' + s.id + '">What you heard</label>' +
          '<textarea id="fr-' + s.id + '" data-freason="' + s.id + '" placeholder="Say what was asked and why it cannot stand, with the timestamp."></textarea></div>' +
          '<button class="btn sm danger" type="button" data-flag="' + s.id + '">Raise a flag</button>' +
        '</div></details>';
    }

    var cat = { 'off-rubric': 'Outside the rubric', 'prohibited': 'Should not have been asked',
                'unclear': 'Unclear or leading', 'parity': 'Asked of this candidate only' }[flag.category] || flag.category;

    var html = '<div class="msg' + (flag.ruling ? '' : ' open') + '">' +
      '<div class="m-head"><b>' + M.esc(M.person(flag.raisedBy).name) + '</b> flagged this &middot; ' +
        M.esc(flag.raisedAt) + ' <span class="pill red">' + M.esc(cat) + '</span></div>' +
      M.esc(flag.reason) + '</div>';

    html += '<div class="thread">' + flag.thread.map(function (m) {
      return '<div class="msg"><div class="m-head"><b>' + M.esc(M.person(m.by).name) + '</b> &middot; ' +
        M.esc(m.at) + '</div>' + M.esc(m.text) + '</div>';
    }).join('') + '</div>';

    if (flag.ruling) {
      var outcome = { allowed: 'Allowed to stand', excluded: 'Excluded from scoring',
                      retrain: 'Excluded, and the panellist is referred for retraining' }[flag.ruling.outcome];
      html += '<div class="msg ruling"><div class="m-head"><b>Ruling by ' +
        M.esc(M.person(flag.ruling.by).name) + '</b> &middot; ' + M.esc(flag.ruling.at) +
        ' <span class="pill green">' + M.esc(outcome) + '</span></div>' + M.esc(flag.ruling.text) + '</div>';
    } else {
      html += '<details class="small" style="margin-top:.3rem"><summary style="cursor:pointer;font-weight:600">Reply or rule on this</summary><div style="margin-top:.6rem">' +
        '<div class="field"><label for="rt-' + flag.id + '">Your reply</label>' +
        '<textarea id="rt-' + flag.id + '" data-reply="' + flag.id + '" placeholder="' +
          (M.can('rule') ? 'Explain the ruling, or ask the panellist to account for the question first.' : 'Explain why the question was asked.') +
        '"></textarea></div>' +
        '<div class="btn-row"><button class="btn sm ghost" type="button" data-post="' + flag.id + '">Post reply</button>' +
        (M.can('rule')
          ? '<button class="btn sm" type="button" data-rule="allowed" data-fid="' + flag.id + '">Allow</button>' +
            '<button class="btn sm danger" type="button" data-rule="excluded" data-fid="' + flag.id + '">Exclude from scoring</button>' +
            '<button class="btn sm danger" type="button" data-rule="retrain" data-fid="' + flag.id + '">Exclude &amp; refer</button>'
          : '<span class="hint" style="margin:0">Only HR can rule on a flag.</span>') +
        '</div></div></details>';
    }
    return html;
  }

  // ── scorecard ────────────────────────────────────────────────
  function renderCriteria() {
    $('score-note').innerHTML = amPanel
      ? 'You are on this panel, so your own column is editable. A score cannot count towards sign-off until it cites the moment in the recording it came from.'
      : 'You are not on this panel, so the scores are read-only. Check each one against what you heard, and return the interview if a score is not supported by its evidence.';

    $('criteria').innerHTML = role.criteria.map(function (c) {
      var rows = M.scoresFor(iv, c.id);
      var spread = M.spread(iv, c.id);
      var mine = (iv.scores[M.meId] || {})[c.id] || { score: null, evidence: '' };

      var panelRows = iv.panel.map(function (uid) {
        var s = (iv.scores[uid] || {})[c.id];
        var v = s && typeof s.score === 'number' ? s.score : null;
        return '<div class="row">' +
          '<span class="nm">' + M.esc(M.person(uid).name) + '</span>' +
          '<span class="bar"><i style="width:' + (v ? v / 5 * 100 : 0) + '%"></i></span>' +
          '<span class="mono" style="width:2.4rem;text-align:right">' + (v == null ? '—' : v) + '</span>' +
          '</div>' +
          (s && s.evidence
            ? '<p class="small muted" style="margin:.1rem 0 .35rem 10.1rem">&ldquo;' + M.esc(s.evidence) + '&rdquo;</p>'
            : v == null ? ''
            : '<p class="small" style="margin:.1rem 0 .35rem 10.1rem;color:var(--flag)">No evidence attached &mdash; this score cannot be checked.</p>');
      }).join('');

      var editor = '';
      if (amPanel) {
        editor = '<div style="margin-top:.9rem;border-top:1px solid var(--line-soft);padding-top:.8rem">' +
          '<label>Your score</label><div class="scale" data-crit="' + c.id + '">' +
          [1, 2, 3, 4, 5].map(function (n) {
            return '<label class="' + (mine.score === n ? 'on' : '') + '" data-score="' + n + '" tabindex="0" role="button" aria-pressed="' +
              (mine.score === n) + '">' + n + '</label>';
          }).join('') + '</div>' +
          '<div class="field" style="margin-top:.7rem"><label for="ev-' + c.id + '">Evidence from the recording</label>' +
          '<textarea id="ev-' + c.id + '" data-ev="' + c.id + '" placeholder="What you heard, and when.">' + M.esc(mine.evidence) + '</textarea>' +
          '<div class="btn-row" style="margin-top:.4rem"><button class="btn sm ghost" type="button" data-stamp="' + c.id + '">Insert the current timestamp</button></div></div></div>';
      }

      return '<div class="crit">' +
        '<div class="crit-head"><h4>' + M.esc(c.name) + '</h4>' +
          '<span class="weight">weight ' + c.weight + '%' +
          (rows.length > 1 ? ' &middot; <span class="spread' + (spread > 2 ? ' bad' : '') + '">spread ' + spread + '</span>' : '') +
          '</span></div>' +
        '<div class="anchors">' +
          '<div><b>1</b> ' + M.esc(c.anchors[1]) + '</div>' +
          '<div><b>3</b> ' + M.esc(c.anchors[3]) + '</div>' +
          '<div><b>5</b> ' + M.esc(c.anchors[5]) + '</div>' +
          '<div class="small">2 and 4 sit between the anchors.</div>' +
        '</div>' +
        '<div class="panelscores">' + panelRows + '</div>' +
        (spread > 2 ? '<p class="small" style="color:var(--flag);margin:.5rem 0 0;font-weight:600">The panel is ' + spread +
          ' points apart here. This has to be talked through and revised before sign-off.</p>' : '') +
        editor +
      '</div>';
    }).join('');
  }

  // ── sign-off rail ────────────────────────────────────────────
  function renderChecks() {
    $('checks').innerHTML = M.checks(iv).map(function (c) {
      return '<li class="' + (c.ok ? 'done' : 'todo') + '"><span class="box">' + (c.ok ? '&check;' : '&middot;') + '</span>' +
        '<span>' + M.esc(c.label) + '<br><span class="small muted">' + M.esc(c.detail) + '</span></span></li>';
    }).join('');
  }

  function renderActions() {
    var box = $('actions'), ready = M.ready(iv);

    if (M.can('decide') && iv.status === 'approved') {
      box.innerHTML = '<h3>Record the decision</h3>' +
        '<p class="small muted">Two reviewers have signed this off. Recording the decision closes the interview and reveals the candidate&rsquo;s name.</p>' +
        '<div class="field"><label for="dnote">Reason, against the rubric</label><textarea id="dnote"></textarea></div>' +
        '<div class="btn-row">' +
          '<button class="btn" type="button" data-decide="advance">Advance to offer</button>' +
          '<button class="btn ghost" type="button" data-decide="hold">Hold</button>' +
          '<button class="btn danger" type="button" data-decide="reject">Do not advance</button>' +
        '</div>';
      return;
    }

    if (!M.can('review')) {
      box.innerHTML = '<h3>Sign-off</h3><p class="small muted">Sign-off sits with a reviewer outside the panel, and with HR for anything flagged. ' +
        'Switch identity at the top of the page to see that side of the workspace.</p>';
      return;
    }

    var already = iv.approvals.filter(function (a) { return a.by === M.meId && a.decision === 'approved'; }).length;

    box.innerHTML = '<h3>Your sign-off</h3>' +
      (already ? '<p class="small" style="color:var(--green-deep);font-weight:600">You approved this interview.</p>' : '') +
      '<div class="field"><label for="note">Note for the record</label>' +
      '<textarea id="note" placeholder="' + (ready ? 'What you checked.' : 'What needs to change before this can be approved.') + '"></textarea></div>' +
      '<div class="btn-row">' +
        '<button class="btn" type="button" id="approve"' + (ready && !already ? '' : ' aria-disabled="true"') + '>Approve</button>' +
        '<button class="btn danger" type="button" id="return">Return to the panel</button>' +
      '</div>' +
      (ready ? '' : '<p class="hint" style="margin-top:.6rem">Approval is locked until every line above is ticked.</p>');
  }

  function renderHistory() {
    if (!iv.approvals.length && !iv.decision) {
      $('history').innerHTML = '<p class="small muted" style="margin:0">Nothing signed yet.</p>';
      return;
    }
    var html = iv.approvals.map(function (a) {
      return '<div class="msg' + (a.decision === 'approved' ? ' ruling' : ' open') + '">' +
        '<div class="m-head"><b>' + M.esc(M.person(a.by).name) + '</b> &middot; ' + M.esc(a.at) +
        ' <span class="pill ' + (a.decision === 'approved' ? 'green' : 'red') + '">' +
        (a.decision === 'approved' ? 'Approved' : 'Returned') + '</span></div>' + M.esc(a.note) + '</div>';
    }).join('');
    if (iv.decision) {
      html += '<div class="msg ruling"><div class="m-head"><b>' + M.esc(M.person(iv.decision.by).name) +
        '</b> &middot; ' + M.esc(iv.decision.at) + ' <span class="pill blue">' +
        M.esc({ advance: 'Advanced to offer', hold: 'Held', reject: 'Not advanced' }[iv.decision.outcome]) +
        '</span></div>' + M.esc(iv.decision.note) + '</div>';
    }
    $('history').innerHTML = html;
  }

  function renderPanel() {
    $('panel-list').innerHTML = iv.panel.map(function (uid) {
      var p = M.person(uid);
      return '<p style="margin:0 0 .5rem"><strong>' + M.esc(p.name) + '</strong>' +
        (uid === iv.chair ? ' <span class="pill grey">Chair</span>' : '') +
        '<br><span class="muted">' + M.esc(p.job) + ' &middot; ' + M.esc(p.unit) + '</span></p>';
    }).join('') +
    '<p class="small muted" style="margin:.6rem 0 0">Reviewers are drawn from outside the panel: ' +
    Object.keys(M.state.permissions).filter(function (u) { return M.state.permissions[u].review; })
      .map(function (u) { return M.esc(M.person(u).name); }).join(', ') + '.';
  }

  function renderAll() {
    renderHead(); renderSegments(); renderCriteria();
    renderChecks(); renderActions(); renderHistory(); renderPanel();
    if (player) player.redraw();
  }

  // ── interactions ─────────────────────────────────────────────
  function val(sel) {
    var el = document.querySelector(sel);
    return el ? el.value.trim() : '';
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-play],[data-flag],[data-post],[data-rule],[data-score],[data-stamp],[data-decide],#approve,#return');
    if (!t) return;

    // jump the recording to a question
    if (t.dataset.play) { player.seek(parseFloat(t.dataset.play)); if (!player.playing) player.play(); return; }

    // set my score
    if (t.dataset.score) {
      var cid = t.closest('.scale').dataset.crit;
      iv.scores[M.meId] = iv.scores[M.meId] || {};
      iv.scores[M.meId][cid] = iv.scores[M.meId][cid] || { score: null, evidence: '' };
      iv.scores[M.meId][cid].score = parseInt(t.dataset.score, 10);
      if (iv.status === 'approved') iv.status = 'awaiting-review';
      M.save(); renderAll();
      var back = document.querySelector('.scale[data-crit="' + cid + '"] [data-score="' + t.dataset.score + '"]');
      if (back) back.focus();
      return;
    }

    // drop the playhead position into the evidence box
    if (t.dataset.stamp) {
      var box = document.querySelector('[data-ev="' + t.dataset.stamp + '"]');
      box.value = (box.value.trim() + ' (' + M.clock(player.time) + ')').trim();
      saveEvidence(t.dataset.stamp, box.value);
      box.focus();
      return;
    }

    // raise a flag on a question
    if (t.dataset.flag) {
      var sid = t.dataset.flag;
      var reason = val('[data-freason="' + sid + '"]');
      if (!reason) { alert('Say what you heard and why it is a problem — a flag with no reason cannot be answered.'); return; }
      iv.flags.push({
        id: 'f' + Date.now(), segId: sid, raisedBy: M.meId, raisedAt: M.now(),
        category: val('[data-fcat="' + sid + '"]') || 'off-rubric',
        reason: reason, thread: [], ruling: null
      });
      if (iv.status === 'approved') iv.status = 'awaiting-review';
      M.save(); renderAll();
      return;
    }

    // reply on a flag
    if (t.dataset.post) {
      var fid = t.dataset.post;
      var text = val('[data-reply="' + fid + '"]');
      if (!text) return;
      flagById(fid).thread.push({ by: M.meId, at: M.now(), text: text });
      M.save(); renderAll();
      return;
    }

    // rule on a flag (HR only)
    if (t.dataset.rule) {
      var f = flagById(t.dataset.fid);
      var note = val('[data-reply="' + t.dataset.fid + '"]');
      if (!note) { alert('A ruling has to say why. Write the reason first.'); return; }
      f.ruling = { by: M.meId, at: M.now(), outcome: t.dataset.rule, text: note };
      if (t.dataset.rule !== 'allowed') {
        var s = seg(f.segId);
        if (s) s.excluded = true;
      }
      M.save(); renderAll();
      return;
    }

    // approve / return
    if (t.id === 'approve') {
      if (t.getAttribute('aria-disabled') === 'true') {
        var missing = M.checks(iv).filter(function (c) { return !c.ok; });
        alert('This interview cannot be approved yet:\n\n' +
              missing.map(function (c) { return '• ' + c.label + ' — ' + c.detail; }).join('\n'));
        return;
      }
      iv.approvals.push({ by: M.meId, at: M.now(), decision: 'approved', note: val('#note') || 'Listened in full; scores match the evidence cited.' });
      iv.status = 'approved';
      M.save(); renderAll();
      return;
    }

    if (t.id === 'return') {
      var rnote = val('#note');
      if (!rnote) { alert('Say what has to change. A return with no note gives the panel nothing to act on.'); return; }
      iv.approvals.push({ by: M.meId, at: M.now(), decision: 'changes', note: rnote });
      iv.status = 'changes-requested';
      M.save(); renderAll();
      return;
    }

    // record the decision (sponsor only)
    if (t.dataset.decide) {
      var dnote = val('#dnote');
      if (!dnote) { alert('Record the reason against the rubric.'); return; }
      iv.decision = { by: M.meId, at: M.now(), outcome: t.dataset.decide, note: dnote };
      iv.status = 'decided';
      M.save(); renderAll();
    }
  });

  // keyboard support for the score buttons
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.dataset && e.target.dataset.score) {
      e.preventDefault(); e.target.click();
    }
  });

  // evidence saves as it is typed, without re-rendering under the cursor
  document.addEventListener('input', function (e) {
    if (e.target.dataset && e.target.dataset.ev) saveEvidence(e.target.dataset.ev, e.target.value);
  });

  function saveEvidence(cid, text) {
    iv.scores[M.meId] = iv.scores[M.meId] || {};
    iv.scores[M.meId][cid] = iv.scores[M.meId][cid] || { score: null, evidence: '' };
    iv.scores[M.meId][cid].evidence = text;
    M.save();
    renderChecks(); renderActions();
  }

  function flagById(id) {
    return iv.flags.filter(function (f) { return f.id === id; })[0];
  }

  renderAll();
  setupPlayer();
})();
