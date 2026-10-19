/// <reference path="../pb_data/types.d.ts" />
//
// Saving a profile stopped being a deliberate press when autosave arrived (S-49d): the app
// pushes three seconds after every edit and retries a 409 on top of the account's copy, so
// a player who renames, edits and switches profiles can pass the original thirty a minute
// and get 429 "Too Many Requests". Two hundred a minute per IP still stops a loop and no
// longer meets an editing session. Only the one rule changes; the others stay.

const LABEL = 'POST /api/app/profile';

function setLimit(app, maxRequests) {
  const settings = app.settings();
  for (const rule of settings.rateLimits.rules) {
    if (rule.label === LABEL) rule.maxRequests = maxRequests;
  }
  app.save(settings);
}

migrate(
  (app) => setLimit(app, 200),
  (app) => setLimit(app, 30),
);
