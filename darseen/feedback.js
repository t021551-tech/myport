// Hands the feedback to the customer's own mail app, addressed to Sara.
  // The form's mailto action still works if this never runs.
  (function () {
    var form = document.getElementById('fb-form');
    if (!form) return;

    form.addEventListener('submit', function (event) {
      var message = document.getElementById('fb-message').value.trim();
      if (!message) return;                     // let the browser ask for it

      event.preventDefault();

      var name = document.getElementById('fb-name').value.trim();
      var stars = form.querySelector('input[name="rating"]:checked');
      var rating = stars ? Number(stars.value) : 0;

      var subject = 'Feedback for Darseen'
        + (rating ? ' \u2014 ' + rating + ' out of 5' : '')
        + (name ? ' \u2014 ' + name : '');

      var body = message
        + (rating ? '\n\nRating: ' + rating + ' out of 5' : '')
        + (name ? '\nFrom: ' + name : '');

      window.location.href = 'mailto:darseen24@gmail.com'
        + '?subject=' + encodeURIComponent(subject)
        + '&body=' + encodeURIComponent(body);

      var said = document.getElementById('fb-said');
      said.textContent = 'Your email app should be opening with this ready to send. '
        + 'If nothing happened, WhatsApp it instead \u2014 the link is just above.';
      said.hidden = false;
    });
  })();
