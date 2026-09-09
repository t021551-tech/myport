// The customer side of Darseen: sign in, order with a table number, ask for a
// meal plan. Everything here runs as the signed-in customer, and the database
// rules only ever let them see their own rows.
(function () {
  if (!window.supabase) {          // the library did not load; say so rather than sit blank
    var warn = document.querySelector('#signin-form [data-msg]');
    if (warn) { warn.textContent = 'Accounts are offline for a moment. Please call us on +44 7775 962211.'; warn.hidden = false; }
    return;
  }
  var URL = 'https://chyokbhzltxykwrgvboo.supabase.co';
  var KEY = 'sb_publishable_dDzFKC9gjnod-m0nM23HVw_2oCTBdaU';
  var db = window.supabase.createClient(URL, KEY);

  var $ = function (id) { return document.getElementById(id); };
  var gate = $('gate'), app = $('app');
  var basket = {};        // slug -> { item, qty }

  function money(n) { return '£' + n.toFixed(2); }

  function say(el, text, bad) {
    el.textContent = text;
    el.classList.toggle('bad', !!bad);
    el.hidden = false;
  }

  // ── who is here ───────────────────────────────────────────────
  function show(session) {
    var signedIn = !!session;
    gate.hidden = signedIn;
    app.hidden = !signedIn;
    $('sign-out').hidden = !signedIn;
    if (signedIn) {
      $('who').textContent = session.user.email;
      loadMenu();
      loadOrders();
    }
  }

  db.auth.getSession().then(function (r) { show(r.data.session); });
  db.auth.onAuthStateChange(function (_e, session) { show(session); });

  $('sign-out').addEventListener('click', function () { db.auth.signOut(); });

  $('signin-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target, msg = f.querySelector('[data-msg]');
    say(msg, 'Signing in…');
    db.auth.signInWithPassword({
      email: f.email.value.trim(), password: f.password.value
    }).then(function (r) {
      if (r.error) say(msg, r.error.message, true);
    });
  });

  $('signup-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target, msg = f.querySelector('[data-msg]');
    say(msg, 'Creating your account…');
    db.auth.signUp({
      email: f.email.value.trim(),
      password: f.password.value,
      options: { data: {
        full_name: f.full_name.value.trim(),
        phone: f.phone.value.trim()
      } }
    }).then(function (r) {
      if (r.error) return say(msg, r.error.message, true);
      if (!r.data.session) say(msg, 'Check your email to confirm the address, then sign in.');
    });
  });

  // ── the menu, and what is in the basket ───────────────────────
  function loadMenu() {
    db.from('menu_items').select('*').eq('available', true).order('position')
      .then(function (r) {
        var list = $('order-list');
        if (r.error) { list.innerHTML = '<li class="loading">The menu could not be loaded.</li>'; return; }
        list.innerHTML = '';
        r.data.forEach(function (item) {
          var li = document.createElement('li');
          li.className = 'order-row';
          li.innerHTML =
            '<div class="or-name">' + item.name_en +
              '<span class="ar" dir="rtl" lang="ar">' + item.name_ar + '</span></div>' +
            '<span class="or-price">' + money(Number(item.price_gbp)) + '</span>' +
            '<div class="qty">' +
              '<button type="button" aria-label="One fewer ' + item.name_en + '">&minus;</button>' +
              '<output>0</output>' +
              '<button type="button" aria-label="One more ' + item.name_en + '">+</button>' +
            '</div>';
          var out = li.querySelector('output');
          var buttons = li.querySelectorAll('.qty button');
          buttons[0].addEventListener('click', function () { bump(item, -1, out); });
          buttons[1].addEventListener('click', function () { bump(item, 1, out); });
          list.appendChild(li);
        });
      });
  }

  function bump(item, by, out) {
    var line = basket[item.slug] || { item: item, qty: 0 };
    line.qty = Math.max(0, Math.min(50, line.qty + by));
    if (line.qty === 0) delete basket[item.slug]; else basket[item.slug] = line;
    out.textContent = line.qty;
    retotal();
  }

  function total() {
    return Object.keys(basket).reduce(function (sum, slug) {
      return sum + Number(basket[slug].item.price_gbp) * basket[slug].qty;
    }, 0);
  }

  function retotal() {
    $('order-total').textContent = money(total());
    $('place-order').disabled = Object.keys(basket).length === 0;
  }

  // table number only matters when eating in
  function watchType() {
    var dineIn = document.querySelector('input[name="order_type"]:checked').value === 'dine_in';
    $('table-field').hidden = !dineIn;
  }
  Array.prototype.forEach.call(document.querySelectorAll('input[name="order_type"]'),
    function (r) { r.addEventListener('change', watchType); });
  watchType();

  // ── placing it ────────────────────────────────────────────────
  $('place-order').addEventListener('click', function () {
    var msg = $('order-msg'), button = $('place-order');
    var type = document.querySelector('input[name="order_type"]:checked').value;
    var table = $('table-number').value.trim();
    if (type === 'dine_in' && !table) {
      return say(msg, 'Which table are you at? We need it to bring the food over.', true);
    }

    button.disabled = true;
    say(msg, 'Sending your order…');

    db.auth.getUser().then(function (u) {
      return db.from('orders').insert({
        user_id: u.data.user.id,
        order_type: type,
        table_number: type === 'dine_in' ? table : null,
        payment_method: document.querySelector('input[name="payment"]:checked').value,
        notes: $('order-notes').value.trim() || null,
        total_gbp: total()
      }).select('id').single();
    }).then(function (r) {
      if (r.error) throw r.error;
      var rows = Object.keys(basket).map(function (slug) {
        var line = basket[slug];
        return {
          order_id: r.data.id,
          menu_item_id: line.item.id,
          name_en: line.item.name_en,
          unit_price: line.item.price_gbp,
          quantity: line.qty
        };
      });
      return db.from('order_items').insert(rows);
    }).then(function (r) {
      if (r && r.error) throw r.error;
      basket = {};
      Array.prototype.forEach.call(document.querySelectorAll('.qty output'),
        function (o) { o.textContent = '0'; });
      $('order-notes').value = '';
      retotal();
      say(msg, 'Order in. The kitchen has it — pay when the food arrives.');
      loadOrders();
    }).catch(function (err) {
      button.disabled = false;
      say(msg, 'That did not go through: ' + (err.message || 'please try again.'), true);
    });
  });

  // ── meal plan ─────────────────────────────────────────────────
  $('plan-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target, msg = f.querySelector('[data-msg]');
    say(msg, 'Sending…');
    db.auth.getUser().then(function (u) {
      return db.from('subscriptions').insert({
        user_id: u.data.user.id,
        plan: f.plan.value,
        starts_on: f.starts_on.value || null,
        notes: f.notes.value.trim() || null
      });
    }).then(function (r) {
      if (r.error) return say(msg, r.error.message, true);
      f.reset();
      say(msg, 'Asked for. Sara will call you to set it up.');
    });
  });

  // ── what they have ordered before ─────────────────────────────
  function loadOrders() {
    db.from('orders')
      .select('id, created_at, order_type, table_number, status, total_gbp, order_items(name_en, quantity)')
      .order('created_at', { ascending: false }).limit(10)
      .then(function (r) {
        var list = $('past-orders');
        if (r.error) { list.innerHTML = '<li class="loading">Could not load your orders.</li>'; return; }
        if (!r.data.length) { list.innerHTML = '<li class="loading">Nothing yet.</li>'; return; }
        list.innerHTML = '';
        r.data.forEach(function (o) {
          var when = new Date(o.created_at).toLocaleString('en-GB',
            { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
          var what = (o.order_items || []).map(function (i) {
            return i.quantity + '× ' + i.name_en;
          }).join(', ');
          var where = o.order_type === 'dine_in' ? 'table ' + o.table_number : 'collection';
          var li = document.createElement('li');
          li.innerHTML = '<span class="when">' + when + '</span>' +
                         '<span class="what">' + (what || '—') + '</span>' +
                         '<span class="where">' + where + '</span>' +
                         '<span class="status ' + o.status + '">' + o.status + '</span>' +
                         '<span class="sum">' + money(Number(o.total_gbp)) + '</span>';
          list.appendChild(li);
        });
      });
  }
})();
