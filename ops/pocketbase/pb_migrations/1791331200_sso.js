/// <reference path="../pb_data/types.d.ts" />
//
// Accounts by SSO (docs/plans/sso-accounts.md, S-49c): Google and Discord, through the
// SDK's popup flow, and password sign-in switched off. The password code in the app and in
// pb_hooks/main.pb.js is kept, unreachable, until the owner sets up SMTP; the app draws
// its "Sign in with email…" row only when `auth-methods` says passwords are on.
//
// Not here, on purpose: the providers' client id and secret. They are pasted into the
// admin UI (Collections -> users -> gear -> Options -> OAuth2), so they live only in
// pb_data, never in this repository.
//
// PYRRHIC_PASSWORD_AUTH=on (docker-compose.local.yml only) keeps passwords on, so the
// dormant password flows stay covered by the e2e suite.
//
// Also: PocketBase's own nightly backup, keeping one archive (the "latest" copy).
// ops/pocketbase/backup-history.sh copies it out of the volume and keeps a deduplicated
// history beside it.
//
// Verified against PocketBase v0.40.4 (docs/plans/sso-accounts.md §4).

const PASSWORD_AUTH = ($os.getenv('PYRRHIC_PASSWORD_AUTH') || '') === 'on';

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users');
    users.passwordAuth.enabled = PASSWORD_AUTH;
    users.oauth2.enabled = true;
    app.save(users);

    const settings = app.settings();
    settings.backups.cron = '0 3 * * *';
    settings.backups.cronMaxKeep = 1;
    app.save(settings);
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users');
    users.passwordAuth.enabled = true;
    users.oauth2.enabled = false;
    app.save(users);

    const settings = app.settings();
    settings.backups.cron = '';
    settings.backups.cronMaxKeep = 3;
    app.save(settings);
  },
);
