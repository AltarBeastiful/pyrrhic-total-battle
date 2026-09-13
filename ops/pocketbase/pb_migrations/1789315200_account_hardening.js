/// <reference path="../pb_data/types.d.ts" />
//
// Everything the email/password account needs that is not the `profiles` collection:
// a longer minimum password, mail templates whose buttons open *the app* instead of
// PocketBase's own dashboard, and the built-in rate limiter in front of every endpoint a
// stranger can reach without an account.
//
// Verified against PocketBase v0.40.4 (docs/investigations/0012-pocketbase-verification.md).
//
// The app origin is read from PYRRHIC_APP_URL at migration time (docker-compose.yml sets
// it). A migration runs once, so changing the variable afterwards changes nothing: the
// templates are then edited in the admin UI, Collections -> users -> gear -> Options ->
// Mail templates. ops/pocketbase/README.md says so where it says how to change the origin.

const APP_URL = (
  $os.getenv('PYRRHIC_APP_URL') || 'https://altarbeastiful.github.io/pyrrhic-total-battle'
).replace(/\/+$/, '');

// The two paths `src/main.tsx` answers, next to `oauth-callback`. `{TOKEN}` is replaced by
// PocketBase when the mail is sent; everything else is literal.
const RESET_URL = APP_URL + '/password-reset?token={TOKEN}';
const VERIFY_URL = APP_URL + '/verify-email?token={TOKEN}';

const RESET_SUBJECT = 'Reset your {APP_NAME} password';
const RESET_BODY = [
  '<p>Hello,</p>',
  '<p>Use the button below to choose a new password for your {APP_NAME} account. The link works once and expires in 30 minutes.</p>',
  '<p><a class="btn" href="' + RESET_URL + '" target="_blank" rel="noopener">Choose a new password</a></p>',
  '<p><i>If you did not ask to reset your password, nothing has changed and you can ignore this email.</i></p>',
  '<p>{APP_NAME}</p>',
].join('\n');

const VERIFY_SUBJECT = 'Confirm your email address for {APP_NAME}';
const VERIFY_BODY = [
  '<p>Hello,</p>',
  '<p>Use the button below to confirm this address. Until it is confirmed, {APP_NAME} cannot save your profiles to the account.</p>',
  '<p><a class="btn" href="' + VERIFY_URL + '" target="_blank" rel="noopener">Confirm this address</a></p>',
  '<p><i>If you did not create a {APP_NAME} account, you can ignore this email.</i></p>',
  '<p>{APP_NAME}</p>',
].join('\n');

// What an unauthenticated stranger can reach, plus our own save route.
//
// Labels are matched in PocketBase's own order of specificity, and a **route tag**
// (`users:authWithPassword`) is checked before a path (`POST /api/collections/...`):
// a path label for a tagged route is therefore dead code, silently overruled by the
// shipped `*:auth` / `*:create` rules. Verified on 0.40.4, tag by tag. Only
// `/api/app/profile`, which is ours and has no tag, is matched by path.
//
// The four defaults PocketBase ships are kept, after ours, so nothing loses its ceiling.
const PYRRHIC_RULES = [
  // Guessing a password. Ten a minute per IP stops credential stuffing; a player who
  // mistypes twice never sees it.
  { label: 'users:authWithPassword', audience: '', duration: 60, maxRequests: 10 },
  // The two routes that send mail: enough for one retry, not enough to be a mail cannon.
  { label: 'users:requestPasswordReset', audience: '', duration: 300, maxRequests: 3 },
  { label: 'users:requestVerification', audience: '', duration: 300, maxRequests: 3 },
  // The two that consume a token: a link opened twice is normal, a thousand is a scan.
  { label: 'users:confirmPasswordReset', audience: '', duration: 300, maxRequests: 10 },
  { label: 'users:confirmVerification', audience: '', duration: 300, maxRequests: 10 },
  // Creating accounts. Thirty an hour per IP leaves room for a full e2e run and its
  // reruns, and still makes a signup flood pointless.
  { label: 'users:create', audience: '', duration: 3600, maxRequests: 30 },
  // Saving a profile is a deliberate press, never a loop. Our own route: path label.
  { label: 'POST /api/app/profile', audience: '', duration: 60, maxRequests: 30 },
];

const DEFAULT_RULES = [
  { label: '*:auth', audience: '', duration: 3, maxRequests: 2 },
  { label: '*:create', audience: '', duration: 5, maxRequests: 20 },
  { label: '/api/batch', audience: '', duration: 1, maxRequests: 3 },
  { label: '/api/', audience: '', duration: 10, maxRequests: 300 },
];

// Addresses the limiter ignores. **Empty in production**, and it must stay empty there:
// behind Caddy every request carries the proxy's own address until `trustedProxy` is set
// (README step 9), so one careless private range here would exempt every client at once.
// docker-compose.local.yml sets it to the loopback and the Docker bridge, because a
// machine running the Playwright suite against its own container is not a threat model.
const EXCLUDED_IPS = ($os.getenv('PYRRHIC_RATE_LIMIT_EXCLUDE') || '')
  .split(',')
  .map((entry) => entry.trim())
  .filter((entry) => entry !== '');

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users');

    // A ten-character floor. PocketBase ships eight; the client says the same number.
    users.fields.getByName('password').min = 10;

    users.resetPasswordTemplate = { subject: RESET_SUBJECT, body: RESET_BODY };
    users.verificationTemplate = { subject: VERIFY_SUBJECT, body: VERIFY_BODY };

    // Left alone on purpose: `authRule`. Setting it to "verified = true" makes PocketBase
    // answer 403 to *sign-in itself* for an unconfirmed account, which would leave the app
    // with no signed-in session to explain the refusal from and no way to offer "Resend the
    // email". Saving is what verification gates, and pb_hooks/main.pb.js is where that is
    // enforced. README "Only verified accounts may sign in" has the one-line change if the
    // owner ever wants the stricter behaviour.

    app.save(users);

    const settings = app.settings();
    settings.rateLimits.enabled = true;
    settings.rateLimits.rules = PYRRHIC_RULES.concat(DEFAULT_RULES);
    settings.rateLimits.excludedIPs = EXCLUDED_IPS;
    app.save(settings);
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users');
    users.fields.getByName('password').min = 8;
    users.resetPasswordTemplate = {
      subject: 'Reset your {APP_NAME} password',
      body: '<p>Hello,</p>\n<p>Click on the button below to reset your password.</p>\n<p>\n  <a class="btn" href="{APP_URL}/_/#/auth/confirm-password-reset/{TOKEN}" target="_blank" rel="noopener">Reset password</a>\n</p>\n<p><i>If you didn\'t ask to reset your password, please ignore this email.</i></p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>',
    };
    users.verificationTemplate = {
      subject: 'Verify your {APP_NAME} email',
      body: '<p>Hello,</p>\n<p>Thank you for joining us at {APP_NAME}.</p>\n<p>Click on the button below to verify your email address.</p>\n<p>\n  <a class="btn" href="{APP_URL}/_/#/auth/confirm-verification/{TOKEN}" target="_blank" rel="noopener">Verify</a>\n</p>\n<p><i>If you didn\'t recently register, please ignore this email.</i></p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>',
    };
    app.save(users);

    const settings = app.settings();
    settings.rateLimits.enabled = false;
    settings.rateLimits.rules = DEFAULT_RULES;
    settings.rateLimits.excludedIPs = [];
    app.save(settings);
  },
);
