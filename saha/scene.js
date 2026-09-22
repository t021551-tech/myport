/* ==================================================================
   Saha — الساحة
   The ground around the Grand Mosque of Kuwait, walked at eye level.

   One scene, one metre to the unit, built entirely from painted
   canvas textures and hand-placed geometry. No assets are loaded:
   the only thing this page fetches beyond the fonts is three.js.

   Structure of this file:
     1. the nine zones — the data behind the HUD, the chips and the
        written programme below the stage
     2. language
     3. painted textures and small helpers
     4. the mosque
     5. the ground given over to people
     6. the harness: camera, walking, collision, the HUD
   ================================================================== */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TAU = Math.PI * 2;

  /* ================================================================
     1. THE NINE ZONES
     bounds are [x0, x1, z0, z1] in metres. view is where the chip
     puts you and which way you face. Order matters: the first zone
     whose bounds contain you is the one the HUD names.
     ================================================================ */
  var ZONES = [
    {
      id: 'deck', num: '09',
      en: { name: 'The Waterfront Deck', short: 'Timber deck, the sea below, the mosque behind you.' },
      ar: { name: 'الواجهة البحرية', short: 'سطح خشبي، البحر تحته، والمسجد خلفك.' },
      enText: 'Where the walk ends: a timber deck on the seaward side, the water below it and ' +
        'the mosque behind you. Eighty metres of it, benches turned north-west for the sunset, ' +
        'and steps down to the rock edge. From here the dome and the minaret line up over the ' +
        'road you no longer have to cross.',
      arText: 'حيث ينتهي الممشى: سطح خشبي على جهة البحر، الماء تحته والمسجد خلفك. طوله ثمانون ' +
        'متراً، ومقاعده موجّهة نحو الشمال الغربي للغروب، ودرجٌ ينزل إلى حافة الصخر. من هنا ' +
        'تصطف القبة والمئذنة فوق الطريق الذي لم تعد مضطراً لعبوره.',
      facts: [['Length', 'الطول', '250 m'], ['Faces', 'الاتجاه', 'NW'], ['From the souq', 'من السوق', '8 min']],
      bounds: [-158, 96, -212, -166], view: { x: -34, z: -203, yaw: -2.9 }
    },
    {
      id: 'promenade', num: '08',
      en: { name: 'The Promenade', short: '11 m wide, 1:20 all the way, and not one step.' },
      ar: { name: 'الممشى', short: 'عرض ١١ م، وميل ١:٢٠ كاملاً، وبلا درجة واحدة.' },
      enText: 'The one piece of real infrastructure here. Gulf Street is six lanes with no ' +
        'crossing at this point, so the walk rises over it on an eleven-metre deck. One in ' +
        'twenty is what a wheelchair and a pram can take unaided, and one in twenty means 144 ' +
        'metres of ramp for a 7.2 metre rise — far more than fits head-on. So the approaches ' +
        'turn and run along the corniche, east on the mosque side and west on the sea side, ' +
        'and only the 52-metre span crosses the road. No lifts, no stairs, not one step.',
      arText: 'القطعة الوحيدة من البنية التحتية الحقيقية هنا. شارع الخليج ستة مسارات بلا معبر ' +
        'عند هذه النقطة، لذا يرتفع الممشى فوقه على سطح بعرض أحد عشر متراً. الميل واحد إلى ' +
        'عشرين هو ما يقدر عليه الكرسي المتحرك وعربة الطفل دون مساعدة، وواحد إلى عشرين يعني ' +
        'مئة وأربعة وأربعين متراً من المنحدر لارتفاع ٧٫٢ متر، وهو أطول مما تتسع له المواجهة. ' +
        'لذلك ينعطف المدخلان ويسيران بمحاذاة الكورنيش، شرقاً من جهة المسجد وغرباً من جهة ' +
        'البحر، ولا يعبر الطريق سوى الجسر بطول اثنين وخمسين متراً. لا مصاعد ولا درج ولا درجة واحدة.',
      facts: [['Width', 'العرض', '11 m'], ['Ramp', 'الميل', '1:20'], ['Ramp run', 'طول المنحدر', '2 × 144 m'], ['Clear height', 'الارتفاع الحر', '6.6 m']],
      bounds: [-152, 152, -166, -104], view: { x: 0, z: -134, yaw: Math.PI }
    },
    {
      id: 'road', num: '10',
      en: { name: 'The Road', short: '1.8 km of planted carriageway, footways both sides.' },
      ar: { name: 'الطريق', short: '١٫٨ كم من طريق مشجَّر، وأرصفة على الجانبين.' },
      enText: 'What the distance actually costs: 1.8 km of carriageway between the south edge ' +
        'of the court and the head of the souq, with a nine-metre footway on each side and a ' +
        'date palm every twenty-four metres. Three minutes by car, five in traffic, ' +
        'twenty-five on foot — and the palms are there because the walk is only honest if it ' +
        'is shaded.',
      arText: 'ما تكلّفه المسافة فعلاً: ١٫٨ كم من الطريق بين الحد الجنوبي للساحة ورأس السوق، ' +
        'مع رصيف بعرض تسعة أمتار على كل جانب ونخلة كل أربعة وعشرين متراً. ثلاث دقائق ' +
        'بالسيارة، وخمس في الزحام، وخمس وعشرون مشياً — والنخيل هناك لأن المشي لا يكون ' +
        'صادقاً إلا إذا كان مظلَّلاً.',
      facts: [['Length', 'الطول', '1.8 km'], ['By car', 'بالسيارة', '3 min'], ['On foot', 'مشياً', '25 min'], ['Footway', 'الرصيف', '9 m']],
      bounds: [-26, 26, 200, 2020], view: { x: 14.6, z: 620, yaw: 0 }
    },
    {
      id: 'majlis', num: '07',
      en: { name: 'The Majlis', short: 'Six sunken seating rooms under fabric sails.' },
      ar: { name: 'المجالس', short: 'ست غرف جلوس منخفضة تحت مظلات قماشية.' },
      enText: 'Six sunken seating rooms at the head of the souq, each a square of low benches ' +
        'under a single fabric sail, cut one step below the paving so that sitting down takes ' +
        'you out of the through-traffic. Two face back up the road you drove in on; the rest ' +
        'turn inward on themselves.',
      arText: 'ست غرف جلوس منخفضة عند رأس السوق، كل واحدة مربّع من المصاطب المنخفضة تحت مظلة ' +
        'قماشية واحدة، محفورة درجة تحت مستوى البلاط حتى يخرجك الجلوس من طريق المارّة. اثنتان ' +
        'تتجهان إلى الطريق الذي جئت منه، والبقية تنغلق على نفسها.',
      facts: [['Rooms', 'الغرف', '6'], ['Seats', 'المقاعد', '240'], ['Sail span', 'اتساع المظلة', '12 m']],
      bounds: [-58, 58, 2016, 2050], view: { x: -20, z: 2042, yaw: Math.PI }
    },
    {
      id: 'souq', num: '02',
      en: { name: 'The Souq', short: '64 booths, 2.1 km inland — a three-minute drive.' },
      ar: { name: 'السوق', short: '٦٤ كشكاً، على ٢٫١ كم داخل البر — ثلاث دقائق بالسيارة.' },
      enText: 'Sixty-four booths in four rows — three metres square, timber frames under ' +
        'striped canvas. It is deliberately not the mosque\'s forecourt: it stands 2.1 km ' +
        'inland, a three-minute drive or a twenty-five-minute walk down a planted road, ' +
        'because a market this size wants its own ground and its own car park rather than the ' +
        'mosque\'s. Small enough that one person can run a booth: dates, oud, tailoring, a ' +
        'bookseller, prayer beads, a kitchen the size of a kitchen. Let by the month, and the ' +
        'rows stand sixteen metres apart so a Friday crowd passes without pressing on the ' +
        'counters. A water channel runs the length of the middle.',
      arText: 'أربعة وستون كشكاً في أربعة صفوف — ثلاثة أمتار في ثلاثة، هياكل خشبية تحت قماش ' +
        'مخطّط. وهو ليس صحن المسجد عن قصد: يقع على مسافة ٢٫١ كم داخل البر، أي ثلاث دقائق ' +
        'بالسيارة أو خمس وعشرون دقيقة مشياً على طريق مشجَّر، لأن سوقاً بهذا الحجم يريد أرضه ' +
        'ومواقفه لا أرض المسجد. صغيرة بما يكفي ليديرها شخص واحد: تمر، وعود، وخياطة، وبائع ' +
        'كتب، ومسابح، ومطبخ بحجم مطبخ. تُؤجَّر بالشهر، والصفوف متباعدة ستة عشر متراً فيمرّ ' +
        'زحام الجمعة دون أن يضغط على الطاولات. ويجري في منتصفها جدول ماء بطولها.',
      facts: [['Booths', 'الأكشاك', '64'], ['Each', 'المساحة', '3 × 3 m'], ['From the mosque', 'من المسجد', '2.1 km'], ['By car', 'بالسيارة', '3 min']],
      bounds: [-52, 52, 2050, 2150], view: { x: -5.5, z: 2136, yaw: 0 }
    },
    {
      id: 'lawn', num: '05',
      en: { name: 'The Lawn', short: '0.9 ha of grass, graded into a shallow bowl.' },
      ar: { name: 'المرج', short: '٠٫٩ هكتار من العشب، مائلة كالحوض الضحل.' },
      enText: 'Nine thousand square metres of grass on the south-east, graded into a shallow ' +
        'bowl so it reads as somewhere to sit rather than a lawn to look at. Ninety trees ' +
        'around the rim for the shade grass cannot give. Irrigated with treated water, which ' +
        'is the only thing that makes a lawn this size defensible in this climate.',
      arText: 'تسعة آلاف متر مربع من العشب في الجنوب الشرقي، مائلة كحوض ضحل حتى تُقرأ كمكان ' +
        'للجلوس لا كمرج يُنظر إليه. تسعون شجرة حول حافتها للظل الذي لا يعطيه العشب. تُروى ' +
        'بمياه معالجة، وهو وحده ما يجعل مرجاً بهذا الحجم مقبولاً في هذا المناخ.',
      facts: [['Area', 'المساحة', '0.9 ha'], ['Trees', 'الأشجار', '90'], ['Water', 'الري', 'treated']],
      bounds: [50, 180, 92, 192], view: { x: 104, z: 150, yaw: 0.64 }
    },
    {
      id: 'grove', num: '06',
      en: { name: 'The Palm Grove', short: '120 date palms on a nine-metre grid.' },
      ar: { name: 'النخيل', short: '١٢٠ نخلة على شبكة تسعة أمتار.' },
      enText: 'A hundred and twenty date palms on a nine-metre grid over compacted sand, ' +
        'south-west of the court. No lawn, no kerbs, almost no cost: the cheapest shade in the ' +
        'proposal and the only part of it that gets better every year. In the hot months the ' +
        'walk from the car park should run through here and nowhere else.',
      arText: 'مئة وعشرون نخلة على شبكة تسعة أمتار فوق رمل مرصوص، جنوب غرب الساحة. لا عشب ولا ' +
        'أرصفة ولا تكلفة تُذكر: أرخص ظلّ في الاقتراح، والجزء الوحيد منه الذي يتحسّن كل عام. في ' +
        'أشهر الحر ينبغي أن يمر الطريق من الموقف من هنا لا من غيره.',
      facts: [['Palms', 'النخيل', '120'], ['Grid', 'الشبكة', '9 m'], ['Noon shade', 'ظل الظهيرة', '40%']],
      bounds: [-180, -50, 92, 192], view: { x: -116, z: 152, yaw: -0.64 }
    },
    {
      id: 'arcade', num: '03',
      en: { name: 'The Arcade', short: '28 shop units behind a pointed-arch colonnade.' },
      ar: { name: 'الرواق', short: '٢٨ محلاً خلف رواق من العقود المدببة.' },
      enText: 'A single long building on the east side: twenty-eight units behind a colonnade ' +
        'of pointed arches that carries its own shade all day. This is the permanent half of ' +
        'the trade, and the only trade the mosque grounds carry — the shops that need a door, ' +
        'a store room and a fixed address, as against the booths of the souq two kilometres ' +
        'inland, which need none of the three. Its back wall takes the car park off the court.',
      arText: 'مبنى واحد طويل على الجهة الشرقية: ثمانية وعشرون محلاً خلف رواق من العقود المدببة ' +
        'يحمل ظلّه طوال النهار. هذا هو النصف الدائم من التجارة، وهو التجارة الوحيدة التي ' +
        'تحملها أرض المسجد — المحلات التي تحتاج باباً ومخزناً وعنواناً ثابتاً، بخلاف أكشاك ' +
        'السوق على كيلومترين داخل البر التي لا تحتاج شيئاً من الثلاثة. ويحجب جداره الخلفي ' +
        'موقف السيارات عن الساحة.',
      facts: [['Units', 'المحلات', '28'], ['Length', 'الطول', '140 m'], ['Colonnade', 'عمق الرواق', '6 m']],
      bounds: [102, 182, -88, 88], view: { x: 106, z: 6, yaw: -Math.PI / 2 }
    },
    {
      id: 'terraces', num: '04',
      en: { name: 'The Food Terraces', short: 'Nine kitchens, 400 seats, all of them shaded.' },
      ar: { name: 'المصاطر', short: 'تسعة مطابخ، ٤٠٠ مقعد، كلها مظلّلة.' },
      enText: 'Nine kitchens on the west side with their seating outside under pergolas, ' +
        'turned to face the afternoon shade rather than the afternoon sun. Around four hundred ' +
        'seats, and a run of water along the terrace edge — moving water drops the air ' +
        'temperature by a degree or two you can actually feel.',
      arText: 'تسعة مطابخ على الجهة الغربية وجلساتها في الخارج تحت العرائش، موجَّهة نحو ظل ' +
        'العصر لا نحو شمسه. نحو أربعمئة مقعد، ومجرى ماء على حافة المصطبة — الماء الجاري يخفض ' +
        'حرارة الهواء درجة أو درجتين تشعر بهما فعلاً.',
      facts: [['Kitchens', 'المطابخ', '9'], ['Seats', 'المقاعد', '~400'], ['Shaded by', 'مظللة بحلول', '3pm']],
      bounds: [-182, -104, -92, 92], view: { x: -108, z: 4, yaw: Math.PI / 2 }
    },
    {
      id: 'court', num: '01',
      en: { name: 'The Prayer Court', short: 'Kept empty. On the Eids it holds 24,000.' },
      ar: { name: 'ساحة الصلاة', short: 'تبقى خالية. تستوعب في العيد ٢٤٬٠٠٠.' },
      enText: 'The apron of stone around the mosque wall, and the only zone defined by what is ' +
        'not in it: no booth, no tree, no bench, nothing that has to be moved. On the two Eids ' +
        'it takes the overflow from inside — about twenty-four thousand people shoulder to ' +
        'shoulder on paving whose joints are set out as prayer rows, so nobody has to guess ' +
        'the qibla.',
      arText: 'البلاط الحجري حول سور المسجد، وهي المنطقة الوحيدة التي تُعرَّف بما ليس فيها: لا ' +
        'كشك ولا شجرة ولا مقعد ولا شيء يحتاج إلى نقل. في العيدين تستوعب فائض المصلين من ' +
        'الداخل — نحو أربعة وعشرين ألفاً كتفاً بكتف على بلاط رُسمت فواصله صفوفاً للصلاة، فلا ' +
        'يحتاج أحد إلى تقدير القبلة.',
      facts: [['Area', 'المساحة', '4.2 ha'], ['Holds', 'تستوعب', '~24,000'], ['Built on it', 'المبني عليها', 'nothing']],
      bounds: [-128, 128, -106, 108], view: { x: 98, z: 90, yaw: Math.PI / 4 }
    }
  ];

  /* the mosque itself, for the compass readout */
  var MOSQUE = { x: 0, z: 0 };

  /* ================================================================
     2. LANGUAGE
     ================================================================ */
  var lang = 'en';
  var body = document.body;

  function setLang(next) {
    lang = next;
    body.classList.toggle('lang-ar', next === 'ar');
    body.classList.toggle('lang-en', next !== 'ar');
    document.documentElement.setAttribute('lang', next);
    document.documentElement.setAttribute('dir', next === 'ar' ? 'rtl' : 'ltr');
    document.querySelectorAll('[data-setlang]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.setlang === next));
    });
    paintProgramme();
    paintChips();
    paintHint();
    if (current) paintWhere(current);
  }
  document.querySelectorAll('[data-setlang]').forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.dataset.setlang); });
  });

  /* ================================================================
     The written programme and the chip bar, both built from ZONES so
     the page and the walkthrough can never drift apart.
     ================================================================ */
  var progEl = document.getElementById('prog');
  var barEl = document.getElementById('bar');

  var byNum = ZONES.slice().sort(function (a, b) { return a.num < b.num ? -1 : 1; });

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function paintProgramme() {
    if (!progEl) return;              /* the page may carry the chips only */
    var ar = lang === 'ar';
    progEl.innerHTML = byNum.map(function (z) {
      var facts = z.facts.map(function (f) {
        return '<div><dt>' + esc(ar ? f[1] : f[0]) + '</dt><dd>' + esc(f[2]) + '</dd></div>';
      }).join('');
      return '<li class="zone" id="zone-' + z.id + '">' +
        '<span class="n">' + z.num + '</span>' +
        '<h3>' + esc(ar ? z.ar.name : z.en.name) + ' ' +
          '<span class="ar" lang="' + (ar ? 'en' : 'ar') + '" dir="' + (ar ? 'ltr' : 'rtl') + '">' +
          esc(ar ? z.en.name : z.ar.name) + '</span></h3>' +
        '<p>' + esc(ar ? z.arText : z.enText) + '</p>' +
        '<dl>' + facts + '</dl>' +
        '<button type="button" class="go" data-go="' + z.id + '">' +
          (ar ? 'اذهب إلى هناك ↑' : 'Walk there ↑') + '</button>' +
        '</li>';
    }).join('');
  }

  function paintChips() {
    var ar = lang === 'ar';
    barEl.querySelectorAll('.chip').forEach(function (c) { c.remove(); });
    byNum.forEach(function (z) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.dataset.go = z.id;
      b.setAttribute('aria-pressed', String(current === z));
      b.innerHTML = esc(ar ? z.ar.name : z.en.name) + ' ' +
        '<span class="ar" lang="' + (ar ? 'en' : 'ar') + '" dir="' + (ar ? 'ltr' : 'rtl') + '">' +
        esc(ar ? z.en.name : z.ar.name) + '</span>';
      barEl.appendChild(b);
    });
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-go]') : null;
    if (!t) return;
    var z = ZONES.filter(function (x) { return x.id === t.dataset.go; })[0];
    if (!z) return;
    goTo(z);
    if (t.classList.contains('go')) {
      var w = document.getElementById('walk');
      if (w) w.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    }
  });

  /* ================================================================
     3. THE WORLD — painted textures, then geometry
     ================================================================ */
  var stage = document.getElementById('stage');
  var canvasEl = document.getElementById('view');

  if (!window.THREE || !('IntersectionObserver' in window)) { stage.classList.add('dead'); }

  var gl = null;
  try {
    gl = canvasEl.getContext('webgl') || canvasEl.getContext('experimental-webgl');
  } catch (e) { gl = null; }
  if (!gl || !window.THREE) {
    stage.classList.add('dead');
    setLang('en');
    return;
  }

  /* -- small helpers ------------------------------------------------ */
  function mat(color, rough, metal) {
    return new THREE.MeshStandardMaterial({
      color: color,
      roughness: rough === undefined ? 0.9 : rough,
      metalness: metal === undefined ? 0.02 : metal
    });
  }
  function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }
  function put(o, x, y, z) { o.position.set(x, y, z); return o; }

  /* Instanced placement. Repeated things — palms, merlons, chairs,
     people, booth frames — are collected here and drawn in one call
     each, which is what keeps a site this size walkable on a phone. */
  function Inst(geo, material) {
    this.geo = geo; this.mat = material; this.rows = []; this.tinted = false;
  }
  Inst.prototype.at = function (x, y, z, o) {
    o = o || {};
    this.rows.push({
      x: x, y: y, z: z,
      rx: o.rx || 0, ry: o.ry || 0, rz: o.rz || 0,
      sx: o.s || o.sx || 1, sy: o.s || o.sy || 1, sz: o.s || o.sz || 1,
      c: o.c || null
    });
    if (o.c) this.tinted = true;
    return this;
  };
  Inst.prototype.into = function (parent) {
    if (!this.rows.length) return null;
    /* Its own copy of the material: three.js caches the compiled program on the
       material, and that program is built for one instancing state. Sharing a
       material with a plain mesh — or with an instancer that tints and one that
       doesn't — binds a null attribute and throws in the middle of the frame,
       taking every object drawn after it with it. Cloning shares the textures
       and costs nothing. */
    var mesh = new THREE.InstancedMesh(this.geo, this.mat.clone(), this.rows.length);
    var d = new THREE.Object3D(), col = new THREE.Color();
    for (var i = 0; i < this.rows.length; i++) {
      var r = this.rows[i];
      d.position.set(r.x, r.y, r.z);
      d.rotation.set(r.rx, r.ry, r.rz);
      d.scale.set(r.sx, r.sy, r.sz);
      d.updateMatrix();
      mesh.setMatrixAt(i, d.matrix);
      if (this.tinted) { col.set(r.c || 0xffffff); mesh.setColorAt(i, col); }
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    parent.add(mesh);
    return mesh;
  };

  /* -- painted textures --------------------------------------------
     Each one is drawn once into a canvas and repeated. Nothing is
     fetched. --------------------------------------------------- */
  function tex(w, h, paint, rx, ry) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    paint(c.getContext('2d'), w, h);
    var t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    if (rx) t.repeat.set(rx, ry === undefined ? rx : ry);
    t.anisotropy = 4;
    t.encoding = THREE.sRGBEncoding;
    return t;
  }

  function noise(x, w, h, n, a, colors) {
    for (var i = 0; i < n; i++) {
      x.fillStyle = colors[(Math.random() * colors.length) | 0];
      x.globalAlpha = a * (0.3 + Math.random() * 0.7);
      var r = 1 + Math.random() * 3;
      x.fillRect(Math.random() * w, Math.random() * h, r, r);
    }
    x.globalAlpha = 1;
  }

  /* sandstone — the mosque, the arcade, the walls */
  var stoneTex = tex(256, 256, function (x, w, h) {
    x.fillStyle = '#E3D5B6'; x.fillRect(0, 0, w, h);
    // faint coursing, so a big wall doesn't read as one flat card
    x.strokeStyle = 'rgba(180,160,124,.38)'; x.lineWidth = 1;
    for (var y = 0; y <= h; y += 32) {
      x.beginPath(); x.moveTo(0, y + 0.5); x.lineTo(w, y + 0.5); x.stroke();
    }
    for (var r = 0; r < 8; r++) {
      var off = (r % 2) * 32;
      for (var v = off; v < w; v += 64) {
        x.beginPath(); x.moveTo(v + 0.5, r * 32); x.lineTo(v + 0.5, r * 32 + 32); x.stroke();
      }
    }
    noise(x, w, h, 900, 0.1, ['#C9B894', '#F2E8D2', '#D6C4A0']);
  }, 6, 6);

  /* the paving of the prayer court — joints set out as prayer rows */
  var paveTex = tex(256, 256, function (x, w, h) {
    x.fillStyle = '#CCC0A6'; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(150,138,114,.5)'; x.lineWidth = 2;
    for (var y = 0; y <= h; y += 64) {
      x.beginPath(); x.moveTo(0, y); x.lineTo(w, y); x.stroke();
    }
    x.strokeStyle = 'rgba(150,138,114,.22)'; x.lineWidth = 1;
    for (var v = 0; v <= w; v += 64) {
      x.beginPath(); x.moveTo(v, 0); x.lineTo(v, h); x.stroke();
    }
    noise(x, w, h, 700, 0.08, ['#CBBFA6', '#EDE4D2']);
  }, 40, 34);

  /* the souq ground — smaller stone, warmer */
  var walkTex = tex(256, 256, function (x, w, h) {
    x.fillStyle = '#C7B695'; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(146,130,102,.42)'; x.lineWidth = 1.5;
    for (var r = 0; r < 8; r++) {
      var off = (r % 2) * 16;
      x.beginPath(); x.moveTo(0, r * 32); x.lineTo(w, r * 32); x.stroke();
      for (var v = off; v < w; v += 32) {
        x.beginPath(); x.moveTo(v, r * 32); x.lineTo(v, r * 32 + 32); x.stroke();
      }
    }
    noise(x, w, h, 800, 0.1, ['#C6B692', '#E9DCC2']);
  }, 24, 24);

  /* compacted sand — the grove, the edges */
  var sandTex = tex(128, 128, function (x, w, h) {
    x.fillStyle = '#CBB68C'; x.fillRect(0, 0, w, h);
    noise(x, w, h, 2200, 0.16, ['#C8B187', '#E7D8B4', '#CFBB93']);
  }, 60, 60);

  var grassTex = tex(128, 128, function (x, w, h) {
    x.fillStyle = '#5C8A45'; x.fillRect(0, 0, w, h);
    noise(x, w, h, 3000, 0.3, ['#4A7838', '#6E9B52', '#3E6B30', '#7FA95E']);
  }, 34, 26);

  var woodTex = tex(64, 64, function (x, w, h) {
    x.fillStyle = '#9A7448'; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(96,68,38,.42)'; x.lineWidth = 1;
    for (var i = 0; i < 16; i++) {
      var v = Math.random() * w;
      x.beginPath(); x.moveTo(v, 0); x.lineTo(v + (Math.random() - 0.5) * 6, h); x.stroke();
    }
  }, 2, 2);

  var deckTex = tex(128, 128, function (x, w, h) {
    x.fillStyle = '#A9825A'; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(78,54,32,.5)'; x.lineWidth = 2;
    for (var y = 0; y <= h; y += 16) { x.beginPath(); x.moveTo(0, y); x.lineTo(w, y); x.stroke(); }
    noise(x, w, h, 500, 0.12, ['#96714C', '#C09A6E']);
  }, 30, 8);

  var roadTex = tex(128, 256, function (x, w, h) {
    x.fillStyle = '#4A4A4C'; x.fillRect(0, 0, w, h);
    noise(x, w, h, 1400, 0.14, ['#3E3E40', '#57575A', '#444447']);
    x.fillStyle = 'rgba(232,228,214,.82)';
    for (var y = 20; y < h; y += 80) x.fillRect(w / 2 - 3, y, 6, 40);
  }, 1, 26);

  /* striped awnings — four colourways, so the rows are not uniform */
  function stripeTex(a, b) {
    return tex(64, 64, function (x, w, h) {
      x.fillStyle = a; x.fillRect(0, 0, w, h);
      x.fillStyle = b;
      for (var v = 0; v < w; v += 16) x.fillRect(v, 0, 8, h);
      noise(x, w, h, 260, 0.12, ['#ffffff', '#00000022']);
    }, 3, 1);
  }

  /* a palm frond, drawn with its own alpha so it reads as leaves */
  var frondTex = tex(128, 64, function (x, w, h) {
    x.clearRect(0, 0, w, h);
    var mid = h / 2;
    x.strokeStyle = '#3E6B30'; x.lineWidth = 2.6;
    x.beginPath(); x.moveTo(2, mid); x.lineTo(w - 3, mid); x.stroke();
    for (var i = 4; i < w - 6; i += 3.2) {
      var spread = Math.sin((i / w) * Math.PI) * (h * 0.46);
      x.strokeStyle = i % 2 ? '#4F8A3C' : '#3F7331';
      x.lineWidth = 1.5;
      x.beginPath(); x.moveTo(i, mid); x.lineTo(i + 5, mid - spread); x.stroke();
      x.beginPath(); x.moveTo(i, mid); x.lineTo(i + 5, mid + spread); x.stroke();
    }
  });

  /* the soft dark patch a thing casts on the ground. Real shadow maps
     over a site this size cost more than they return, so the shade is
     painted in instead. */
  var shadowTex = tex(128, 128, function (x, w, h) {
    var g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(58,46,28,.46)');
    g.addColorStop(0.55, 'rgba(58,46,28,.24)');
    g.addColorStop(1, 'rgba(58,46,28,0)');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
  });

  var skyTex = tex(8, 256, function (x, w, h) {
    var g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0.00, '#E7C795');
    g.addColorStop(0.10, '#EEDCC0');
    g.addColorStop(0.24, '#CFDFE4');
    g.addColorStop(0.44, '#8FBCD4');
    g.addColorStop(0.72, '#4E8FB6');
    g.addColorStop(1.00, '#215C88');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
  });

  /* a band of glazed tile, for the one piece of colour on the mosque */
  var tileTex = tex(128, 32, function (x, w, h) {
    x.fillStyle = '#1F6E86'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#E8DCC0';
    for (var v = 0; v < w; v += 16) {
      x.beginPath();
      x.moveTo(v + 8, 4); x.lineTo(v + 14, h / 2); x.lineTo(v + 8, h - 4); x.lineTo(v + 2, h / 2);
      x.closePath(); x.fill();
    }
  }, 30, 1);

  /* -- materials ---------------------------------------------------- */
  var M = {
    stone: new THREE.MeshStandardMaterial({ map: stoneTex, color: 0xE6DAC2, roughness: 0.94 }),
    stoneWarm: new THREE.MeshStandardMaterial({ map: stoneTex, color: 0xE8D9B8, roughness: 0.92 }),
    shade: mat(0x6E6048, 0.98),
    dark: mat(0x3A3128, 0.95),
    pave: new THREE.MeshStandardMaterial({ map: paveTex, roughness: 0.95 }),
    walk: new THREE.MeshStandardMaterial({ map: walkTex, roughness: 0.95 }),
    sand: new THREE.MeshStandardMaterial({ map: sandTex, roughness: 1 }),
    grass: new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1 }),
    wood: new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.88 }),
    deck: new THREE.MeshStandardMaterial({ map: deckTex, roughness: 0.9 }),
    road: new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.96 }),
    tile: new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.34, metalness: 0.12 }),
    brass: mat(0xB89A4E, 0.42, 0.55),
    water: new THREE.MeshStandardMaterial({ color: 0x27606E, roughness: 0.18, metalness: 0.45, transparent: true, opacity: 0.9 }),
    sea: new THREE.MeshStandardMaterial({ color: 0x21697E, roughness: 0.2, metalness: 0.45 }),
    trunk: mat(0x8A7250, 0.96),
    frond: new THREE.MeshStandardMaterial({ map: frondTex, transparent: true, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.9 }),
    shadow: new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }),
    glass: new THREE.MeshStandardMaterial({ color: 0xA9CBD2, roughness: 0.1, metalness: 0.5 }),
    white: mat(0xF6F2E8, 0.86),
    steel: mat(0x9AA0A2, 0.4, 0.6)
  };

  var stripeMats = [
    new THREE.MeshStandardMaterial({ map: stripeTex('#F2EADA', '#B44C3A'), roughness: 0.9, side: THREE.DoubleSide }),
    new THREE.MeshStandardMaterial({ map: stripeTex('#F2EADA', '#2A6E7E'), roughness: 0.9, side: THREE.DoubleSide }),
    new THREE.MeshStandardMaterial({ map: stripeTex('#F5EFE0', '#3C6B36'), roughness: 0.9, side: THREE.DoubleSide }),
    new THREE.MeshStandardMaterial({ map: stripeTex('#F3EBD9', '#C08A2E'), roughness: 0.9, side: THREE.DoubleSide })
  ];

  /* -- a wall of pointed arches ------------------------------------
     Built as one shape with the openings cut out of it, so an arcade
     of twenty-eight arches is a single mesh rather than twenty-eight.
     The shape stands in XY and faces +Z. */
  function archPanel(W, H, thick, n, o) {
    o = o || {};
    var s = new THREE.Shape();
    s.moveTo(-W / 2, 0); s.lineTo(W / 2, 0); s.lineTo(W / 2, H); s.lineTo(-W / 2, H); s.closePath();
    var pitch = W / n;
    var ow = pitch * (o.ratio === undefined ? 0.6 : o.ratio);
    var ys = H * (o.spring === undefined ? 0.46 : o.spring);
    var ya = H * (o.apex === undefined ? 0.86 : o.apex);
    for (var i = 0; i < n; i++) {
      var cx = -W / 2 + pitch * (i + 0.5);
      var p = new THREE.Path();
      p.moveTo(cx - ow / 2, 0);
      p.lineTo(cx - ow / 2, ys);
      p.quadraticCurveTo(cx - ow / 2, ys + (ya - ys) * 0.66, cx, ya);
      p.quadraticCurveTo(cx + ow / 2, ys + (ya - ys) * 0.66, cx + ow / 2, ys);
      p.lineTo(cx + ow / 2, 0);
      p.closePath();
      s.holes.push(p);
    }
    var g = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: false, curveSegments: 8 });
    g.translate(0, 0, -thick / 2);
    return g;
  }

  /* a flat plane laid on the ground */
  function ground(w, d, material, x, z, y) {
    var m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), material);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y === undefined ? 0.02 : y, z);
    return m;
  }

  /* a sagging fabric sail — a plane pulled down between its corners */
  function sail(w, d, sag, material) {
    var g = new THREE.PlaneGeometry(w, d, 10, 10);
    var p = g.attributes.position;
    for (var i = 0; i < p.count; i++) {
      var u = p.getX(i) / (w / 2), v = p.getY(i) / (d / 2);
      p.setZ(i, -sag * (1 - u * u) * (1 - v * v));
    }
    g.computeVertexNormals();
    var m = new THREE.Mesh(g, material);
    m.rotation.x = -Math.PI / 2;
    return m;
  }

  /* ================================================================
     4 + 5. THE SITE
     +X is east, -Z is north (the sea). One unit is one metre.
     ================================================================ */
  var scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xD6CDB6, 190, 1150);
  var world = new THREE.Group();
  scene.add(world);

  /* things you cannot walk through: [x0, x1, z0, z1] */
  var BLOCK = [];
  function blocker(x0, x1, z0, z1) { BLOCK.push([x0, x1, z0, z1]); }

  /* shared instancers, filled by the builders below */
  var I = {
    trunk: new Inst((function () {
      var g = new THREE.CylinderGeometry(0.3, 0.52, 1, 8); g.translate(0, 0.5, 0); return g;
    })(), M.trunk),
    frond: new Inst((function () {
      var g = new THREE.PlaneGeometry(5.4, 1.5);
      g.rotateX(-Math.PI / 2); g.translate(2.7, 0, 0); return g;
    })(), M.frond),
    shadow: new Inst(new THREE.PlaneGeometry(1, 1), M.shadow),
    merlon: new Inst(new THREE.BoxGeometry(1, 1, 1), M.stoneWarm),
    post: new Inst((function () {
      var g = new THREE.BoxGeometry(0.15, 1, 0.15); g.translate(0, 0.5, 0); return g;
    })(), M.wood),
    steelPost: new Inst((function () {
      var g = new THREE.CylinderGeometry(0.09, 0.11, 1, 8); g.translate(0, 0.5, 0); return g;
    })(), M.steel),
    counter: new Inst(new THREE.BoxGeometry(3, 0.95, 0.72), M.wood),
    backPanel: new Inst(new THREE.BoxGeometry(3, 2.1, 0.09), M.wood),
    crate: new Inst(new THREE.BoxGeometry(0.42, 0.3, 0.34), M.white),
    bench: new Inst(new THREE.BoxGeometry(1, 0.44, 0.52), M.stoneWarm),
    table: new Inst(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 12), M.white),
    tableLeg: new Inst((function () {
      var g = new THREE.CylinderGeometry(0.05, 0.05, 1, 6); g.translate(0, 0.5, 0); return g;
    })(), M.steel),
    chair: new Inst((function () {
      var g = new THREE.BoxGeometry(0.44, 0.06, 0.44); g.translate(0, 0.45, 0); return g;
    })(), M.wood),
    chairBack: new Inst((function () {
      var g = new THREE.BoxGeometry(0.44, 0.5, 0.05); g.translate(0, 0.25, 0); return g;
    })(), M.wood),
    slat: new Inst(new THREE.BoxGeometry(0.12, 0.1, 1), M.wood),
    body: new Inst((function () {
      var g = new THREE.CylinderGeometry(0.19, 0.24, 1, 8); g.translate(0, 0.5, 0); return g;
    })(), new THREE.MeshStandardMaterial({ roughness: 0.88 })),
    head: new Inst(new THREE.SphereGeometry(0.105, 8, 6),
      new THREE.MeshStandardMaterial({ roughness: 0.85 })),
    lamp: new Inst((function () {
      var g = new THREE.CylinderGeometry(0.06, 0.09, 1, 7); g.translate(0, 0.5, 0); return g;
    })(), M.dark),
    lantern: new Inst(new THREE.BoxGeometry(0.34, 0.5, 0.34),
      new THREE.MeshStandardMaterial({ color: 0xFFE9B8, emissive: 0xFFD27A, emissiveIntensity: 0.5, roughness: 0.5 }))
  };
  var awnings = stripeMats.map(function (m) { return new Inst(new THREE.BoxGeometry(3.7, 0.09, 2.7), m); });

  function shade(x, z, r, y) {
    I.shadow.at(x, y === undefined ? 0.06 : y, z, { rx: -Math.PI / 2, sx: r, sy: r, sz: 1 });
  }

  /* ---- a date palm ------------------------------------------------ */
  function palm(x, z, h, seed) {
    I.trunk.at(x, 0, z, { sx: 1, sy: h, sz: 1, ry: seed });
    var n = 11;
    for (var i = 0; i < n; i++) {
      var droop = 0.16 + ((i + seed) % 3) * 0.26;
      I.frond.at(x, h - 0.15, z, {
        ry: (i / n) * TAU + seed, rz: -droop,
        sx: 0.82 + ((i * 7 + seed) % 5) * 0.06, sy: 1, sz: 0.9
      });
    }
    shade(x, z, 6.2 + h * 0.2);
  }

  /* ---- a person, for scale ---------------------------------------- */
  var WEAR = [0xF4F1E8, 0xF8F6F0, 0x2A2A2E, 0x1F2026, 0xE8E2D2, 0x3C4A58, 0x7A3E34, 0x2F5B4A];
  var SKIN = [0xC9A07B, 0xB4835E, 0x8E6344, 0xDDBA96];
  function person(x, z, ry) {
    /* a viewpoint is somewhere you stand, so leave it clear */
    for (var v = 0; v < ZONES.length; v++) {
      var w = ZONES[v].view;
      if ((x - w.x) * (x - w.x) + (z - w.z) * (z - w.z) < 64) return;
    }
    var h = 1.6 + Math.random() * 0.22;
    I.body.at(x, 0, z, { sx: 1, sy: h - 0.22, sz: 1, ry: ry || Math.random() * TAU, c: WEAR[(Math.random() * WEAR.length) | 0] });
    I.head.at(x, h - 0.1, z, { c: SKIN[(Math.random() * SKIN.length) | 0] });
    shade(x, z, 1.5);
  }

  /* ---- a lamp post ------------------------------------------------- */
  function lampPost(x, z) {
    I.lamp.at(x, 0, z, { sx: 1, sy: 4.4, sz: 1 });
    I.lantern.at(x, 4.6, z, {});
  }

  /* ================================================================
     THE MOSQUE
     Modelled from photographs: a walled compound, a broad prayer hall
     under one dome, and a single minaret off the north-west corner.
     Close enough to recognise; not close enough to build from.
     ================================================================ */
  (function mosque() {
    var g = new THREE.Group();

    /* the plinth the whole compound sits on, two steps up */
    g.add(put(box(190, 0.9, 150, M.stoneWarm), 0, 0.45, 0));
    g.add(put(box(196, 0.45, 156, M.pave), 0, 0.22, 0));

    /* the compound wall, an open arcade on all four sides */
    var wallH = 8.2;
    function wallSide(W, n, x, z, ry) {
      var m = new THREE.Mesh(archPanel(W, wallH, 1.3, n, { ratio: 0.5, spring: 0.44, apex: 0.84 }), M.stone);
      m.position.set(x, 0.9, z); m.rotation.y = ry;
      g.add(m);
    }
    wallSide(168, 21, 0, 65, 0);
    wallSide(168, 21, 0, -65, Math.PI);
    wallSide(130, 16, 84, 0, -Math.PI / 2);
    wallSide(130, 16, -84, 0, Math.PI / 2);
    /* the corners the arcades don't reach */
    [[84, 65], [-84, 65], [84, -65], [-84, -65]].forEach(function (c) {
      g.add(put(box(4, wallH + 0.8, 4, M.stoneWarm), c[0], 0.9 + (wallH + 0.8) / 2, c[1]));
    });

    /* the prayer hall: a solid core, with an arcaded skin standing
       proud of it so the arches read as deep recesses */
    var blockH = 20;
    g.add(put(box(90, blockH, 66, M.shade), 0, 0.9 + blockH / 2, 0));
    function face(W, n, x, z, ry) {
      var m = new THREE.Mesh(archPanel(W, blockH, 1.6, n, { ratio: 0.58, spring: 0.44, apex: 0.88 }), M.stone);
      m.position.set(x, 0.9, z); m.rotation.y = ry;
      g.add(m);
    }
    face(92, 11, 0, 34, 0);
    face(92, 11, 0, -34, Math.PI);
    face(68, 8, 46, 0, -Math.PI / 2);
    face(68, 8, -46, 0, Math.PI / 2);
    /* the flat roof that caps the skin */
    g.add(put(box(93.4, 1.2, 69.4, M.stoneWarm), 0, 0.9 + blockH + 0.6, 0));

    /* crenellations along the parapet */
    var top = 0.9 + blockH + 1.2 + 0.7;
    for (var x = -45.5; x <= 45.5; x += 2.9) {
      I.merlon.at(x, top, 34.2, { sx: 1.5, sy: 1.4, sz: 1 });
      I.merlon.at(x, top, -34.2, { sx: 1.5, sy: 1.4, sz: 1 });
    }
    for (var z = -33; z <= 33; z += 2.9) {
      I.merlon.at(46.2, top, z, { sx: 1, sy: 1.4, sz: 1.5 });
      I.merlon.at(-46.2, top, z, { sx: 1, sy: 1.4, sz: 1.5 });
    }
    /* and along the compound wall */
    for (var wx = -83; wx <= 83; wx += 3.1) {
      I.merlon.at(wx, 9.4, 65, { sx: 1.3, sy: 1.1, sz: 1.1 });
      I.merlon.at(wx, 9.4, -65, { sx: 1.3, sy: 1.1, sz: 1.1 });
    }
    for (var wz = -63; wz <= 63; wz += 3.1) {
      I.merlon.at(84, 9.4, wz, { sx: 1.1, sy: 1.1, sz: 1.3 });
      I.merlon.at(-84, 9.4, wz, { sx: 1.1, sy: 1.1, sz: 1.3 });
    }

    /* the dome — about 26 m across, about 43 m to the finial */
    var domeBase = 0.9 + blockH + 1.2;
    var drum = new THREE.Mesh(new THREE.CylinderGeometry(14.6, 15.4, 5.4, 40), M.stone);
    g.add(put(drum, 0, domeBase + 2.7, 0));
    /* the ring of windows that lights the hall under it */
    for (var i = 0; i < 28; i++) {
      var a = (i / 28) * TAU;
      var wm = box(1.5, 3.1, 0.5, M.dark);
      wm.position.set(Math.sin(a) * 14.7, domeBase + 2.8, Math.cos(a) * 14.7);
      wm.rotation.y = a;
      g.add(wm);
    }
    /* a single band of glazed tile: the one piece of colour */
    var band = new THREE.Mesh(new THREE.CylinderGeometry(14.75, 14.75, 1.1, 40, 1, true), M.tile);
    g.add(put(band, 0, domeBase + 5.9, 0));

    var dome = new THREE.Mesh(
      new THREE.SphereGeometry(14.6, 44, 22, 0, TAU, 0, Math.PI * 0.5), M.stoneWarm);
    dome.scale.y = 0.98;
    g.add(put(dome, 0, domeBase + 6.4, 0));
    g.add(put(new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.6, 1.4, 12), M.brass), 0, domeBase + 20.6, 0));
    g.add(put(new THREE.Mesh(new THREE.SphereGeometry(0.85, 14, 10), M.brass), 0, domeBase + 21.9, 0));
    g.add(put(new THREE.Mesh(new THREE.ConeGeometry(0.22, 2.4, 10), M.brass), 0, domeBase + 23.6, 0));

    /* the minaret, about 74 m */
    var mx = -62, mz = -46;
    g.add(put(box(9, 6, 9, M.stone), mx, 0.9 + 3, mz));
    var shaft = new THREE.Mesh(new THREE.CylinderGeometry(3.1, 3.9, 38, 4), M.stone);
    shaft.rotation.y = Math.PI / 4;
    g.add(put(shaft, mx, 0.9 + 6 + 19, mz));
    function balcony(y, r) {
      g.add(put(new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.86, 1.3, 16), M.stoneWarm), mx, y, mz));
      g.add(put(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.94, r * 0.94, 1.1, 16, 1, true), M.brass), mx, y + 1.2, mz));
    }
    balcony(0.9 + 44.6, 5);
    var upper = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.7, 15, 8), M.stone);
    g.add(put(upper, mx, 0.9 + 46 + 7.5, mz));
    balcony(0.9 + 61.4, 3.6);
    g.add(put(new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.9, 6.4, 8), M.stone), mx, 0.9 + 62.8 + 3.2, mz));
    g.add(put(new THREE.Mesh(new THREE.SphereGeometry(1.9, 16, 10, 0, TAU, 0, Math.PI / 2), M.stoneWarm), mx, 0.9 + 69.2, mz));
    g.add(put(new THREE.Mesh(new THREE.ConeGeometry(0.3, 3.4, 10), M.brass), mx, 0.9 + 72, mz));

    world.add(g);
    blocker(-97, 97, -77, 77);
  })();

  /* ================================================================
     THE GROUND GIVEN OVER TO PEOPLE
     ================================================================ */

  /* ---- 00. the ground itself, and the sea ------------------------- */
  (function base() {
    world.add(ground(1600, 1600, M.sand, 0, -120, -0.02));

    /* 01 · the prayer court — paving, and nothing on it */
    world.add(ground(268, 226, M.pave, 0, 0, 0.01));

    /* the souq ground and the walk that runs south from the court */
    world.add(ground(120, 122, M.walk, 0, 132, 0.02));
    world.add(ground(26, 40, M.walk, 0, 92, 0.02));

    /* Gulf Street: six lanes, and the reason the promenade exists */
    world.add(ground(900, 28, M.road, 0, -136, 0.03));
    world.add(ground(900, 5, M.sand, 0, -119, 0.04));
    world.add(ground(900, 5, M.sand, 0, -153, 0.04));

    /* the sea */
    var sea = ground(2000, 900, M.sea, 0, -660, -1.6);
    world.add(sea);
    /* the rock edge it breaks against */
    for (var i = -156; i <= 94; i += 4) {
      var r = box(4.2, 2.2, 3.4, M.stoneWarm);
      r.position.set(i, -0.6, -209 - Math.random() * 1.6);
      r.rotation.y = Math.random() * 0.6;
      world.add(r);
    }
  })();

  /* ---- 02. the souq: 64 booths in four rows, 2.1 km inland ---------
     It is deliberately not the mosque's forecourt. A market of this size
     wants its own ground and its own car park, so it sits a three-minute
     drive down the planted road that starts at the south edge of the
     court. SOUQ.z is the one number that places the whole precinct. --- */
  var SOUQ = { z: 2098, km: 2.1 };

  (function souq() {
    var rowsX = [-26, -10, 10, 26];      /* four rows, a 16 m walk between the inner pair */
    var z0 = SOUQ.z - 40, step = 5.2, per = 16;

    /* the ground the precinct stands on */
    world.add(ground(150, 150, M.walk, 0, SOUQ.z - 12, 0.02));

    rowsX.forEach(function (bx, ri) {
      var facing = bx < 0 ? 1 : -1;      /* counters turn to face the central walk */
      for (var i = 0; i < per; i++) {
        var bz = z0 + i * step;
        var k = (ri * per + i);
        var m = k % 4;

        /* frame */
        [[-1.5, -1.3], [1.5, -1.3], [-1.5, 1.3], [1.5, 1.3]].forEach(function (p) {
          I.post.at(bx + p[0], 0, bz + p[1], { sx: 1, sy: 2.7, sz: 1 });
        });
        /* back panel away from the walk, counter towards it */
        I.backPanel.at(bx - facing * 1.35, 1.05, bz, { ry: Math.PI / 2 });
        I.counter.at(bx + facing * 1.1, 0.48, bz, { ry: Math.PI / 2 });
        /* awning, sloping out over the counter */
        awnings[m].at(bx + facing * 0.25, 2.78, bz, { ry: Math.PI / 2, rz: facing * 0.12 });
        /* what is on the counter */
        for (var c = 0; c < 4; c++) {
          I.crate.at(bx + facing * 1.1, 1.1, bz - 1 + c * 0.66, {
            ry: Math.random(), c: [0xC4703A, 0x8B5E3C, 0xD9C07A, 0x6E8C4A, 0xA8484A][(k + c) % 5]
          });
        }
        I.lantern.at(bx + facing * 0.5, 2.4, bz, { sx: 0.5, sy: 0.5, sz: 0.5 });
        shade(bx + facing * 0.4, bz, 6.4);
        blocker(bx - 1.7, bx + 1.7, bz - 1.5, bz + 1.5);
      }
      shade(bx, z0 + (per * step) / 2, 30);
    });

    /* the water channel down the middle of the walk */
    world.add(put(box(3.4, 0.36, 84, M.stoneWarm), 0, 0.16, SOUQ.z - 1));
    world.add(put(box(2.4, 0.5, 84, M.water), 0, 0.22, SOUQ.z - 1));
    /* a basin at its head, where the road arrives */
    world.add(put(new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 0.5, 28), M.stoneWarm), 0, 0.2, SOUQ.z - 46));
    world.add(put(new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.4, 0.52, 28), M.water), 0, 0.32, SOUQ.z - 46));

    /* shade sails over the central walk, and lamps along it */
    for (var sN = 0; sN < 5; sN++) {
      var sz = SOUQ.z - 32 + sN * 17;
      var sl = sail(13, 12, 1.5, stripeMats[(sN + 1) % 4]);
      sl.position.set(0, 8, sz);
      world.add(sl);
      [[-6, -6], [6, -6], [-6, 6], [6, 6]].forEach(function (p) {
        I.steelPost.at(p[0], 0, sz + p[1], { sx: 1, sy: 8.1, sz: 1 });
      });
      shade(0, sz, 24);
      lampPost(-8.4, sz - 8);
      lampPost(8.4, sz - 8);
    }

    /* palms lining the outside of the rows */
    for (var p = 0; p < 10; p++) {
      palm(-36, SOUQ.z - 38 + p * 8.4, 7 + (p % 3), p);
      palm(36, SOUQ.z - 38 + p * 8.4, 7 + ((p + 1) % 3), p + 3);
    }

    /* people, thickest here */
    for (var q = 0; q < 46; q++) {
      var side = Math.random() < 0.5 ? -1 : 1;
      person(side * (2.5 + Math.random() * 6), SOUQ.z - 42 + Math.random() * 82);
    }

    /* the car park the distance earns it */
    world.add(ground(84, 132, M.walk, 102, SOUQ.z - 12, 0.03));
    var bay = new Inst(new THREE.BoxGeometry(0.14, 0.02, 5, 1, 1, 1), M.white);
    var car = new Inst((function () {
      var g = new THREE.BoxGeometry(1.82, 1.44, 4.4); g.translate(0, 0.72, 0); return g;
    })(), mat(0xFFFFFF, 0.4, 0.3));
    var PAINT = [0xF2F2F0, 0x2A2C30, 0x9BA1A6, 0x6E2F2C, 0x24415C, 0xE8E4DA, 0x3A4A3C];
    for (var r = 0; r < 4; r++) {
      var cx = 70 + r * 22;
      for (var b = 0; b < 22; b++) {
        var cz = SOUQ.z - 74 + b * 6;
        bay.at(cx - 3, 0.05, cz - 3, {});
        bay.at(cx + 3, 0.05, cz - 3, {});
        if ((r * 22 + b) % 3 !== 2) {
          car.at(cx, 0, cz, { ry: (r % 2 ? 0.02 : -0.02), c: PAINT[(r * 7 + b) % PAINT.length] });
          shade(cx, cz, 6);
        }
      }
      blocker(cx - 4, cx + 4, SOUQ.z - 78, SOUQ.z + 54);
    }
    bay.into(world);
    car.into(world);
  })();

  /* ---- the road between them: 1.8 km of planted carriageway --------
     Gulf Street's texture repeated over two kilometres would stretch its
     markings out of shape, so the link gets its own copy of the map with
     its own repeat. ------------------------------------------------- */
  (function link() {
    var z0 = 196, z1 = SOUQ.z - 78, len = z1 - z0, mid = (z0 + z1) / 2;

    var t = roadTex.clone();
    t.needsUpdate = true;
    t.repeat.set(1, len / 15);
    var linkRoad = new THREE.MeshStandardMaterial({ map: t, roughness: 0.96 });

    world.add(ground(18, len, linkRoad, 0, mid, 0.03));
    world.add(ground(9, len, M.walk, -14.5, mid, 0.04));
    world.add(ground(9, len, M.walk, 14.5, mid, 0.04));
    world.add(put(box(1, 0.42, len, M.stoneWarm), -9.6, 0.21, mid));
    world.add(put(box(1, 0.42, len, M.stoneWarm), 9.6, 0.21, mid));

    for (var z = z0 + 14; z < z1 - 10; z += 24) {
      palm(-19.5, z, 7 + (z % 3), z);
      palm(19.5, z, 7 + ((z + 1) % 3), z + 1);
      if (z % 48 < 24) { lampPost(-10.8, z); lampPost(10.8, z); }
    }
    /* the footways are yours; the carriageway is not */
    blocker(-9.4, 9.4, z0, z1);
  })();

  /* ---- 03. the arcade: 28 shop units on the east ------------------ */
  (function arcade() {
    var cx = 150;
    /* the building */
    world.add(put(box(22, 9, 142, M.stoneWarm), cx, 4.5, 0));
    world.add(put(box(24, 1.1, 144, M.stone), cx, 9.4, 0));
    /* the colonnade in front of it, twenty-eight pointed arches */
    var col = new THREE.Mesh(archPanel(142, 8.2, 1.2, 28, { ratio: 0.56, spring: 0.44, apex: 0.86 }), M.stone);
    col.position.set(cx - 12.6, 0, 0);
    col.rotation.y = -Math.PI / 2;
    world.add(col);
    world.add(put(box(13, 0.9, 143, M.stone), cx - 6.5, 8.6, 0));
    world.add(put(box(13, 0.3, 143, M.walk), cx - 6.5, 0.16, 0));
    /* the shopfronts behind the arches: glass, and a sign over each */
    for (var i = 0; i < 28; i++) {
      var z = -68.5 + i * 5.07;
      world.add(put(box(0.3, 4.6, 4.2, M.glass), cx - 11, 2.4, z));
      var sign = box(0.22, 0.8, 3.6, mat([0x2A6E7E, 0x8B4A34, 0x3F6B38, 0xB08A2E][i % 4], 0.7));
      world.add(put(sign, cx - 11.1, 5.6, z));
    }
    /* crenellations, to answer the mosque wall across the court */
    for (var mzz = -70; mzz <= 70; mzz += 3.2) {
      I.merlon.at(cx + 11.4, 10.4, mzz, { sx: 1.1, sy: 1.1, sz: 1.4 });
      I.merlon.at(cx - 11.4, 10.4, mzz, { sx: 1.1, sy: 1.1, sz: 1.4 });
    }
    for (var p = 0; p < 16; p++) {
      palm(cx - 24, -68 + p * 9.1, 7.5 + (p % 3), p);
    }
    for (var q = 0; q < 16; q++) person(cx - 19 + Math.random() * 12, -66 + Math.random() * 132);
    blocker(cx - 13.4, cx + 11.6, -72, 72);
  })();

  /* ---- 04. the food terraces on the west -------------------------- */
  (function terraces() {
    var kx = -152;
    for (var i = 0; i < 9; i++) {
      var kz = -64 + i * 16;
      /* the kitchen */
      world.add(put(box(12, 4.6, 9.4, M.stoneWarm), kx, 2.3, kz));
      world.add(put(box(13, 0.7, 10.4, M.stone), kx, 4.9, kz));
      world.add(put(box(0.3, 2.6, 7, M.glass), kx + 6.1, 2.2, kz));
      var sign = box(0.2, 0.7, 5.4, mat([0x8B4A34, 0x2A6E7E, 0xB08A2E][i % 3], 0.7));
      world.add(put(sign, kx + 6.2, 4.2, kz));
      blocker(kx - 6.4, kx + 6.4, kz - 5, kz + 5);

      /* its pergola, and the seating under it */
      var px = kx + 15;
      /* four edge beams and the slats between them: shade with gaps in it */
      world.add(put(box(13.4, 0.3, 0.3, M.wood), px, 3.6, kz - 6.5));
      world.add(put(box(13.4, 0.3, 0.3, M.wood), px, 3.6, kz + 6.5));
      world.add(put(box(0.3, 0.3, 13.4, M.wood), px - 6.5, 3.6, kz));
      world.add(put(box(0.3, 0.3, 13.4, M.wood), px + 6.5, 3.6, kz));
      for (var s = -5.7; s <= 5.7; s += 0.62) I.slat.at(px + s, 3.72, kz, { sx: 1, sy: 1, sz: 13 });
      [[-6, -6], [6, -6], [-6, 6], [6, 6]].forEach(function (c) {
        I.post.at(px + c[0], 0, kz + c[1], { sx: 1.6, sy: 3.5, sz: 1.6 });
      });
      shade(px, kz, 17);
      for (var t = 0; t < 4; t++) {
        var tx = px - 4 + (t % 2) * 8, tz = kz - 4 + ((t / 2) | 0) * 8;
        I.tableLeg.at(tx, 0, tz, { sx: 1, sy: 0.74, sz: 1 });
        I.table.at(tx, 0.76, tz, {});
        for (var c2 = 0; c2 < 4; c2++) {
          var a = (c2 / 4) * TAU + 0.4;
          var chx = tx + Math.sin(a) * 1.1, chz = tz + Math.cos(a) * 1.1;
          I.chair.at(chx, 0, chz, { ry: -a });
          I.chairBack.at(chx + Math.sin(a) * 0.22, 0.5, chz + Math.cos(a) * 0.22, { ry: -a });
        }
      }
      if (i % 2 === 0) person(px + 2, kz + 1);
    }
    /* the runnel along the terrace edge */
    world.add(put(box(1.4, 0.4, 150, M.stoneWarm), -126, 0.16, 8));
    world.add(put(box(1, 0.42, 150, M.water), -126, 0.26, 8));
    for (var p = 0; p < 15; p++) { palm(-120, -64 + p * 10.5, 7 + (p % 3), p); lampPost(-123, -60 + p * 10.5); }
    for (var q = 0; q < 14; q++) person(-140 + Math.random() * 18, -64 + Math.random() * 130);
  })();

  /* ---- 05. the lawn, south-east ----------------------------------- */
  (function lawn() {
    world.add(ground(118, 92, M.grass, 116, 142, 0.03));
    /* the rim, a step you can sit on the whole way round */
    world.add(put(box(122, 0.5, 1.2, M.stoneWarm), 116, 0.2, 95.4));
    world.add(put(box(122, 0.5, 1.2, M.stoneWarm), 116, 0.2, 188.6));
    world.add(put(box(1.2, 0.5, 94, M.stoneWarm), 56.4, 0.2, 142));
    world.add(put(box(1.2, 0.5, 94, M.stoneWarm), 175.6, 0.2, 142));
    /* ninety trees around it */
    for (var i = 0; i < 26; i++) {
      palm(60 + i * 4.6, 98, 7 + (i % 3), i);
      palm(60 + i * 4.6, 186, 7 + ((i + 2) % 3), i + 2);
    }
    for (var j = 0; j < 19; j++) { palm(59, 102 + j * 4.6, 7 + (j % 3), j); palm(173, 102 + j * 4.6, 8 + (j % 2), j + 1); }
    /* benches on the rim, and people on the grass */
    for (var b = 0; b < 14; b++) {
      I.bench.at(64 + b * 8, 0.22, 99.5, { sx: 2.2, sy: 1, sz: 1 });
      I.bench.at(64 + b * 8, 0.22, 184.5, { sx: 2.2, sy: 1, sz: 1, ry: Math.PI });
    }
    for (var q = 0; q < 22; q++) person(64 + Math.random() * 104, 100 + Math.random() * 84);
    for (var l = 0; l < 6; l++) { lampPost(60, 104 + l * 15); lampPost(172, 104 + l * 15); }
  })();

  /* ---- 06. the palm grove, south-west ----------------------------- */
  (function grove() {
    world.add(ground(118, 92, M.sand, -116, 142, 0.03));
    /* a hundred and twenty palms on a nine-metre grid, the walk left clear */
    var planted = 0;
    for (var i = 0; i < 14 && planted < 120; i++) {
      for (var j = 0; j < 10 && planted < 120; j++) {
        var x = -170 + i * 9 + ((j % 2) ? 1.6 : -1.6);
        var z = 102 + j * 9 + ((i % 2) ? 1.2 : -1.2);
        if (Math.abs(x + 116) < 5.5) continue;      /* the walk runs through here */
        palm(x, z, 6.4 + ((i + j) % 4) * 1.1, i + j);
        planted++;
      }
    }
    /* the walk through it, and somewhere to sit at every third tree */
    world.add(ground(7, 92, M.walk, -116, 142, 0.04));
    for (var b = 0; b < 9; b++) {
      I.bench.at(-121, 0.22, 106 + b * 9, { sx: 2, sy: 1, sz: 1, ry: Math.PI / 2 });
      I.bench.at(-111, 0.22, 110 + b * 9, { sx: 2, sy: 1, sz: 1, ry: -Math.PI / 2 });
    }
    for (var q = 0; q < 16; q++) person(-160 + Math.random() * 96, 102 + Math.random() * 84);
  })();

  /* ---- 07. the majlis: six sunken rooms at the head of the souq --- */
  (function majlis() {
    var h = SOUQ.z - 68, h2 = SOUQ.z - 56;
    var spots = [[-42, h], [-14, h], [14, h], [42, h], [-28, h2], [28, h2]];
    spots.forEach(function (s, i) {
      var x = s[0], z = s[1];
      /* the floor, one step down */
      world.add(ground(10, 10, M.walk, x, z, 0.05));
      world.add(put(box(11.4, 0.34, 11.4, M.stoneWarm), x, 0.17, z));
      world.add(ground(9.4, 9.4, M.walk, x, z, 0.36));
      /* benches on all four sides */
      I.bench.at(x, 0.5, z - 4.1, { sx: 7, sy: 1, sz: 1 });
      I.bench.at(x, 0.5, z + 4.1, { sx: 7, sy: 1, sz: 1, ry: Math.PI });
      I.bench.at(x - 4.1, 0.5, z, { sx: 7, sy: 1, sz: 1, ry: Math.PI / 2 });
      I.bench.at(x + 4.1, 0.5, z, { sx: 7, sy: 1, sz: 1, ry: -Math.PI / 2 });
      /* one sail over the whole room */
      var sl = sail(12, 12, 1.5, stripeMats[i % 4]);
      sl.position.set(x, 4.6, z);
      world.add(sl);
      [[-5.6, -5.6], [5.6, -5.6], [-5.6, 5.6], [5.6, 5.6]].forEach(function (c) {
        I.steelPost.at(x + c[0], 0, z + c[1], { sx: 1, sy: 4.7, sz: 1 });
      });
      shade(x, z, 18);
      person(x + 2, z - 3.4); person(x - 2.6, z + 3.2);
    });
    for (var l = 0; l < 5; l++) { lampPost(-56 + l * 28, SOUQ.z - 78); }
  })();

  /* ---- 08 + 09. the promenade and the waterfront deck -------------
     A ramp at one in twenty is the whole point of this piece, and one
     in twenty means 144 m of run for a 7.2 m rise. There is no room
     for that head-on, so the two approaches turn and run east and
     west along the corniche instead, and only the 52 m span crosses
     the road. Nothing here is steeper than 1:20 and there is not a
     single step. --------------------------------------------------- */
  var BR = { deck: 7.2, half: 5.5, zS: -110, zN: -162, run: 144, thick: 0.6 };

  function groundY(x, z) {
    if (Math.abs(x) <= BR.half && z <= BR.zS && z >= BR.zN) return BR.deck;   /* the span */
    if (Math.abs(z - BR.zS) <= BR.half && x > BR.half) {                      /* south approach, running east */
      var d = x - BR.half;
      return d >= BR.run ? 0 : BR.deck * (1 - d / BR.run);
    }
    if (Math.abs(z - BR.zN) <= BR.half && x < -BR.half) {                     /* north approach, running west */
      var d2 = -x - BR.half;
      return d2 >= BR.run ? 0 : BR.deck * (1 - d2 / BR.run);
    }
    return 0;
  }

  (function promenade() {
    /* the span over Gulf Street */
    var spanLen = BR.zS - BR.zN;
    world.add(put(box(BR.half * 2, BR.thick, spanLen, M.deck), 0, BR.deck - BR.thick / 2, (BR.zS + BR.zN) / 2));
    [-118, -136, -154].forEach(function (z) {
      world.add(put(box(2.6, BR.deck - BR.thick, 2.6, M.stone), -4, (BR.deck - BR.thick) / 2, z));
      world.add(put(box(2.6, BR.deck - BR.thick, 2.6, M.stone), 4, (BR.deck - BR.thick) / 2, z));
    });

    /* one ramp: a run of short segments following the slope, with the
       handrail and the piers that hold it up */
    function ramp(sign) {
      var z = sign > 0 ? BR.zS : BR.zN;   /* +1 south / east, -1 north / west */
      var segs = 30;
      for (var i = 0; i < segs; i++) {
        var d0 = (i / segs) * BR.run, d1 = ((i + 1) / segs) * BR.run;
        var x0 = sign * (BR.half + d0), x1 = sign * (BR.half + d1);
        var y0 = BR.deck * (1 - d0 / BR.run), y1 = BR.deck * (1 - d1 / BR.run);
        var seg = box(Math.abs(x1 - x0) + 0.1, BR.thick, BR.half * 2, M.deck);
        seg.position.set((x0 + x1) / 2, (y0 + y1) / 2 - BR.thick / 2, z);
        seg.rotation.z = sign * Math.atan2(y0 - y1, Math.abs(x1 - x0));
        world.add(seg);
        /* a pier every fifth segment, while there is still height to hold */
        if (i % 5 === 0 && y0 > 1.4) {
          world.add(put(box(1.9, y0 - BR.thick, 1.9, M.stone), (x0 + x1) / 2, (y0 - BR.thick) / 2, z));
        }
        /* the rail, both sides */
        if (i % 2 === 0) {
          [z - BR.half + 0.35, z + BR.half - 0.35].forEach(function (rz) {
            I.steelPost.at((x0 + x1) / 2, (y0 + y1) / 2, rz, { sx: 1, sy: 1.1, sz: 1 });
          });
        }
        [z - BR.half + 0.35, z + BR.half - 0.35].forEach(function (rz) {
          var rail = box(Math.abs(x1 - x0) + 0.1, 0.1, 0.1, M.steel);
          rail.position.set((x0 + x1) / 2, (y0 + y1) / 2 + 1.05, rz);
          rail.rotation.z = sign * Math.atan2(y0 - y1, Math.abs(x1 - x0));
          world.add(rail);
        });
      }
      /* people on the approach */
      for (var q = 0; q < 6; q++) {
        var d = Math.random() * BR.run;
        var px = sign * (BR.half + d);
        person(px, z + (Math.random() - 0.5) * 8);
      }
    }
    ramp(1);
    ramp(-1);

    /* the rail along the span itself */
    for (var i = 0; i < 26; i++) {
      var za = BR.zS - (spanLen) * (i / 26), zb = BR.zS - (spanLen) * ((i + 1) / 26);
      [-BR.half + 0.35, BR.half - 0.35].forEach(function (rx) {
        var rail = box(0.1, 0.1, Math.abs(zb - za) + 0.1, M.steel);
        rail.position.set(rx, BR.deck + 1.05, (za + zb) / 2);
        world.add(rail);
        if (i % 2 === 0) I.steelPost.at(rx, BR.deck, (za + zb) / 2, { sx: 1, sy: 1.1, sz: 1 });
      });
    }
    for (var q = 0; q < 8; q++) person((Math.random() - 0.5) * 9, BR.zN + Math.random() * spanLen);

    /* the corniche deck the west approach lands on */
    world.add(ground(250, 42, M.deck, -31, -187, 0.06));
    world.add(put(box(252, 0.6, 1.2, M.stoneWarm), -31, 0.3, -207.6));
    for (var b = 0; b < 17; b++) {
      I.bench.at(-148 + b * 14, 0.22, -202, { sx: 2.6, sy: 1, sz: 1, ry: Math.PI });
      lampPost(-148 + b * 14, -195);
    }
    for (var w2 = 0; w2 < 18; w2++) person(-150 + Math.random() * 240, -200 + Math.random() * 30);

    /* you cannot cross the road at grade: only the span gets you over */
    blocker(-600, -BR.half - 0.6, -152, -120);
    blocker(BR.half + 0.6, 600, -152, -120);
  })();

  /* ---- the city on the horizon, hazed by the fog ------------------ */
  (function horizon() {
    var far = mat(0xA9B6BC, 0.9);
    for (var i = 0; i < 26; i++) {
      var h = 18 + Math.random() * 90;
      var b = box(14 + Math.random() * 20, h, 14 + Math.random() * 20, far);
      var a = -0.5 + Math.random() * 2.6;
      var bx = Math.sin(a) * (430 + Math.random() * 180);
      if (Math.abs(bx) < 230) bx = (bx < 0 ? -230 : 230) - bx * 0.4;   /* clear of the road */
      b.position.set(bx, h / 2, Math.cos(a) * (430 + Math.random() * 180) + 60);
      world.add(b);
    }
    /* the souq is inland, so it has city on every side of it */
    for (var j = 0; j < 40; j++) {
      var h2 = 12 + Math.random() * 34;
      var c = box(16 + Math.random() * 26, h2, 16 + Math.random() * 26, far);
      var side = Math.random() < 0.5 ? -1 : 1;
      c.position.set(side * (230 + Math.random() * 300), h2 / 2, SOUQ.z - 400 + Math.random() * 800);
      world.add(c);
    }
    for (var k = 0; k < 14; k++) {
      var h3 = 12 + Math.random() * 26;
      var d = box(18 + Math.random() * 24, h3, 18 + Math.random() * 24, far);
      d.position.set(-220 + Math.random() * 440, h3 / 2, SOUQ.z + 210 + Math.random() * 260);
      world.add(d);
    }
  })();

  /* everything instanced goes in at once */
  Object.keys(I).forEach(function (k) { I[k].into(world); });
  awnings.forEach(function (a) { a.into(world); });

  /* the sky */
  var sky = new THREE.Mesh(new THREE.SphereGeometry(900, 26, 18),
    new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false }));
  scene.add(sky);
  var sun = new THREE.Mesh(new THREE.SphereGeometry(16, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xFFF3D2, fog: false }));
  scene.add(sun);
  /* both ride with the camera, so the sky and the sun sit in the same place in
     the sky whether you are at the mosque or two kilometres inland */
  function carrySky() {
    sky.position.set(camera.position.x, 0, camera.position.z);
    sun.position.set(camera.position.x - 620, 190, camera.position.z - 320);
  }

  /* late afternoon, light coming in off the sea from the north-west */
  scene.add(new THREE.HemisphereLight(0xBBD8EA, 0x9C8560, 0.52));
  var key = new THREE.DirectionalLight(0xFFEBC6, 1.5);
  key.position.set(-180, 120, -90);
  scene.add(key);
  var fill = new THREE.DirectionalLight(0x86B4CC, 0.2);
  fill.position.set(140, 70, 120);
  scene.add(fill);

  /* ================================================================
     6. THE HARNESS — camera, walking, collision, the read-out
     ================================================================ */
  var renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0xDCD3BC, 1);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;

  var camera = new THREE.PerspectiveCamera(62, 16 / 10, 0.1, 2600);
  camera.rotation.order = 'YXZ';

  var EYE = 1.7;
  var me = { x: 0, z: -134, yaw: Math.PI, pitch: -0.02 };   /* open on the mosque, from the bridge */
  var vel = { f: 0, s: 0 };
  var bob = 0;

  var LIMIT = { x0: -178, x1: 178, z0: -206, z1: 2180 };

  function blocked(x, z) {
    var r = 0.52;
    for (var i = 0; i < BLOCK.length; i++) {
      var b = BLOCK[i];
      if (x > b[0] - r && x < b[1] + r && z > b[2] - r && z < b[3] + r) return true;
    }
    return false;
  }

  function step(dx, dz) {
    /* one axis at a time, so you slide along a wall instead of sticking to it */
    var here = groundY(me.x, me.z);
    var nx = Math.max(LIMIT.x0, Math.min(LIMIT.x1, me.x + dx));
    if (!blocked(nx, me.z) && Math.abs(groundY(nx, me.z) - here) < 0.45) me.x = nx;
    here = groundY(me.x, me.z);
    var nz = Math.max(LIMIT.z0, Math.min(LIMIT.z1, me.z + dz));
    if (!blocked(me.x, nz) && Math.abs(groundY(me.x, nz) - here) < 0.45) me.z = nz;
  }

  function place() {
    camera.position.set(me.x, groundY(me.x, me.z) + EYE + bob, me.z);
    camera.rotation.set(me.pitch, me.yaw, 0);
  }

  /* -- looking around ------------------------------------------------ */
  var engaged = false, looking = false, lastX = 0, lastY = 0, lookId = null;

  function lookStart(e) {
    engaged = true;
    looking = true; lookId = e.pointerId;
    lastX = e.clientX; lastY = e.clientY;
    stage.classList.add('grabbing');
    hideHint();
  }
  function lookMove(e) {
    if (!looking || e.pointerId !== lookId) return;
    me.yaw -= (e.clientX - lastX) * 0.0042;
    me.pitch = Math.max(-0.85, Math.min(0.62, me.pitch - (e.clientY - lastY) * 0.0034));
    lastX = e.clientX; lastY = e.clientY;
    place();
  }
  function lookEnd(e) {
    if (e && lookId !== null && e.pointerId !== lookId) return;
    looking = false; lookId = null;
    stage.classList.remove('grabbing');
  }

  /* -- the touch stick ----------------------------------------------- */
  var pad = document.getElementById('pad');
  var knob = document.getElementById('padKnob');
  var padId = null, padV = { x: 0, y: 0 };

  function padStart(e) {
    padId = e.pointerId; engaged = true; hideHint();
    padMove(e);
    e.stopPropagation();
  }
  function padMove(e) {
    if (e.pointerId !== padId) return;
    var r = pad.getBoundingClientRect();
    var dx = e.clientX - (r.left + r.width / 2);
    var dy = e.clientY - (r.top + r.height / 2);
    var max = r.width / 2 - 14;
    var d = Math.sqrt(dx * dx + dy * dy);
    if (d > max) { dx *= max / d; dy *= max / d; }
    knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
    padV.x = dx / max; padV.y = dy / max;
    e.stopPropagation();
  }
  function padEnd(e) {
    if (e.pointerId !== padId) return;
    padId = null; padV.x = padV.y = 0;
    knob.style.transform = '';
  }
  pad.addEventListener('pointerdown', padStart);
  pad.addEventListener('pointermove', padMove);
  pad.addEventListener('pointerup', padEnd);
  pad.addEventListener('pointercancel', padEnd);

  stage.addEventListener('pointerdown', function (e) {
    if (e.target === pad || pad.contains(e.target)) return;
    stage.setPointerCapture && stage.setPointerCapture(e.pointerId);
    lookStart(e);
  });
  stage.addEventListener('pointermove', lookMove);
  stage.addEventListener('pointerup', lookEnd);
  stage.addEventListener('pointercancel', lookEnd);
  window.addEventListener('pointerup', lookEnd);

  document.addEventListener('pointerdown', function (e) {
    if (!stage.contains(e.target)) engaged = false;
  }, true);

  if (window.matchMedia('(hover: none)').matches) body.classList.add('touch');

  /* -- the keyboard --------------------------------------------------- */
  var keys = {};
  var MOVEKEYS = {
    KeyW: 1, KeyS: 1, KeyA: 1, KeyD: 1, ArrowUp: 1, ArrowDown: 1, ArrowLeft: 1, ArrowRight: 1
  };
  window.addEventListener('keydown', function (e) {
    if (!engaged) return;
    if (MOVEKEYS[e.code]) { keys[e.code] = true; e.preventDefault(); hideHint(); }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.run = true;
    if (e.code === 'Escape') engaged = false;
  });
  window.addEventListener('keyup', function (e) {
    if (MOVEKEYS[e.code]) keys[e.code] = false;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.run = false;
  });
  window.addEventListener('blur', function () { keys = {}; padV.x = padV.y = 0; });

  /* -- being taken somewhere ------------------------------------------ */
  var glide = null;
  function goTo(z) {
    if (!me) return;          /* the walkthrough never started */
    var from = { x: me.x, z: me.z, yaw: me.yaw };
    var dy = z.view.yaw - me.yaw;
    while (dy > Math.PI) dy -= TAU;
    while (dy < -Math.PI) dy += TAU;
    var far = Math.abs(z.view.x - me.x) + Math.abs(z.view.z - me.z) > 400;
    if (reduced || far) {
      /* the souq is a drive away: cut to it rather than fly the whole road */
      me.x = z.view.x; me.z = z.view.z; me.yaw = z.view.yaw; me.pitch = -0.02;
      glide = null;
      place(); look();
      return;
    }
    /* pace the move by how far it is, so a 300 m hop doesn't read as a rocket */
    var dist = Math.sqrt(Math.pow(z.view.x - from.x, 2) + Math.pow(z.view.z - from.z, 2));
    glide = { from: from, to: z.view, dyaw: dy, t: 0,
              dur: Math.max(0.7, Math.min(2.4, dist / 110)) };
    hideHint();
  }

  /* -- the read-out ---------------------------------------------------- */
  var whereNum = document.getElementById('whereNum');
  var whereName = document.getElementById('whereName');
  var whereText = document.getElementById('whereText');
  var compassDir = document.getElementById('compassDir');
  var compassTo = document.getElementById('compassTo');
  var hintEl = document.getElementById('hint');
  var current = null;

  var DIRS_EN = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  var DIRS_AR = ['شمال', 'شمال شرق', 'شرق', 'جنوب شرق', 'جنوب', 'جنوب غرب', 'غرب', 'شمال غرب'];

  function paintWhere(z) {
    if (!whereNum || !z) return;
    var ar = lang === 'ar';
    whereNum.textContent = z.num;
    whereName.innerHTML = esc(ar ? z.ar.name : z.en.name) +
      ' <span class="ar" lang="' + (ar ? 'en' : 'ar') + '" dir="' + (ar ? 'ltr' : 'rtl') + '">' +
      esc(ar ? z.en.name : z.ar.name) + '</span>';
    whereText.textContent = ar ? z.ar.short : z.en.short;
    /* the HUD box keeps an LTR layout, but its sentences run the right way */
    whereName.setAttribute('dir', ar ? 'rtl' : 'ltr');
    whereText.setAttribute('dir', ar ? 'rtl' : 'ltr');
    compassTo.setAttribute('dir', ar ? 'rtl' : 'ltr');
    barEl.querySelectorAll('.chip').forEach(function (c) {
      c.setAttribute('aria-pressed', String(c.dataset.go === z.id));
    });
  }

  function paintHint() {
    if (!hintEl) return;
    var touch = body.classList.contains('touch');
    if (lang === 'ar') {
      hintEl.innerHTML = touch
        ? 'اسحب للنظر · استخدم العصا للمشي'
        : 'اسحب للنظر · <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> للمشي · <kbd>Shift</kbd> للركض';
    } else {
      hintEl.innerHTML = touch
        ? 'Drag to look &middot; stick to walk'
        : 'Drag to look &middot; <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> to walk &middot; <kbd>Shift</kbd> to run';
    }
  }
  function hideHint() { if (hintEl) hintEl.classList.add('gone'); }

  function look() {
    /* which zone am I standing in */
    var found = null;
    for (var i = 0; i < ZONES.length; i++) {
      var b = ZONES[i].bounds;
      if (me.x >= b[0] && me.x <= b[1] && me.z >= b[2] && me.z <= b[3]) { found = ZONES[i]; break; }
    }
    if (found && found !== current) { current = found; paintWhere(found); }

    /* the compass, and how far the mosque is */
    var a = ((-me.yaw) % TAU + TAU) % TAU;
    var idx = Math.round(a / (TAU / 8)) % 8;
    compassDir.textContent = lang === 'ar' ? DIRS_AR[idx] : DIRS_EN[idx];
    var d = Math.round(Math.sqrt(me.x * me.x + me.z * me.z) - 70);
    var far = d >= 1000 ? (d / 1000).toFixed(1) : null;
    compassTo.textContent = lang === 'ar'
      ? 'المسجد ' + (d < 6 ? 'أمامك' : far ? far + ' كم' : d + ' م')
      : 'mosque ' + (d < 6 ? 'right here' : far ? far + ' km' : d + ' m');
  }

  /* -- size, visibility, and the loop ---------------------------------- */
  function resize() {
    var w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', function () { resize(); place(); });

  var visible = true;
  if ('IntersectionObserver' in window) {
    visible = false;
    new IntersectionObserver(function (rows) { visible = rows[0].isIntersecting; },
      { rootMargin: '160px' }).observe(stage);
  }

  var last = performance.now(), tick = 0;
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    requestAnimationFrame(frame);
    if (!visible) return;

    if (glide) {
      glide.t = Math.min(1, glide.t + dt / glide.dur);
      var e = glide.t < 0.5 ? 4 * glide.t * glide.t * glide.t
        : 1 - Math.pow(-2 * glide.t + 2, 3) / 2;
      me.x = glide.from.x + (glide.to.x - glide.from.x) * e;
      me.z = glide.from.z + (glide.to.z - glide.from.z) * e;
      me.yaw = glide.from.yaw + glide.dyaw * e;
      me.pitch += (-0.02 - me.pitch) * 0.08;
      if (glide.t >= 1) glide = null;
    } else {
      var f = 0, s = 0;
      if (keys.KeyW || keys.ArrowUp) f += 1;
      if (keys.KeyS || keys.ArrowDown) f -= 1;
      if (keys.KeyA || keys.ArrowLeft) s -= 1;
      if (keys.KeyD || keys.ArrowRight) s += 1;
      if (padId !== null) { f -= padV.y; s += padV.x; }
      var speed = (keys.run ? 11 : 5.4) * dt;
      /* ease the start and the stop, so walking doesn't snap on and off */
      vel.f += (f - vel.f) * Math.min(1, dt * 12);
      vel.s += (s - vel.s) * Math.min(1, dt * 12);
      if (Math.abs(vel.f) > 0.002 || Math.abs(vel.s) > 0.002) {
        var sn = Math.sin(me.yaw), cs = Math.cos(me.yaw);
        step((-sn * vel.f + cs * vel.s) * speed, (-cs * vel.f - sn * vel.s) * speed);
        if (!reduced) {
          tick += dt * (keys.run ? 13 : 8) * Math.min(1, Math.abs(vel.f) + Math.abs(vel.s));
          bob = Math.sin(tick) * 0.035;
        }
      } else if (bob) { bob *= 0.9; if (Math.abs(bob) < 0.002) bob = 0; }
    }

    place();
    carrySky();
    look();
    renderer.render(scene, camera);
  }

  resize();
  place();
  carrySky();
  setLang('en');
  paintWhere(ZONES[ZONES.length - 1]);
  current = null;
  look();
  requestAnimationFrame(frame);
})();
