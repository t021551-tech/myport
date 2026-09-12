/* Live recording and checking.
   Three jobs: get the room into text, decide what to make of each question as
   it is asked, and write the result into the same interview record the rest of
   the workspace reads.

   The check runs in two tiers. The rule tier below always runs, in the browser,
   with no key and no network: it matches against the approved bank and looks
   for the question categories that have no business in an interview. Where the
   page is published somewhere Claude can be reached (`claude.use('sample')`),
   the transcript is also sent for a reading in plain language, and that is
   shown alongside — labelled, never silently merged. */

(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  // ── the rule tier ────────────────────────────────────────────
  var STOP = ('a an the and or but of to in on for with your you we us our i me my it is are was were do does did can could would should how what why when where which who tell give walk take describe about that this they them their as at by from if then so be been being have has had will shall may might there here into over under again very just also'
             ).split(' ');

  function words(s) {
    return String(s || '').toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/).filter(Boolean);
  }

  function keyWords(s) {
    return words(s).filter(function (w) { return w.length > 2 && STOP.indexOf(w) === -1; });
  }

  /* Dice coefficient over the content words: how much of the question asked is
     the question in the bank, in both directions. */
  function similarity(a, b) {
    var A = keyWords(a), B = keyWords(b);
    if (!A.length || !B.length) return 0;
    var seen = {}, hit = 0;
    B.forEach(function (w) { seen[w] = (seen[w] || 0) + 1; });
    A.forEach(function (w) { if (seen[w]) { seen[w]--; hit++; } });
    return (2 * hit) / (A.length + B.length);
  }

  /* Categories that are not a matter of taste: an answer to any of these can
     only carry information the role cannot lawfully or fairly be scored on. */
  var PROHIBITED = [
    { cat: 'family', label: 'Family, marriage or pregnancy',
      why: 'The answer can only tell the panel something the role cannot be scored on. If the role has travel or hours requirements, put the requirement to every candidate instead.',
      re: /\b(children|kids|family plans?|start a family|pregnan\w*|expecting|married|marriage|husband|wife|spouse|divorc\w*|maternity)\b|(حامل|الحمل|متزوج|زواج|أطفال|زوجها|زوجته)/i },
    { cat: 'age', label: 'Age or date of birth',
      why: 'Age is not a criterion. Ask about the experience the role needs, which is what you actually mean.',
      re: /\b(how old are you|your age|date of birth|when were you born|what year were you born|how old)\b|(كم عمرك|تاريخ الميلاد)/i },
    { cat: 'origin', label: 'Nationality, origin, tribe or religion',
      why: 'None of these predict performance, and asking marks the process as unsafe for the candidate to be honest in.',
      re: /\b(nationality|citizenship|where are you (originally |really )?from|your origins?|which tribe|your tribe|religio\w*|which sect|do you pray|mosque|church)\b|(الجنسية|أصلك|قبيلتك|القبيلة|الديانة|المذهب|طائفة)/i },
    { cat: 'health', label: 'Health, disability or medical history',
      why: 'Ask whether the candidate can do the tasks the job is made of, with adjustments, and ask it of everyone.',
      re: /\b(disab\w*|health condition|medical (history|condition)|any illness|chronic|sick leave|mental health|therapy|medication|surgery)\b|(إعاقة|مرضك|حالتك الصحية|علاج نفسي)/i },
    { cat: 'gender', label: 'Framed around the candidate&rsquo;s gender',
      why: 'The question is being put to this candidate in a way it would not be put to another. Ask the underlying question straight.',
      re: /\b(as a (woman|man|female|male)|being a (woman|man)|because you(&#39;re| are) a (woman|man)|for a (woman|lady)|female candidate)\b|(كونك امرأة|كونك رجل)/i },
    { cat: 'personal', label: 'Home life, commute or living arrangements',
      why: 'Availability is a requirement of the post. State the requirement and ask every candidate if they can meet it.',
      re: /\b(live with your (parents|family)|do you live alone|your commute|how far do you live|who looks after|childcare|does your (husband|wife|family) (mind|allow))\b|(تسكن مع|المواصلات|من يعتني)/i },
    { cat: 'politics', label: 'Political affiliation',
      why: 'Not a criterion, and not answerable safely.',
      re: /\b(political (views|party|affiliation)|who did you vote|which party)\b|(انتماء سياسي|لمن صوت)/i },
    { cat: 'pay-history', label: 'What the candidate currently earns',
      why: 'Pay history carries other employers&rsquo; bias into your offer. Tell them the range for the post instead.',
      re: /\b(current salary|salary history|how much (do|did) you (currently )?(earn|make)|what are you (currently )?(paid|earning))\b|(راتبك الحالي|كم راتبك)/i }
  ];

  var LEADING = /\b(don'?t you (think|agree)|wouldn'?t you (agree|say)|surely you|isn'?t it true|you would agree|i assume you)\b/i;

  var QUESTION_OPENERS = /^(what|how|why|when|where|which|who|whom|whose|can|could|would|will|do|does|did|are|is|was|were|have|has|had|tell|talk|walk|describe|give|explain|take us|suppose|imagine|say)\b|^(ما|ماذا|كيف|لماذا|متى|أين|من|هل|أخبرنا|صف|اشرح)/i;

  function isQuestion(text) {
    var t = String(text || '').trim();
    if (!t) return false;
    if (/[?؟]\s*$/.test(t)) return true;
    if (QUESTION_OPENERS.test(t) && words(t).length <= 45) return true;
    return false;
  }

  /* What to make of one question, against one vacancy's bank. */
  function checkQuestion(text, roleId) {
    var risks = [];
    PROHIBITED.forEach(function (p) {
      if (p.re.test(text)) risks.push({ cat: p.cat, label: p.label, why: p.why });
    });
    if (LEADING.test(text)) {
      risks.push({ cat: 'leading', label: 'Leading question',
        why: 'The question carries its own answer, so what comes back is agreement rather than evidence.' });
    }

    var best = null;
    M.state.questions.forEach(function (q) {
      if (q.roleId !== roleId || q.status !== 'approved') return;
      var s = similarity(text, q.text);
      if (!best || s > best.score) best = { q: q, score: s };
    });

    var retired = null;
    M.state.questions.forEach(function (q) {
      if (q.status !== 'retired') return;
      var s = similarity(text, q.text);
      if (s >= 0.5 && (!retired || s > retired.score)) retired = { q: q, score: s };
    });

    var verdict;
    var hard = risks.filter(function (r) { return r.cat !== 'leading'; });
    if (hard.length) verdict = 'prohibited';
    else if (retired) verdict = 'retired';
    else if (best && best.score >= 0.5) verdict = 'banked';
    else if (best && best.score >= 0.32) verdict = 'near';
    else verdict = 'unscripted';

    var q = (verdict === 'banked' || verdict === 'near') ? best.q : null;
    return {
      verdict: verdict,
      question: q,
      retired: retired && retired.q,
      score: best ? best.score : 0,
      criterion: q && q.criterionId ? M.criterion(roleId, q.criterionId) : null,
      risks: risks
    };
  }

  /* What the answer looks like from the outside. Deliberately not a score —
     these are prompts for the panel, and the review screen is where scoring
     happens, against the recording. */
  function answerSignals(text) {
    var n = words(text).length;
    var sig = {
      length: n,
      example: /\b(for example|for instance|when i|we had|last year|in my (last|previous)|i once|at my)\b/i.test(text),
      numbers: /\d/.test(text),
      reasoning: /\b(because|so that|which meant|the reason|therefore|as a result|in order to)\b/i.test(text),
      caveat: /\b(however|although|the risk|the limitation|what i would change|in hindsight|i was wrong|it did not work)\b/i.test(text)
    };
    var read = [];
    if (n < 25) read.push('very short — worth a follow-up before anyone scores it');
    if (sig.example) read.push('names a specific case'); else if (n >= 25) read.push('stays general — no specific case yet');
    if (sig.reasoning) read.push('gives reasons, not just actions');
    if (sig.caveat) read.push('names a limitation of their own work');
    if (sig.numbers) read.push('cites figures');
    sig.read = read;
    return sig;
  }

  window.LiveCheck = { similarity: similarity, isQuestion: isQuestion, checkQuestion: checkQuestion, answerSignals: answerSignals };

  // ── state for this session ───────────────────────────────────
  var turns = [];          // {kind:'q'|'a', text, at, dur, check, signals, ai}
  var started = 0, timer = null, rec = null, media = null, stream = null, audioUrl = null;
  var recording = false, aiNote = null;

  function roleId() { return $('s-role').value; }
  function elapsed() { return started ? (Date.now() - started) / 1000 : 0; }

  // ── speech ───────────────────────────────────────────────────
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  function support() {
    if (!SR) {
      $('support-note').innerHTML = '<strong>This browser will not transcribe live.</strong> ' +
        'Live transcription uses the browser&rsquo;s own speech recognition, which today means Chrome or Edge. ' +
        'The microphone will still record here, and you can paste a transcript below to run the same checks over it.';
    } else {
      $('support-note').innerHTML = 'Transcription runs in your browser. Audio stays on this machine — nothing is uploaded by this page.';
    }
  }

  function startSpeech() {
    if (!SR) return;
    rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = $('s-lang').value;
    rec.onresult = function (e) {
      var interim = '';
      for (var i = e.resultIndex; i < e.results.length; i++) {
        var r = e.results[i];
        if (r.isFinal) addTurn(r[0].transcript.trim(), elapsed());
        else interim += r[0].transcript;
      }
      var line = $('live-line');
      line.hidden = !interim;
      line.textContent = interim;
    };
    rec.onerror = function (e) {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        $('mic-note').textContent = 'The browser blocked the microphone.';
        stopAll();
      }
    };
    rec.onend = function () { if (recording) { try { rec.start(); } catch (err) {} } };
    try { rec.start(); } catch (err) {}
  }

  // ── microphone ───────────────────────────────────────────────
  function startMic() {
    return navigator.mediaDevices.getUserMedia({ audio: true }).then(function (s) {
      stream = s;
      try {
        media = new MediaRecorder(s);
        var chunks = [];
        media.ondataavailable = function (e) { if (e.data.size) chunks.push(e.data); };
        media.onstop = function () {
          if (audioUrl) URL.revokeObjectURL(audioUrl);
          audioUrl = URL.createObjectURL(new Blob(chunks, { type: media.mimeType || 'audio/webm' }));
          renderSummary();
        };
        media.start();
      } catch (err) { /* recording the audio is optional; the transcript is not */ }

      // a level meter, so it is obvious the room is being heard
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var an = ctx.createAnalyser();
      an.fftSize = 512;
      ctx.createMediaStreamSource(s).connect(an);
      var buf = new Uint8Array(an.frequencyBinCount);
      $('level-wrap').hidden = false;
      (function meter() {
        if (!recording) { $('level').style.width = '0%'; ctx.close(); return; }
        an.getByteTimeDomainData(buf);
        var peak = 0;
        for (var i = 0; i < buf.length; i++) peak = Math.max(peak, Math.abs(buf[i] - 128));
        $('level').style.width = Math.min(100, peak / 90 * 100) + '%';
        requestAnimationFrame(meter);
      })();
    });
  }

  // ── turns ────────────────────────────────────────────────────
  function addTurn(text, at) {
    if (!text) return;
    var q = isQuestion(text);
    var turn = { kind: q ? 'q' : 'a', text: text, at: at, dur: 0 };
    if (q) turn.check = checkQuestion(text, roleId());
    else turn.signals = answerSignals(text);

    // close the previous turn's duration against this one
    var prev = turns[turns.length - 1];
    if (prev) prev.dur = Math.max(1, at - prev.at);
    turns.push(turn);
    renderTurns(); renderSummary();
  }

  function lastDur() {
    var prev = turns[turns.length - 1];
    if (prev && !prev.dur) prev.dur = Math.max(1, elapsed() - prev.at);
  }

  // ── rendering ────────────────────────────────────────────────
  var VERDICT = {
    banked:     ['green', 'In the approved bank'],
    near:       ['amber', 'Close to a bank question'],
    unscripted: ['amber', 'Not in the bank'],
    retired:    ['red',   'A retired question'],
    prohibited: ['red',   'Should not have been asked']
  };

  function renderTurns() {
    if (!turns.length) return;
    $('turns-note').textContent = 'Questions are matched against the bank for ' +
      M.role(roleId()).title + '. Answers are grouped under the question they follow.';

    var html = '';
    turns.forEach(function (t, i) {
      if (t.kind === 'q') {
        var c = t.check, v = VERDICT[c.verdict];
        html += '<li class="seg' + (c.verdict === 'banked' ? '' : ' unscripted') + '">' +
          '<div class="seg-top">' +
            '<span class="t mono">' + M.clock(t.at) + '</span>' +
            '<span class="pill ' + v[0] + '"><i class="dot"></i>' + v[1] + '</span>' +
            (c.question ? '<span class="pill grey mono">' + M.esc(c.question.id) + '</span>' : '') +
          '</div>' +
          '<p class="seg-q" style="margin:0">' + M.esc(t.text) + '</p>' +
          (c.criterion ? '<p class="small muted" style="margin:0">Scores against: ' + M.esc(c.criterion.name) + '</p>' : '') +
          (c.verdict === 'near'
            ? '<p class="small" style="margin:0;color:var(--amber)">Nearest is ' + M.esc(c.question.id) + ' — &ldquo;' +
              M.esc(c.question.text) + '&rdquo; Confirm it was the same question before scoring it as one.</p>' : '') +
          (c.verdict === 'unscripted'
            ? '<p class="small" style="margin:0;color:var(--amber)">No question in the bank covers this, so there is no criterion for the answer to land on. It will be flagged for the panellist to account for.</p>' : '') +
          (c.verdict === 'retired'
            ? '<p class="small" style="margin:0;color:var(--flag)">This is ' + M.esc(c.retired.id) + ', retired from the bank. ' + M.esc(c.retired.note || '') + '</p>' : '') +
          c.risks.map(function (r) {
            return '<div class="msg open"><div class="m-head"><b>' + r.label + '</b></div>' + r.why + '</div>';
          }).join('') +
          (t.ai ? aiBlock(t.ai) : '') +
        '</li>';
      } else {
        var s = t.signals;
        html += '<li class="seg" style="border-style:dashed">' +
          '<div class="seg-top"><span class="t mono">' + M.clock(t.at) + '</span>' +
            '<span class="pill blue">Answer</span>' +
            '<span class="small muted mono">' + s.length + ' words</span></div>' +
          '<p class="seg-x">' + M.esc(t.text) + '</p>' +
          (s.read.length ? '<p class="small muted" style="margin:0">' + M.esc(s.read.join(' · ')) + '</p>' : '') +
          (t.ai ? aiBlock(t.ai) : '') +
        '</li>';
      }
    });
    $('turns').innerHTML = html;
  }

  function aiBlock(ai) {
    return '<div class="msg ruling"><div class="m-head"><b>Claude&rsquo;s read</b></div>' + M.esc(ai) + '</div>';
  }

  function renderSummary() {
    var qs = turns.filter(function (t) { return t.kind === 'q'; });
    var bad = qs.filter(function (t) { return t.check.verdict === 'prohibited' || t.check.verdict === 'retired'; });
    var off = qs.filter(function (t) { return t.check.verdict === 'unscripted' || t.check.verdict === 'near'; });
    var asked = {};
    qs.forEach(function (t) { if (t.check.question) asked[t.check.question.id] = true; });
    var core = M.coreQuestions(roleId());
    var got = core.filter(function (q) { return asked[q.id]; }).length;

    var candSec = 0, panSec = 0;
    turns.forEach(function (t) { (t.kind === 'a' ? candSec += t.dur : panSec += t.dur); });
    var share = candSec + panSec ? candSec / (candSec + panSec) : 0;

    $('summary').innerHTML =
      '<ul class="checklist">' +
        '<li class="' + (got === core.length ? 'done' : 'todo') + '"><span class="box">' + (got === core.length ? '&check;' : '&middot;') + '</span>' +
          '<span>Core questions asked<br><span class="small muted mono">' + got + ' of ' + core.length + '</span></span></li>' +
        '<li class="' + (bad.length ? 'todo' : 'done') + '"><span class="box">' + (bad.length ? '!' : '&check;') + '</span>' +
          '<span>Questions that should not be asked<br><span class="small muted mono">' + bad.length + '</span></span></li>' +
        '<li class="' + (off.length ? 'todo' : 'done') + '"><span class="box">' + (off.length ? '&middot;' : '&check;') + '</span>' +
          '<span>Questions outside the bank<br><span class="small muted mono">' + off.length + '</span></span></li>' +
        '<li class="' + (share >= 0.5 ? 'done' : 'todo') + '"><span class="box">' + (share >= 0.5 ? '&check;' : '&middot;') + '</span>' +
          '<span>Candidate doing the talking<br><span class="small muted mono">' + M.pct(share) + ' of the time</span></span></li>' +
      '</ul>' +
      (audioUrl ? '<div style="margin-top:.8rem"><p class="small muted" style="margin:0 0 .3rem">The recording</p>' +
        '<audio controls src="' + audioUrl + '" style="width:100%"></audio></div>' : '') +
      (aiNote ? '<div class="msg ruling" style="margin-top:.8rem"><div class="m-head"><b>Claude on the interview as a whole</b></div>' + M.esc(aiNote) + '</div>' : '');

    var can = turns.length > 0 && !recording;
    $('save').setAttribute('aria-disabled', String(!can));
    $('save-note').textContent = !turns.length ? 'Record something first.'
      : recording ? 'Stop the recording first.'
      : 'Saves ' + turns.filter(function (t) { return t.kind === 'q'; }).length + ' questions and ' +
        (bad.length + off.length) + ' flag' + (bad.length + off.length === 1 ? '' : 's') + ' into the queue.';
  }

  // ── the model tier ───────────────────────────────────────────
  var sample = null;

  function findModel() {
    if (!window.claude || !window.claude.use) {
      $('engine-note').innerHTML = '<strong>The checks on this page run in your browser.</strong> They match the bank word by word and look for the question categories that have no place in an interview. ' +
        'Published where Claude can be reached, this page also sends the transcript for a reading in plain language — that is not available here, so what you see is the rule check alone.';
      return;
    }
    window.claude.use('sample').then(function (s) {
      sample = s;
      $('engine-note').innerHTML = s
        ? 'Two passes. The <strong>rule check</strong> runs in your browser as each question is asked. When you stop, the transcript also goes to <strong>Claude</strong> for a reading of the questions and the answers, shown against each turn. Claude sees the transcript, not the audio.'
        : 'The checks on this page run in your browser: the bank match and the prohibited-question categories. Claude is not reachable from this view, so there is no second reading.';
    }).catch(function () { sample = null; });
  }

  function askClaude() {
    if (!sample || !turns.length) return;
    var role = M.role(roleId());
    var bank = M.state.questions.filter(function (q) { return q.roleId === role.id && q.status === 'approved'; })
      .map(function (q) {
        var c = M.criterion(role.id, q.criterionId);
        return q.id + ' (' + (c ? c.name : 'no criterion') + '): ' + q.text;
      }).join('\n');

    var script = turns.map(function (t, i) {
      return i + '. [' + (t.kind === 'q' ? 'PANEL' : 'CANDIDATE') + '] ' + t.text;
    }).join('\n');

    $('engine-note').innerHTML = 'Sending the transcript to Claude&hellip;';

    sample.json(
      'You are helping a hiring panel at a research foundation review an interview they just recorded. ' +
      'The transcript is rough — it comes from live speech recognition, so expect errors, and do not comment on wording slips.\n\n' +
      'The vacancy is ' + role.title + '. The criteria are: ' +
      role.criteria.map(function (c) { return c.name + ' (' + c.weight + '%)'; }).join('; ') + '.\n\n' +
      'The approved question bank is:\n' + bank + '\n\n' +
      'The transcript, one turn per line:\n' + script + '\n\n' +
      'For each PANEL turn, say whether it matches a bank question (give its id), or is outside the bank, ' +
      'or should not have been asked at all because the answer can only carry information a candidate must not be ' +
      'judged on (family, pregnancy, age, nationality, religion, health, home life, politics, pay history) — and why, in one sentence a panellist would accept.\n' +
      'For each CANDIDATE turn, say in one sentence what evidence the answer actually offers, against which criterion, ' +
      'and what a reviewer should listen back to. Never give a score and never guess at anything the candidate did not say.\n' +
      'Also give one short paragraph on the interview as a whole: what was missed, and what the panel should do before scoring.\n\n' +
      'Reply as JSON: {"turns": [{"index": <number>, "note": "<one or two sentences>"}], "overall": "<one paragraph>"}',
      { modelTier: 'default' }
    ).then(function (out) {
      (out && out.turns || []).forEach(function (r) {
        var t = turns[r.index];
        if (t && r.note) t.ai = r.note;
      });
      aiNote = out && out.overall || null;
      findModel();
      renderTurns(); renderSummary();
    }).catch(function (e) {
      $('engine-note').innerHTML = e && e.code === 'not_granted'
        ? 'Claude was not granted to this page, so only the browser checks ran.'
        : 'Claude could not be reached just now, so only the browser checks ran. ' +
          'They are complete on their own — the bank match and the prohibited categories do not depend on it.';
    });
  }

  // ── controls ─────────────────────────────────────────────────
  function startAll() {
    turns = []; aiNote = null;
    started = Date.now(); recording = true;
    $('start').hidden = true; $('stop').hidden = false;
    $('rec-state').className = 'pill red';
    $('rec-state').innerHTML = '<i class="dot"></i>Recording';
    $('mic-note').textContent = '';
    ['s-role', 's-code', 's-lang'].forEach(function (id) { $(id).disabled = true; });

    timer = setInterval(function () { $('elapsed').textContent = M.clock(elapsed()); }, 500);

    startMic().then(startSpeech).catch(function () {
      $('mic-note').textContent = 'No microphone available. You can still paste a transcript below.';
      stopAll();
    });
    renderTurns(); renderSummary();
  }

  function stopAll() {
    recording = false;
    lastDur();
    clearInterval(timer);
    if (rec) { try { rec.stop(); } catch (e) {} rec = null; }
    if (media && media.state !== 'inactive') media.stop();
    if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
    $('start').hidden = false; $('stop').hidden = true;
    $('live-line').hidden = true;
    $('rec-state').className = 'pill grey';
    $('rec-state').innerHTML = '<i class="dot"></i>Stopped';
    ['s-role', 's-code', 's-lang'].forEach(function (id) { $(id).disabled = false; });
    renderSummary();
    askClaude();
  }

  // ── saving into the record ───────────────────────────────────
  function save() {
    if ($('save').getAttribute('aria-disabled') === 'true') {
      alert(turns.length ? 'Stop the recording first.' : 'There is nothing to save yet.');
      return;
    }
    var role = M.role(roleId());
    var code = ($('s-code').value || '').trim() || 'C-' + Math.floor(2100 + Math.random() * 800);
    var id = 'INT-' + code.replace(/^C-/, '');
    var segments = [], flags = [], n = 0;

    turns.forEach(function (t, i) {
      if (t.kind !== 'q') return;
      var answer = turns[i + 1] && turns[i + 1].kind === 'a' ? turns[i + 1] : null;
      var sid = 's' + (++n);
      var end = answer ? answer.at + answer.dur : t.at + t.dur;
      segments.push({
        id: sid,
        start: Math.round(t.at),
        end: Math.round(end),
        qid: t.check.verdict === 'banked' ? t.check.question.id : null,
        label: t.check.verdict === 'banked' ? null : t.text,
        candidateSec: Math.round(answer ? answer.dur : 0),
        panelSec: Math.round(t.dur),
        excerpt: answer ? answer.text : 'No answer was captured for this question.'
      });

      if (t.check.verdict !== 'banked') {
        var hard = t.check.risks.filter(function (r) { return r.cat !== 'leading'; });
        flags.push({
          id: 'f' + Date.now() + n,
          segId: sid,
          raisedBy: M.meId,
          raisedAt: M.now(),
          category: hard.length ? 'prohibited' : t.check.verdict === 'retired' ? 'prohibited' : 'off-rubric',
          reason: 'Raised from the live check. ' +
            (hard.length ? hard[0].label + ': ' + hard[0].why.replace(/&rsquo;/g, "'")
             : t.check.verdict === 'retired' ? 'This question was retired from the bank. ' + (t.check.retired.note || '')
             : 'No question in the approved bank covers this, so the answer maps to no criterion.') +
            ' Asked at ' + M.clock(t.at) + ': "' + t.text + '"',
          thread: [], ruling: null
        });
      }
    });

    var candSec = 0, panSec = 0;
    turns.forEach(function (t) { (t.kind === 'a' ? candSec += t.dur : panSec += t.dur); });

    var slots = M.state.interviews.filter(function (v) { return v.date === new Date().toISOString().slice(0, 10); }).length;

    M.state.interviews.push({
      id: id, roleId: role.id, code: code, name: code,
      date: new Date().toISOString().slice(0, 10),
      slot: slots + 1,
      durationSec: Math.max(60, Math.round(elapsed() || (candSec + panSec))),
      chair: M.meId,
      panel: role.panel.indexOf(M.meId) > -1 ? role.panel : role.panel.concat([M.meId]),
      status: 'scoring',
      segments: segments,
      scores: {},
      flags: flags,
      approvals: [],
      listened: {},
      listenedBuckets: {},
      source: 'live'
    });
    M.save();
    location.href = 'review.html?id=' + id;
  }

  // ── wiring ───────────────────────────────────────────────────
  $('s-role').innerHTML = M.state.roles.map(function (r) {
    return '<option value="' + r.id + '">' + M.esc(r.title) + '</option>';
  }).join('');

  $('start').addEventListener('click', startAll);
  $('stop').addEventListener('click', stopAll);
  $('save').addEventListener('click', save);
  $('s-role').addEventListener('change', function () {
    turns.forEach(function (t) { if (t.kind === 'q') t.check = checkQuestion(t.text, roleId()); });
    renderTurns(); renderSummary();
  });

  $('paste-go').addEventListener('click', function () {
    var lines = $('paste').value.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
    if (!lines.length) return;
    turns = []; aiNote = null; started = 0;
    var at = 0;
    lines.forEach(function (line) {
      var t = { kind: isQuestion(line) ? 'q' : 'a', text: line, at: at, dur: Math.max(4, words(line).length / 2.5) };
      if (t.kind === 'q') t.check = checkQuestion(line, roleId());
      else t.signals = answerSignals(line);
      turns.push(t);
      at += t.dur;
    });
    recording = false;
    $('elapsed').textContent = M.clock(at);
    renderTurns(); renderSummary();
    askClaude();
  });

  support();
  findModel();
  renderSummary();
})();
