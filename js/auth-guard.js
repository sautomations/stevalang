/**
 * Auth guard — include this script at the top of any protected page.
 * Redirects to /login.html if the session cookie is invalid or missing.
 */
(function () {
  fetch('/api/verify', { credentials: 'include' })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (!data.authenticated) {
        window.location.replace('/login.html');
      }
    })
    .catch(function () {
      window.location.replace('/login.html');
    });
})();
