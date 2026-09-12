/* Seed data for the Munsif demo.
   Everything in this file is FICTIONAL sample content written to exercise the
   workspace: the candidates, panellists, recordings, scores and transcript
   excerpts do not describe real people or real KFAS interviews. The shape of
   the data is the point — it is what a live system would hold. */

window.KFAS_DATA = {
  version: '2026-09-11',

  people: {
    'u-huda':   { name: 'Huda Al-Rashed',    job: 'Panel chair',         unit: 'Research Directorate' },
    'u-yousef': { name: 'Yousef Al-Sabti',   job: 'Panel member',        unit: 'Programmes' },
    'u-mariam': { name: 'Mariam Al-Otaibi',  job: 'Panel member',        unit: 'Data Office' },
    'u-nadia':  { name: 'Nadia Al-Mutairi',  job: 'HR moderator',        unit: 'People & Culture' },
    'u-lina':   { name: 'Lina Haddad',       job: 'Independent reviewer',unit: 'Outside the panel' },
    'u-faisal': { name: 'Faisal Al-Duaij',   job: 'Hiring sponsor',      unit: 'Directorate' }
  },

  /* Who may do what. Reviewers listen and sign off; the sponsor records the
     final decision; HR rules on flagged questions. */
  permissions: {
    'u-huda':   { score: true,  review: false, rule: false, decide: false },
    'u-yousef': { score: true,  review: false, rule: false, decide: false },
    'u-mariam': { score: true,  review: false, rule: false, decide: false },
    'u-nadia':  { score: false, review: true,  rule: true,  decide: false },
    'u-lina':   { score: false, review: true,  rule: false, decide: false },
    'u-faisal': { score: false, review: true,  rule: false, decide: true }
  },

  roles: [
    {
      id: 'RPO',
      title: 'Research Programmes Officer',
      dept: 'Research Directorate',
      openings: 1,
      panel: ['u-huda', 'u-yousef', 'u-mariam'],
      criteria: [
        { id: 'c-domain', name: 'Research programme knowledge', weight: 25,
          anchors: { 1: 'Describes research funding only in general terms.', 3: 'Explains how a call is scoped and assessed, with one worked example.', 5: 'Compares funding instruments and names the trade-offs each one buys.' } },
        { id: 'c-analysis', name: 'Analysis and judgement', weight: 25,
          anchors: { 1: 'Reaches a view without saying what it rests on.', 3: 'Uses evidence to reach a defensible view and names one limitation.', 5: 'Weighs conflicting evidence, states the decision rule, and says what would change their mind.' } },
        { id: 'c-stake', name: 'Working with researchers and partners', weight: 20,
          anchors: { 1: 'Describes contact, not handling.', 3: 'Gives a worked example of managing a difficult expectation.', 5: 'Shows how they held a boundary and kept the relationship.' } },
        { id: 'c-comm', name: 'Written and spoken communication', weight: 15,
          anchors: { 1: 'Answers are hard to follow without prompting.', 3: 'Structured answers; adapts detail to the listener.', 5: 'Explains a technical matter to a lay audience without losing accuracy.' } },
        { id: 'c-values', name: 'Integrity and public purpose', weight: 15,
          anchors: { 1: 'Treats conflicts of interest as a formality.', 3: 'Recognises a conflict and describes the right escalation.', 5: 'Gives an example of acting against their own convenience to protect the process.' } }
      ]
    },
    {
      id: 'DAG',
      title: 'Data Analyst, Grants',
      dept: 'Data Office',
      openings: 2,
      panel: ['u-mariam', 'u-yousef'],
      criteria: [
        { id: 'd-tech', name: 'Data handling and tooling', weight: 30,
          anchors: { 1: 'Names tools without describing use.', 3: 'Walks through a real cleaning and joining task end to end.', 5: 'Explains a choice of method and the check that caught an error.' } },
        { id: 'd-stats', name: 'Statistical reasoning', weight: 25,
          anchors: { 1: 'Reads a number as a conclusion.', 3: 'Distinguishes association from cause and sizes uncertainty.', 5: 'Designs a check that would falsify their own finding.' } },
        { id: 'd-report', name: 'Reporting to non-specialists', weight: 25,
          anchors: { 1: 'Presents output, not meaning.', 3: 'States the finding first, then the caveats.', 5: 'Turns a finding into a decision the reader can actually take.' } },
        { id: 'd-care', name: 'Care with sensitive data', weight: 20,
          anchors: { 1: 'Has not thought about access control.', 3: 'Describes minimisation and access limits in practice.', 5: 'Gives an example of stopping a request that was over-broad.' } }
      ]
    },
    {
      id: 'SCC',
      title: 'Science Communication Coordinator',
      dept: 'Public Outreach',
      openings: 1,
      panel: ['u-huda', 'u-mariam'],
      criteria: [
        { id: 's-craft', name: 'Writing and editing craft', weight: 30,
          anchors: { 1: 'Writes to fill space.', 3: 'Shapes a piece for one named audience.', 5: 'Edits their own work down and can say what each cut bought.' } },
        { id: 's-sci', name: 'Handling scientific accuracy', weight: 25,
          anchors: { 1: 'Repeats a claim as given.', 3: 'Checks a claim back to its source before publishing.', 5: 'Describes correcting a published piece and how it was handled.' } },
        { id: 's-prog', name: 'Running outreach programmes', weight: 25,
          anchors: { 1: 'Lists events attended.', 3: 'Plans an event end to end with a measure of success.', 5: 'Shows a programme changed after evidence it was not reaching its audience.' } },
        { id: 's-arabic', name: 'Arabic and English in public work', weight: 20,
          anchors: { 1: 'Translates literally between the two.', 3: 'Writes naturally in both for the same brief.', 5: 'Adapts register and reference so each version stands on its own.' } }
      ]
    }
  ],

  /* The approved question bank. Every core question is tied to a criterion, so
     an answer always has somewhere to score. Questions outside this bank are
     recorded as unscripted and must be explained. */
  questions: [
    { id: 'Q-RPO-1', roleId: 'RPO', criterionId: 'c-domain',  kind: 'core',  status: 'approved', text: 'Walk us through how you would scope a new funding call from a directorate brief.' },
    { id: 'Q-RPO-2', roleId: 'RPO', criterionId: 'c-analysis', kind: 'core', status: 'approved', text: 'You have two proposals with similar scores and one budget. How do you decide?' },
    { id: 'Q-RPO-3', roleId: 'RPO', criterionId: 'c-stake',   kind: 'core',  status: 'approved', text: 'Tell us about a time a partner expected something you could not give them.' },
    { id: 'Q-RPO-4', roleId: 'RPO', criterionId: 'c-comm',    kind: 'core',  status: 'approved', text: 'Explain a technical part of your work to someone outside your field.' },
    { id: 'Q-RPO-5', roleId: 'RPO', criterionId: 'c-values',  kind: 'core',  status: 'approved', text: 'You find a reviewer has an undeclared link to an applicant. What do you do?' },
    { id: 'Q-RPO-6', roleId: 'RPO', criterionId: 'c-analysis', kind: 'probe', status: 'approved', text: 'What would have to be true for you to change that decision?' },

    { id: 'Q-DAG-1', roleId: 'DAG', criterionId: 'd-tech',   kind: 'core',  status: 'approved', text: 'Take us through a dataset you cleaned: what was wrong with it and what you did.' },
    { id: 'Q-DAG-2', roleId: 'DAG', criterionId: 'd-stats',  kind: 'core',  status: 'approved', text: 'A grant scheme shows a rise in success rate this year. How do you test whether that is real?' },
    { id: 'Q-DAG-3', roleId: 'DAG', criterionId: 'd-report', kind: 'core',  status: 'approved', text: 'How would you present that finding to a director with ten minutes?' },
    { id: 'Q-DAG-4', roleId: 'DAG', criterionId: 'd-care',   kind: 'core',  status: 'approved', text: 'A colleague asks for the full applicant table for a side analysis. Talk us through your answer.' },

    { id: 'Q-SCC-1', roleId: 'SCC', criterionId: 's-craft',  kind: 'core',  status: 'approved', text: 'Show us a piece you wrote and tell us who it was for.' },
    { id: 'Q-SCC-2', roleId: 'SCC', criterionId: 's-sci',    kind: 'core',  status: 'approved', text: 'A researcher asks you to publish a claim you cannot verify. What happens next?' },
    { id: 'Q-SCC-3', roleId: 'SCC', criterionId: 's-prog',   kind: 'core',  status: 'approved', text: 'Plan an outreach day for secondary school students. How would you know it worked?' },
    { id: 'Q-SCC-4', roleId: 'SCC', criterionId: 's-arabic', kind: 'core',  status: 'approved', text: 'You are briefed once and must publish in Arabic and English. How do you work?' },

    { id: 'Q-OLD-1', roleId: 'RPO', criterionId: null, kind: 'core', status: 'retired', text: 'Why should we hire you over the others?',
      note: 'Retired 2026-04: rewards self-presentation, not evidence, and cannot be scored against any criterion.' },
    { id: 'Q-OLD-2', roleId: 'SCC', criterionId: null, kind: 'core', status: 'retired', text: 'Where do you see yourself in five years?',
      note: 'Retired 2026-04: answers turn on candidate confidence and family circumstances rather than the role.' }
  ],

  interviews: [
    {
      id: 'INT-2041', roleId: 'RPO', code: 'C-2041', name: 'Candidate 2041',
      date: '2026-09-08', slot: 3, durationSec: 2520,
      chair: 'u-huda', panel: ['u-huda', 'u-yousef', 'u-mariam'],
      status: 'awaiting-review',
      segments: [
        { id: 's1', start: 60,   end: 480,  qid: 'Q-RPO-1', candidateSec: 300, panelSec: 120, excerpt: 'Took the brief apart into eligibility, scope and assessment criteria before writing any text; described checking the scope against last year applicant pool.' },
        { id: 's2', start: 480,  end: 900,  qid: 'Q-RPO-2', candidateSec: 330, panelSec: 90,  excerpt: 'Ranked on strategic fit once scores tied, then named the risk that fit becomes a back door for preference.' },
        { id: 's3', start: 900,  end: 1020, qid: 'Q-RPO-6', candidateSec: 90,  panelSec: 30,  excerpt: 'Would reverse the decision if the lower-scored proposal had matched funding that expired within the year.' },
        { id: 's4', start: 1020, end: 1290, qid: null, label: 'Unscripted question from the chair', candidateSec: 120, panelSec: 150,
          excerpt: 'Panel asked whether the candidate was planning to start a family in the next two years, and how that would sit with travel in the role.' },
        { id: 's5', start: 1290, end: 1740, qid: 'Q-RPO-3', candidateSec: 360, panelSec: 90,  excerpt: 'Held a deadline against a senior partner, offered a later call instead, and kept the partner in the review pool.' },
        { id: 's6', start: 1740, end: 2100, qid: 'Q-RPO-4', candidateSec: 300, panelSec: 60,  excerpt: 'Explained bibliometric normalisation without jargon; checked twice that the explanation had landed.' },
        { id: 's7', start: 2100, end: 2460, qid: 'Q-RPO-5', candidateSec: 270, panelSec: 90,  excerpt: 'Would pause the review, declare upward the same day, and replace the reviewer rather than accept a written assurance.' }
      ],
      scores: {
        'u-huda':   { 'c-domain': { score: 4, evidence: 'Scoped the call from the brief and checked it against last year applicant pool (07:20).' },
                      'c-analysis': { score: 4, evidence: 'Named the risk that strategic fit becomes a back door (11:40).' },
                      'c-stake': { score: 4, evidence: 'Held the deadline and kept the partner in the pool (23:10).' },
                      'c-comm': { score: 5, evidence: 'Bibliometric normalisation explained cleanly to a lay listener (30:05).' },
                      'c-values': { score: 4, evidence: 'Declared upward same day and replaced the reviewer (36:40).' } },
        'u-yousef': { 'c-domain': { score: 3, evidence: 'Solid on process, thinner on which instrument to choose (08:00).' },
                      'c-analysis': { score: 4, evidence: 'Gave a clear reversal condition when probed (16:10).' },
                      'c-stake': { score: 3, evidence: 'Example was real but the escalation was left implicit (24:00).' },
                      'c-comm': { score: 4, evidence: 'Checked understanding twice (31:00).' },
                      'c-values': { score: 4, evidence: 'Would not accept a written assurance (37:20).' } },
        'u-mariam': { 'c-domain': { score: 4, evidence: 'Worked example of scoping was concrete (06:40).' },
                      'c-analysis': { score: 5, evidence: 'Stated the decision rule and what would overturn it (15:30).' },
                      'c-stake': { score: 4, evidence: 'Boundary held without losing the relationship (24:30).' },
                      'c-comm': { score: 4, evidence: 'Plain language throughout (30:30).' },
                      'c-values': { score: 4, evidence: 'Right escalation, same day (36:50).' } }
      },
      flags: [
        { id: 'f1', segId: 's4', raisedBy: 'u-lina', raisedAt: '2026-09-09 09:14', category: 'prohibited',
          reason: 'Question about family plans is outside the role requirements and is not in the approved bank. It cannot be scored and should not have been asked.',
          thread: [
            { by: 'u-huda', at: '2026-09-09 11:02', text: 'I asked it to get at the travel requirement. I accept that is not what came out of my mouth, and the candidate should not have had to answer it.' },
            { by: 'u-lina', at: '2026-09-09 11:30', text: 'The travel requirement is already covered by the conditions sheet the candidate signed at invitation. There was no gap to fill.' }
          ],
          ruling: null }
      ],
      approvals: [],
      listened: {}
    },

    {
      id: 'INT-2042', roleId: 'RPO', code: 'C-2042', name: 'Candidate 2042',
      date: '2026-09-08', slot: 1, durationSec: 2400,
      chair: 'u-huda', panel: ['u-huda', 'u-yousef', 'u-mariam'],
      status: 'approved',
      segments: [
        { id: 's1', start: 60,   end: 470,  qid: 'Q-RPO-1', candidateSec: 290, panelSec: 120, excerpt: 'Described scoping from the brief; leaned on one previous call as the template.' },
        { id: 's2', start: 470,  end: 900,  qid: 'Q-RPO-2', candidateSec: 340, panelSec: 90,  excerpt: 'Split the budget rather than choosing, then defended the split against the panel challenge.' },
        { id: 's3', start: 900,  end: 1320, qid: 'Q-RPO-3', candidateSec: 350, panelSec: 70,  excerpt: 'Turned down a partner request and offered an alternative route.' },
        { id: 's4', start: 1320, end: 1740, qid: 'Q-RPO-4', candidateSec: 330, panelSec: 90,  excerpt: 'Explained peer review to a lay listener using a worked example.' },
        { id: 's5', start: 1740, end: 2160, qid: 'Q-RPO-5', candidateSec: 340, panelSec: 80,  excerpt: 'Escalated the conflict and recorded it, but hesitated on removing the reviewer.' }
      ],
      scores: {
        'u-huda':   { 'c-domain': { score: 3, evidence: 'Template-led rather than scoped from first principles (05:40).' },
                      'c-analysis': { score: 3, evidence: 'Split the budget; defended it, but the rule was improvised (10:10).' },
                      'c-stake': { score: 4, evidence: 'Refusal was clear and an alternative was offered (17:30).' },
                      'c-comm': { score: 4, evidence: 'Peer review explained with a worked example (25:00).' },
                      'c-values': { score: 3, evidence: 'Recorded the conflict but hesitated to remove the reviewer (31:20).' } },
        'u-yousef': { 'c-domain': { score: 3, evidence: 'Knew one instrument well (06:10).' },
                      'c-analysis': { score: 3, evidence: 'Splitting avoided the decision the question asked for (11:00).' },
                      'c-stake': { score: 4, evidence: 'Kept the partner informed (18:00).' },
                      'c-comm': { score: 4, evidence: 'Clear structure (26:00).' },
                      'c-values': { score: 3, evidence: 'Escalation correct, remedy slow (32:00).' } },
        'u-mariam': { 'c-domain': { score: 3, evidence: 'Process solid, comparison thin (06:00).' },
                      'c-analysis': { score: 4, evidence: 'Defence of the split under challenge was coherent (12:10).' },
                      'c-stake': { score: 4, evidence: 'Alternative route was practical (18:20).' },
                      'c-comm': { score: 4, evidence: 'Good check for understanding (26:30).' },
                      'c-values': { score: 3, evidence: 'Would have wanted the reviewer replaced (32:20).' } }
      },
      flags: [],
      approvals: [
        { by: 'u-nadia', at: '2026-09-09 13:05', decision: 'approved', note: 'Full bank asked, evidence attached to every score, panel spread within one point throughout.' },
        { by: 'u-lina',  at: '2026-09-09 15:40', decision: 'approved', note: 'Listened end to end. Questions matched the bank and the order was the same as C-2041.' }
      ],
      listened: { 'u-nadia': 2400, 'u-lina': 2400 }
    },

    {
      id: 'INT-2043', roleId: 'RPO', code: 'C-2043', name: 'Candidate 2043',
      date: '2026-09-09', slot: 5, durationSec: 2280,
      chair: 'u-huda', panel: ['u-huda', 'u-yousef', 'u-mariam'],
      status: 'changes-requested',
      segments: [
        { id: 's1', start: 60,   end: 460,  qid: 'Q-RPO-1', candidateSec: 280, panelSec: 120, excerpt: 'Scoped from the brief; strong on eligibility, quick over assessment.' },
        { id: 's2', start: 460,  end: 880,  qid: 'Q-RPO-2', candidateSec: 300, panelSec: 120, excerpt: 'Chose on strategic fit and stated the rule up front.' },
        { id: 's3', start: 880,  end: 1240, qid: 'Q-RPO-3', candidateSec: 250, panelSec: 110, excerpt: 'Example was about a colleague rather than a partner; panel did not redirect.' },
        { id: 's4', start: 1240, end: 1620, qid: 'Q-RPO-4', candidateSec: 300, panelSec: 80,  excerpt: 'Explained a statistical method carefully.' },
        { id: 's5', start: 1620, end: 2040, qid: 'Q-RPO-5', candidateSec: 310, panelSec: 110, excerpt: 'Named the declaration route and the timing.' }
      ],
      scores: {
        'u-huda':   { 'c-domain': { score: 4, evidence: 'Eligibility reasoning was precise (05:10).' },
                      'c-analysis': { score: 4, evidence: 'Stated the decision rule before applying it (09:00).' },
                      'c-stake': { score: 2, evidence: 'Answered about a colleague, not a partner (16:00).' },
                      'c-comm': { score: 4, evidence: 'Method explained without jargon (22:30).' },
                      'c-values': { score: 4, evidence: 'Declaration route and timing both correct (29:10).' } },
        'u-yousef': { 'c-domain': { score: 4, evidence: 'Comfortable with the instrument set (05:30).' },
                      'c-analysis': { score: 4, evidence: 'Rule stated up front (09:30).' },
                      'c-stake': { score: 5, evidence: '' },
                      'c-comm': { score: 4, evidence: 'Clear (23:00).' },
                      'c-values': { score: 4, evidence: 'Correct escalation (29:30).' } },
        'u-mariam': { 'c-domain': { score: 3, evidence: 'Assessment side was rushed (06:20).' },
                      'c-analysis': { score: 4, evidence: 'Consistent rule (10:00).' },
                      'c-stake': { score: 2, evidence: 'The question was not answered as asked and was not redirected (16:20).' },
                      'c-comm': { score: 4, evidence: 'Good pace (23:20).' },
                      'c-values': { score: 4, evidence: 'Right route (29:40).' } }
      },
      flags: [],
      approvals: [
        { by: 'u-nadia', at: '2026-09-10 10:12', decision: 'changes', note: 'Three points of spread on stakeholder handling with no evidence attached to the 5. Panel member to add evidence or revise, then resubmit.' }
      ],
      listened: { 'u-nadia': 1900 }
    },

    {
      id: 'INT-2051', roleId: 'DAG', code: 'C-2051', name: 'Candidate 2051',
      date: '2026-09-10', slot: 2, durationSec: 2100,
      chair: 'u-mariam', panel: ['u-mariam', 'u-yousef'],
      status: 'awaiting-review',
      segments: [
        { id: 's1', start: 60,   end: 520,  qid: 'Q-DAG-1', candidateSec: 200, panelSec: 260, excerpt: 'Described a duplicate-key problem in a grants export; panel talked through much of the answer with them.' },
        { id: 's2', start: 520,  end: 980,  qid: 'Q-DAG-2', candidateSec: 190, panelSec: 270, excerpt: 'Reached for a year-on-year comparison; panel supplied the base-rate objection before the candidate did.' },
        { id: 's3', start: 980,  end: 1500, qid: 'Q-DAG-3', candidateSec: 240, panelSec: 280, excerpt: 'Finding first, then caveats, but the panel filled in the decision framing.' },
        { id: 's4', start: 1500, end: 2040, qid: 'Q-DAG-4', candidateSec: 260, panelSec: 280, excerpt: 'Refused the full table, offered an aggregate extract instead.' }
      ],
      scores: {
        'u-mariam': { 'd-tech': { score: 3, evidence: 'Duplicate-key fix was described end to end (06:00).' },
                      'd-stats': { score: 2, evidence: 'Base-rate objection came from the panel, not the candidate (13:40).' },
                      'd-report': { score: 3, evidence: 'Finding first, caveats after (19:00).' },
                      'd-care': { score: 4, evidence: 'Refused the full table and offered an aggregate (27:10).' } },
        'u-yousef': { 'd-tech': { score: 3, evidence: 'Practical and specific (06:30).' },
                      'd-stats': { score: 3, evidence: 'Got there once prompted (14:10).' },
                      'd-report': { score: 3, evidence: 'Structure was right (19:30).' },
                      'd-care': { score: 4, evidence: 'Minimisation instinct was sound (27:30).' } }
      },
      flags: [
        { id: 'f2', segId: 's2', raisedBy: 'u-nadia', raisedAt: '2026-09-10 16:20', category: 'unclear',
          reason: 'The panel is speaking for more than half of this interview. On the recording the base-rate point is made by the panel and then scored against the candidate.',
          thread: [], ruling: null }
      ],
      approvals: [],
      listened: {}
    },

    {
      id: 'INT-2052', roleId: 'DAG', code: 'C-2052', name: 'Candidate 2052',
      date: '2026-09-10', slot: 4, durationSec: 2160,
      chair: 'u-mariam', panel: ['u-mariam', 'u-yousef'],
      status: 'scoring',
      segments: [
        { id: 's1', start: 60,   end: 560,  qid: 'Q-DAG-1', candidateSec: 380, panelSec: 120, excerpt: 'Walked a messy CSV through cleaning, joining and a reconciliation check.' },
        { id: 's2', start: 560,  end: 1080, qid: 'Q-DAG-2', candidateSec: 400, panelSec: 120, excerpt: 'Raised the base rate unprompted and proposed a falsification check.' },
        { id: 's3', start: 1080, end: 1600, qid: 'Q-DAG-3', candidateSec: 390, panelSec: 130, excerpt: 'Turned the finding into two options with costs attached.' },
        { id: 's4', start: 1600, end: 2100, qid: 'Q-DAG-4', candidateSec: 380, panelSec: 120, excerpt: 'Narrowed the request and documented what was released.' }
      ],
      scores: {
        'u-mariam': { 'd-tech': { score: 4, evidence: 'Reconciliation check was their own idea (07:10).' },
                      'd-stats': { score: 5, evidence: 'Proposed a check that would falsify their own finding (15:20).' } }
      },
      flags: [],
      approvals: [],
      listened: {}
    },

    {
      id: 'INT-2061', roleId: 'SCC', code: 'C-2061', name: 'Candidate 2061',
      date: '2026-09-11', slot: 1, durationSec: 1980,
      chair: 'u-huda', panel: ['u-huda', 'u-mariam'],
      status: 'awaiting-review',
      segments: [
        { id: 's1', start: 60,   end: 600,  qid: 'Q-SCC-1', candidateSec: 420, panelSec: 120, excerpt: 'Brought a feature written for parents of school-age children and said why the angle was chosen.' },
        { id: 's2', start: 600,  end: 1140, qid: 'Q-SCC-2', candidateSec: 430, panelSec: 110, excerpt: 'Went back to the preprint, found the claim was conditional, and rewrote the line with the researcher.' },
        { id: 's3', start: 1140, end: 1500, qid: null, label: 'Unscripted question', candidateSec: 200, panelSec: 160,
          excerpt: 'Panel asked how the candidate would handle working late during exhibition weeks, and whether their commute would allow it.' },
        { id: 's4', start: 1500, end: 1920, qid: 'Q-SCC-4', candidateSec: 330, panelSec: 90,  excerpt: 'Described writing both versions from the brief rather than translating one into the other.' }
      ],
      scores: {
        'u-huda':   { 's-craft': { score: 4, evidence: 'Audience was named and the angle followed from it (04:30).' },
                      's-sci': { score: 5, evidence: 'Went back to the preprint and corrected the line (12:00).' },
                      's-prog': { score: 3, evidence: 'Not asked directly; inferred from the exhibition answer.' },
                      's-arabic': { score: 4, evidence: 'Writes both versions from the brief (26:00).' } },
        'u-mariam': { 's-craft': { score: 4, evidence: 'Clear sense of reader (05:00).' },
                      's-sci': { score: 5, evidence: 'Checked the claim to source (12:30).' },
                      's-prog': { score: 2, evidence: 'No evidence on the recording; the programme question was never put.' },
                      's-arabic': { score: 4, evidence: 'Register differed appropriately between versions (26:40).' } }
      },
      flags: [
        { id: 'f3', segId: 's3', raisedBy: 'u-nadia', raisedAt: '2026-09-11 09:40', category: 'off-rubric',
          reason: 'Commute and availability are not in the bank and map to no criterion. The outreach programme question (Q-SCC-3) was dropped to make room for it, and one panellist has scored that criterion anyway.',
          thread: [], ruling: null }
      ],
      approvals: [],
      listened: {}
    }
  ]
};
