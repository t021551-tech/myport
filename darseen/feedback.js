// Feedback goes to the Darseen database; if that call cannot be made —
// no network, or a page sandbox that blocks it — it falls back to opening
// the customer's mail app, so the box is never a dead end.
(function () {
  var form = document.getElementById('fb-form');
  if (!form) return;

  var DB = 'https://chyokbhzltxykwrgvboo.supabase.co/rest/v1/feedback';
  var KEY = 'sb_publishable_dDzFKC9gjnod-m0nM23HVw_2oCTBdaU';

  var said = document.getElementById('fb-said');
  function say(text) { said.textContent = text; said.hidden = false; }

  function mailto(name, rating, message) {
    var subject = 'Feedback for Darseen'
      + (rating ? ' — ' + rating + ' out of 5' : '')
      + (name ? ' — ' + name : '');
    var body = message
      + (rating ? '\n\nRating: ' + rating + ' out of 5' : '')
      + (name ? '\nFrom: ' + name : '');
    window.location.href = 'mailto:darseen24@gmail.com'
      + '?subject=' + encodeURIComponent(subject)
      + '&body=' + encodeURIComponent(body);
    say('Your email app should be opening with this ready to send. '
      + 'If nothing happened, WhatsApp it instead — the link is just above.');
  }

  form.addEventListener('submit', function (event) {
    var message = document.getElementById('fb-message').value.trim();
    if (!message) return;                       // let the browser ask for it
    event.preventDefault();

    var name = document.getElementById('fb-name').value.trim();
    var checked = form.querySelector('input[name="rating"]:checked');
    var rating = checked ? Number(checked.value) : null;
    var button = form.querySelector('button[type="submit"]');

    button.disabled = true;
    say('Sending…');

    fetch(DB, {
      method: 'POST',
      headers: {
        'apikey': KEY,
        'Authorization': 'Bearer ' + KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ name: name || null, rating: rating, message: message })
    }).then(function (res) {
      button.disabled = false;
      if (!res.ok) throw new Error('rejected: ' + res.status);
      form.reset();
      say('Thank you — Sara has it.');
    }).catch(function () {
      button.disabled = false;
      mailto(name, rating, message);
    });
  });
})();
