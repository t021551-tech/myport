/* The fairness report. Everything here is read out of the interview records by
   M.metrics(); no figure is stored. */

(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var sel = $('f-role');

  M.state.roles.forEach(function (r) {
    var o = document.createElement('option');
    o.value = r.id; o.textContent = r.title;
    sel.appendChild(o);
  });

  function meter(label, value, good, detail) {
    var cls = value >= good ? '' : (value >= good - 0.15 ? 'warn' : 'bad');
    return '<div class="meter"><div class="m-top"><span>' + label + '</span><b class="mono">' +
      M.pct(value) + '</b></div><div class="track"><i class="' + cls + '" style="width:' +
      (value * 100) + '%"></i></div>' +
      (detail ? '<p class="hint">' + detail + '</p>' : '') + '</div>';
  }

  function renderStats(m) {
    var cards = [
      { k: 'Same questions asked', n: M.pct(m.parity),
        sub: 'of core questions put to each candidate', cls: m.parity === 1 ? 'good' : 'bad' },
      { k: 'Scores citing evidence', n: M.pct(m.evidence),
        sub: 'the rest cannot be checked by a reviewer', cls: m.evidence === 1 ? 'good' : 'warn' },
      { k: 'Panel within one point', n: M.pct(m.agreement),
        sub: 'of criteria where the panel broadly agreed', cls: m.agreement >= 0.8 ? 'good' : 'warn' },
      { k: 'Open question flags', n: m.openFlags,
        sub: m.unscripted + ' questions were asked outside the bank', cls: m.openFlags ? 'bad' : 'good' }
    ];
    $('stats').innerHTML = cards.map(function (c) {
      return '<div class="stat ' + c.cls + '"><span class="k">' + c.k + '</span><span class="n">' +
        c.n + '</span><p class="sub">' + c.sub + '</p></div>';
    }).join('');
  }

  /* The findings are generated, not written: each one is a rule read over the
     same records, ordered worst first. */
  function renderFindings(m) {
    var out = [];

    m.interviews.forEach(function (iv) {
      var open = M.openFlags(iv);
      if (open.length) {
        out.push({ sev: 0, title: iv.code + ': ' + open.length + ' question' + (open.length === 1 ? '' : 's') + ' waiting on a ruling',
          text: open.map(function (f) { return f.reason; }).join(' ') +
            ' <a href="questions.html">Rule on it &rarr;</a>' });
      }
      var missing = M.askedCore(iv).filter(function (c) { return !c.asked; });
      if (missing.length) {
        out.push({ sev: 0, title: iv.code + ': ' + missing.length + ' core question' + (missing.length === 1 ? '' : 's') + ' never asked',
          text: 'Missing ' + missing.map(function (c) { return c.q.id; }).join(', ') +
            '. Any criterion scored from this interview is scored on something other than an answer. ' +
            '<a href="review.html?id=' + iv.id + '">Open the interview &rarr;</a>' });
      }
      var role = M.role(iv.roleId);
      role.criteria.forEach(function (c) {
        var sp = M.spread(iv, c.id);
        if (sp > 2) out.push({ sev: 1, title: iv.code + ': panel ' + sp + ' points apart on ' + c.name.toLowerCase(),
          text: 'The panel heard the same answer and scored it very differently. It has to be talked through before sign-off. ' +
            '<a href="review.html?id=' + iv.id + '">Open the interview &rarr;</a>' });
      });
      var share = M.talkShare(iv);
      if (share < 0.5) out.push({ sev: 1, title: iv.code + ': candidate spoke ' + M.pct(share) + ' of the time',
        text: 'The panel used more of this interview than the candidate did. Check whether answers were supplied for them before scoring stands. ' +
          '<a href="review.html?id=' + iv.id + '">Listen &rarr;</a>' });
    });

    if (m.evidence < 1) {
      out.push({ sev: 1, title: M.pct(1 - m.evidence) + ' of scores cite no evidence',
        text: 'A score with nothing attached cannot be checked by anyone who was not in the room, which is the whole point of the review step.' });
    }

    m.leniency.forEach(function (l) {
      if (Math.abs(l.drift) >= 0.35 && l.n >= 5) {
        out.push({ sev: 1,
          title: M.person(l.uid).name + ' scores ' + (l.drift > 0 ? 'above' : 'below') + ' the panel by ' + Math.abs(l.drift).toFixed(2) + ' points',
          text: 'Measured across ' + l.n + ' scores against the panel average on the same answers. This is a calibration conversation, not a reason to re-score candidates.' });
      }
    });

    if (Math.abs(m.orderGap) > 4) {
      out.push({ sev: 1, title: 'Interviews later in the day score ' + Math.abs(m.orderGap).toFixed(1) + ' points ' + (m.orderGap > 0 ? 'lower' : 'higher'),
        text: 'On these numbers the slot a candidate was given may be doing some of the work the rubric should be doing. Rotate the order and keep the panel to fewer interviews a day.' });
    }

    if (!out.length) {
      out.push({ sev: 2, title: 'Nothing outstanding in this round',
        text: 'Every candidate got the same core questions, every score cites the recording, the panel agreed within a point, and no question is waiting on a ruling.' });
    }

    out.sort(function (a, b) { return a.sev - b.sev; });

    $('findings').innerHTML = out.map(function (f) {
      var cls = f.sev === 0 ? 'bad' : f.sev === 1 ? 'warn' : 'ok';
      var ic = f.sev === 0 ? '!' : f.sev === 1 ? '~' : '✓';
      return '<li class="finding ' + cls + '"><span class="ic" aria-hidden="true">' + ic + '</span>' +
        '<div><h4>' + M.esc(f.title) + '</h4><p>' + f.text + '</p></div></li>';
    }).join('');
  }

  function renderParity(m) {
    var roles = {};
    m.interviews.forEach(function (iv) { roles[iv.roleId] = true; });

    $('parity').innerHTML = Object.keys(roles).map(function (rid) {
      var core = M.coreQuestions(rid);
      var ivs = m.interviews.filter(function (i) { return i.roleId === rid; });
      var head = '<tr><th>Candidate</th>' + core.map(function (q) {
        return '<th class="mono" title="' + M.esc(q.text) + '">' + M.esc(q.id.replace(/^Q-/, '')) + '</th>';
      }).join('') + '<th>Unscripted</th></tr>';

      var rows = ivs.map(function (iv) {
        var asked = {};
        iv.segments.forEach(function (s) { if (s.qid) asked[s.qid] = true; });
        var uns = M.unscripted(iv).length;
        return '<tr><td class="mono"><a href="review.html?id=' + iv.id + '">' + M.esc(iv.code) + '</a></td>' +
          core.map(function (q) {
            return '<td>' + (asked[q.id]
              ? '<span style="color:var(--green)" title="asked">&#10003;</span>'
              : '<span style="color:var(--flag);font-weight:700" title="not asked">&times;</span>') + '</td>';
          }).join('') +
          '<td>' + (uns ? '<span class="pill red">' + uns + '</span>' : '<span class="muted">0</span>') + '</td></tr>';
      }).join('');

      return '<p class="small" style="font-weight:600;margin:.8rem 0 .3rem">' + M.esc(M.role(rid).title) + '</p>' +
        '<div class="table-wrap"><table style="min-width:420px"><thead>' + head + '</thead><tbody>' + rows + '</tbody></table></div>';
    }).join('');
  }

  function renderLeniency(m) {
    if (!m.leniency.length) { $('leniency').innerHTML = '<p class="small muted">No scores yet.</p>'; return; }
    var max = Math.max(0.5, Math.max.apply(null, m.leniency.map(function (l) { return Math.abs(l.drift); })));
    $('leniency').innerHTML = m.leniency.map(function (l) {
      var w = Math.abs(l.drift) / max * 50;
      var bad = Math.abs(l.drift) >= 0.35;
      return '<div class="meter"><div class="m-top"><span>' + M.esc(M.person(l.uid).name) +
        '</span><b class="mono" style="color:' + (bad ? 'var(--flag)' : 'var(--ink-2)') + '">' +
        (l.drift >= 0 ? '+' : '') + l.drift.toFixed(2) + '</b></div>' +
        '<div class="track" style="position:relative">' +
          '<i style="position:absolute;left:' + (l.drift >= 0 ? 50 : 50 - w) + '%;width:' + w +
            '%;background:' + (bad ? 'var(--flag)' : 'var(--green)') + '"></i>' +
          '<span style="position:absolute;left:50%;top:0;bottom:0;width:1px;background:var(--ink-soft)"></span>' +
        '</div>' +
        '<p class="hint">' + l.n + ' scores &middot; ' + (l.drift >= 0 ? 'above' : 'below') + ' the panel average</p></div>';
    }).join('');
  }

  function renderTalk(m) {
    $('talk').innerHTML = m.talk.map(function (t) {
      var bad = t.share < 0.5, warn = t.share < 0.6;
      return '<div class="meter"><div class="m-top"><span><a href="review.html?id=' + t.iv.id + '" class="mono">' +
        M.esc(t.iv.code) + '</a> <span class="muted small">' + M.esc(M.role(t.iv.roleId).title) + '</span></span>' +
        '<b class="mono">' + M.pct(t.share) + '</b></div>' +
        '<div class="track"><i class="' + (bad ? 'bad' : warn ? 'warn' : '') + '" style="width:' + (t.share * 100) + '%"></i></div></div>';
    }).join('') +
    '<p class="hint">Round average: ' + M.pct(m.talkMean) + ' of the recording was the candidate speaking.</p>';
  }

  function renderSlots(m) {
    if (!m.slots.length) { $('slots').innerHTML = ''; return; }
    $('slots').innerHTML = m.slots.map(function (s) {
      return '<div class="col" title="' + s.n + ' interview(s)">' +
        '<div class="barbox"><i style="height:' + s.mean + '%;background:var(--blue)"></i></div>' +
        '<span>' + s.mean.toFixed(0) + '</span><span>slot ' + s.slot + '</span></div>';
    }).join('');
    $('order-note').textContent = 'Bars are scored out of 100. ' + (Math.abs(m.orderGap) < 0.5
      ? 'No meaningful difference between early and late slots in this round.'
      : 'Later slots score ' + Math.abs(m.orderGap).toFixed(1) + ' points ' +
        (m.orderGap > 0 ? 'lower' : 'higher') + ' than earlier ones on average.');
  }

  function renderDist(m) {
    var max = Math.max.apply(null, m.dist) || 1;
    $('dist').innerHTML = m.dist.map(function (n, i) {
      return '<div class="col">' +
        '<div class="barbox"><i style="height:' + (n / max * 100) + '%"></i></div>' +
        '<span>' + n + '</span><span>score ' + (i + 1) + '</span></div>';
    }).join('');
  }

  function render() {
    var m = M.metrics(sel.value || null);
    renderStats(m); renderFindings(m); renderParity(m);
    renderLeniency(m); renderTalk(m); renderSlots(m); renderDist(m);
  }

  sel.addEventListener('change', render);
  render();
})();
