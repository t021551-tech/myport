/* The question bank: what may be asked, what was asked anyway, and what has
   been retired. Clarification threads are answered from here or from the
   review screen — they are the same records either way. */

(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  var CATS = {
    'off-rubric': 'Outside the rubric',
    'prohibited': 'Should not have been asked',
    'unclear': 'Unclear or leading',
    'parity': 'Asked of this candidate only'
  };
  var OUTCOMES = {
    allowed: 'Allowed to stand',
    excluded: 'Excluded from scoring',
    retrain: 'Excluded, panellist referred for retraining'
  };

  // every flag in the round, newest first, unresolved before resolved
  function allFlags() {
    var out = [];
    M.state.interviews.forEach(function (iv) {
      iv.flags.forEach(function (f) {
        var s = iv.segments.filter(function (x) { return x.id === f.segId; })[0];
        out.push({ iv: iv, seg: s, flag: f });
      });
    });
    return out.sort(function (a, b) {
      if (!!a.flag.ruling !== !!b.flag.ruling) return a.flag.ruling ? 1 : -1;
      return a.flag.raisedAt < b.flag.raisedAt ? 1 : -1;
    });
  }

  function renderClarifications() {
    var rows = allFlags();
    var open = rows.filter(function (r) { return !r.flag.ruling; }).length;

    $('clar-note').innerHTML = open
      ? '<strong>' + open + ' question' + (open === 1 ? '' : 's') + ' still waiting on a ruling.</strong> ' +
        'An interview cannot be signed off while one of its questions is unresolved.'
      : 'Nothing is outstanding. Every question asked outside the bank has been ruled on.';

    $('clarifications').innerHTML = rows.map(function (r) {
      var f = r.flag, s = r.seg || { start: 0, excerpt: '', label: '' };
      // a flag can sit on an approved question too — name it correctly either way
      var asked = s.label || (s.qid && M.question(s.qid) ? M.question(s.qid).text : 'Question outside the bank');

      var thread = f.thread.map(function (m) {
        return '<div class="msg"><div class="m-head"><b>' + M.esc(M.person(m.by).name) + '</b> &middot; ' +
          M.esc(m.at) + '</div>' + M.esc(m.text) + '</div>';
      }).join('');

      var foot;
      if (f.ruling) {
        foot = '<div class="msg ruling"><div class="m-head"><b>Ruling by ' + M.esc(M.person(f.ruling.by).name) +
          '</b> &middot; ' + M.esc(f.ruling.at) + ' <span class="pill green">' +
          M.esc(OUTCOMES[f.ruling.outcome]) + '</span></div>' + M.esc(f.ruling.text) + '</div>';
      } else {
        foot = '<div class="field" style="margin-top:.7rem"><label for="r-' + f.id + '">' +
            (M.can('rule') ? 'Your ruling, or a question back to the panellist' : 'Your reply') + '</label>' +
            '<textarea id="r-' + f.id + '" data-reply="' + f.id + '"></textarea></div>' +
          '<div class="btn-row"><button class="btn sm ghost" type="button" data-post="' + f.id + '">Post reply</button>' +
          (M.can('rule')
            ? '<button class="btn sm" type="button" data-rule="allowed" data-fid="' + f.id + '">Allow</button>' +
              '<button class="btn sm danger" type="button" data-rule="excluded" data-fid="' + f.id + '">Exclude from scoring</button>' +
              '<button class="btn sm danger" type="button" data-rule="retrain" data-fid="' + f.id + '">Exclude &amp; refer</button>'
            : '<span class="hint" style="margin:0">Only HR can close this.</span>') + '</div>';
      }

      return '<article class="card" data-iv="' + r.iv.id + '">' +
        '<div class="btn-row" style="margin-bottom:.5rem">' +
          '<span class="pill ' + (f.ruling ? 'green' : 'red') + '"><i class="dot"></i>' +
            (f.ruling ? 'Ruled' : 'Open') + '</span>' +
          '<span class="pill grey">' + M.esc(CATS[f.category] || f.category) + '</span>' +
          (s.qid ? '<span class="pill green mono">' + M.esc(s.qid) + '</span>' : '<span class="pill red">Unscripted</span>') +
          '<span class="pill grey mono">' + M.esc(r.iv.code) + ' &middot; ' + M.clock(s.start) + '</span>' +
          '<span class="small muted">' + M.esc(M.role(r.iv.roleId).title) + '</span>' +
        '</div>' +
        '<h3>' + M.esc(asked) + '</h3>' +
        '<p class="seg-x" style="margin:.5rem 0 .7rem">' + M.esc(s.excerpt) + '</p>' +
        '<div class="msg' + (f.ruling ? '' : ' open') + '"><div class="m-head"><b>' + M.esc(M.person(f.raisedBy).name) +
          '</b> raised this &middot; ' + M.esc(f.raisedAt) + '</div>' + M.esc(f.reason) + '</div>' +
        (thread ? '<div class="thread">' + thread + '</div>' : '') +
        foot +
        '<p class="small" style="margin:.8rem 0 0"><a href="review.html?id=' + r.iv.id + '">Listen to this answer in context &rarr;</a></p>' +
      '</article>';
    }).join('') || '<p class="empty">No questions have been flagged in this round.</p>';
  }

  function usage(qid) {
    var n = 0;
    M.state.interviews.forEach(function (iv) {
      if (iv.segments.some(function (s) { return s.qid === qid; })) n++;
    });
    return n;
  }

  function renderBank() {
    $('bank').innerHTML = M.state.roles.map(function (role) {
      var qs = M.state.questions.filter(function (q) { return q.roleId === role.id && q.status === 'approved'; });
      var ivs = M.state.interviews.filter(function (i) { return i.roleId === role.id; }).length;

      var rows = role.criteria.map(function (c) {
        var mine = qs.filter(function (q) { return q.criterionId === c.id; });
        return '<tr><td><strong>' + M.esc(c.name) + '</strong><br><span class="small muted mono">weight ' +
          c.weight + '%</span></td><td>' +
          (mine.length
            ? mine.map(function (q) {
                var used = usage(q.id);
                return '<div style="margin-bottom:.45rem"><span class="pill ' + (q.kind === 'core' ? 'green' : 'blue') +
                  ' mono">' + M.esc(q.id) + '</span> ' + M.esc(q.text) +
                  '<br><span class="small muted">' + (q.kind === 'core' ? 'Core &mdash; asked of every candidate' : 'Probe &mdash; used when an answer needs pushing') +
                  ' &middot; asked in ' + used + ' of ' + ivs + ' interviews</span></div>';
              }).join('')
            : '<span class="small" style="color:var(--flag)">No question covers this criterion &mdash; it cannot be scored fairly.</span>') +
          '</td></tr>';
      }).join('');

      return '<div class="card" style="margin-bottom:1rem">' +
        '<h3>' + M.esc(role.title) + ' <span class="pill grey mono">' + M.esc(role.id) + '</span></h3>' +
        '<p class="small muted">' + M.esc(role.dept) + ' &middot; ' + role.openings + ' opening' +
          (role.openings === 1 ? '' : 's') + ' &middot; panel: ' +
          role.panel.map(function (u) { return M.esc(M.person(u).name); }).join(', ') + '</p>' +
        '<div class="table-wrap" style="margin-top:.8rem"><table><thead><tr><th>Criterion</th><th>Questions</th></tr></thead>' +
        '<tbody>' + rows + '</tbody></table></div></div>';
    }).join('');
  }

  function renderProposed() {
    var props = M.state.questions.filter(function (q) { return q.status === 'proposed'; });
    if (!props.length) { $('proposed').innerHTML = ''; return; }
    $('proposed').innerHTML = '<h3 style="font-size:.95rem;margin-bottom:.5rem">Waiting on HR</h3>' +
      props.map(function (q) {
        var c = M.criterion(q.roleId, q.criterionId);
        return '<div class="msg open"><div class="m-head"><b>' + M.esc(M.person(q.by || M.meId).name) +
          '</b> proposed &middot; ' + M.esc(q.at || '') + ' <span class="pill grey">' + M.esc(M.role(q.roleId).title) +
          '</span> <span class="pill grey">' + M.esc(c ? c.name : '') + '</span></div>' + M.esc(q.text) +
          (M.can('rule')
            ? '<div class="btn-row" style="margin-top:.6rem"><button class="btn sm" type="button" data-approveq="' + q.id +
              '">Add to the bank</button><button class="btn sm danger" type="button" data-rejectq="' + q.id + '">Reject</button></div>'
            : '<p class="hint" style="margin:.5rem 0 0">HR has to approve this before it can be asked.</p>') +
          '</div>';
      }).join('');
  }

  function renderRetired() {
    $('retired').innerHTML = M.state.questions.filter(function (q) { return q.status === 'retired'; })
      .map(function (q) {
        return '<div class="card"><span class="pill red">Retired</span>' +
          '<h3 style="margin-top:.5rem">&ldquo;' + M.esc(q.text) + '&rdquo;</h3>' +
          '<p class="small muted" style="margin:.4rem 0 0">' + M.esc(q.note || '') + '</p></div>';
      }).join('') || '<p class="small muted">Nothing retired yet.</p>';
  }

  // ── the propose form ─────────────────────────────────────────
  function fillRoleSelect() {
    $('p-role').innerHTML = M.state.roles.map(function (r) {
      return '<option value="' + r.id + '">' + M.esc(r.title) + '</option>';
    }).join('');
    fillCritSelect();
  }

  function fillCritSelect() {
    var role = M.role($('p-role').value);
    $('p-crit').innerHTML = role.criteria.map(function (c) {
      return '<option value="' + c.id + '">' + M.esc(c.name) + '</option>';
    }).join('');
  }

  function renderAll() {
    renderClarifications(); renderBank(); renderProposed(); renderRetired();
  }

  function flagById(id) {
    var found = null;
    M.state.interviews.forEach(function (iv) {
      iv.flags.forEach(function (f) { if (f.id === id) found = { iv: iv, f: f }; });
    });
    return found;
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-post],[data-rule],[data-approveq],[data-rejectq],#p-add');
    if (!t) return;

    if (t.dataset.post) {
      var box = document.querySelector('[data-reply="' + t.dataset.post + '"]');
      if (!box.value.trim()) return;
      flagById(t.dataset.post).f.thread.push({ by: M.meId, at: M.now(), text: box.value.trim() });
      M.save(); renderAll();
      return;
    }

    if (t.dataset.rule) {
      var hit = flagById(t.dataset.fid);
      var note = document.querySelector('[data-reply="' + t.dataset.fid + '"]').value.trim();
      if (!note) { alert('A ruling has to say why. Write the reason first.'); return; }
      hit.f.ruling = { by: M.meId, at: M.now(), outcome: t.dataset.rule, text: note };
      if (t.dataset.rule !== 'allowed') {
        var s = hit.iv.segments.filter(function (x) { return x.id === hit.f.segId; })[0];
        if (s) s.excluded = true;
      }
      M.save(); renderAll();
      return;
    }

    if (t.dataset.approveq || t.dataset.rejectq) {
      var qid = t.dataset.approveq || t.dataset.rejectq;
      var q = M.question(qid);
      if (t.dataset.approveq) { q.status = 'approved'; }
      else {
        q.status = 'retired';
        q.note = 'Rejected by ' + M.person(M.meId).name + ' on ' + M.now() + ' — not added to the bank.';
      }
      M.save(); renderAll();
      return;
    }

    if (t.id === 'p-add') {
      var text = $('p-text').value.trim();
      if (!text) { alert('Write the question first.'); return; }
      M.state.questions.push({
        id: 'Q-NEW-' + (M.state.questions.length + 1),
        roleId: $('p-role').value,
        criterionId: $('p-crit').value,
        kind: 'core',
        status: M.can('rule') ? 'approved' : 'proposed',
        text: text,
        by: M.meId,
        at: M.now()
      });
      $('p-text').value = '';
      M.save(); renderAll();
    }
  });

  $('p-role').addEventListener('change', fillCritSelect);

  fillRoleSelect();
  renderAll();
})();
