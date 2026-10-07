/// <reference path="../pb_data/types.d.ts" />
//
// A signed-in player keeps the account in step without ever being asked (S-49d,
// docs/plans/sso-accounts.md §6), and every start renews the token. PocketBase's default of
// 5 days would sign out anybody who skips a week; 30 days only signs out somebody who has
// really left. An expired session never loses work: the app puts the account's profiles
// away, unsaved edits included, until the next sign-in.

const THIRTY_DAYS = 30 * 24 * 60 * 60;

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users');
    users.authToken.duration = THIRTY_DAYS;
    app.save(users);
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users');
    users.authToken.duration = 432000;
    app.save(users);
  },
);
