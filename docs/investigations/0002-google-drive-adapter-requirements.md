# Investigation 0002 — Google Drive sync adapter: what it really requires

Checked 2026-09-12 against Google's current documentation (links at the end). Applies to story S-46.

## 1. Scope and verification
- Scope `https://www.googleapis.com/auth/drive.appdata` is listed as **non-sensitive, recommended** ("View and
  manage the app's own configuration data in your Google Drive"). Non-sensitive scopes need only *basic*
  (brand) verification, not the sensitive/restricted scope review. The "unverified app" warning screen and the
  100-new-users cap are documented for **sensitive or restricted** scopes only.
- **Brand verification is still required** to publish an *External* app with its name and logo on the consent
  screen. Requirements:
  - a publicly accessible **homepage** describing the app, on a domain we own;
  - a **privacy policy** hosted on the same domain and linked from the consent screen (must describe how Google
    user data is accessed, used, stored);
  - the domain must be **verified in Google Search Console** by the Cloud project owner/editor and listed under
    *Authorized domains* as a top private domain;
  - **GitHub Pages / github.io is not accepted** as the app's own domain for this purpose (documented by people who
    tried; Google wants a domain we control). So the Google adapter implies **buying and wiring a custom domain**
    to the Pages site (~10 €/year) and publishing a privacy-policy page there.
- Until brand verification is complete, a published app works but its name/logo may not be shown on the consent
  screen (users see a less trustworthy prompt). Exact rendering should be checked with a throwaway project before
  relying on it.
- **Testing** publishing status (development): at most 100 listed test users, they see a warning, and each
  authorization expires after 7 days. Fine for development, not for release.

## 2. Authorization model in a browser-only app
- Use Google Identity Services `google.accounts.oauth2.initTokenClient` (**token model**, OAuth implicit grant).
  The older `gapi.auth2` / Google Sign-In library is deprecated.
- Access tokens live about **1 hour**; there is **no refresh token** in the browser. To get a new token the app
  calls `requestAccessToken()` from a **user gesture** (popup blockers). `prompt: ''` shows consent only the first
  time; `prompt: 'none'` attempts a silent grant if a Google session exists. In practice expect a popup that
  opens and closes by itself when the user is signed in to Google, and a full prompt otherwise.
  Consequence: **explicit Pull/Push buttons** fit this model; background auto-sync does not (it cannot obtain a
  token without a gesture once the hour is over). Keep the token in memory only, never in localStorage.
- Popups require the page not to send `Cross-Origin-Opener-Policy: same-origin` (GitHub Pages sends none — OK).
- Client configuration: a Google Cloud project (free) with the Drive API enabled, an OAuth client of type
  *Web application*, **Authorized JavaScript origins** = the official https host (+ `http://localhost:5173` for
  dev). The client id is public by design for this flow; it can live in the repo, but only the official origins
  are authorized, so **forks must register their own** client id (documented in CONTRIBUTING).
- Ownership: the Cloud project, Search Console property and consent screen belong to a personal Google account.
  Bus factor: document the setup and prefer a project-owned account with a second owner.

## 3. Drive API behaviour relevant to us
- `appDataFolder` is a hidden per-app folder; other apps and the Drive UI cannot see it. Files cannot be shared,
  trashed (deletes are permanent) or moved out. If the user removes the app under "Third-party apps & services",
  the folder is deleted — the local copy stays, so this is a "disconnect", not data loss.
- Create with `files.create` (`parents: ["appDataFolder"]`, multipart or media upload), list with
  `files.list?spaces=appDataFolder`, read with `files.get?alt=media`, update with `files.update` (upload endpoint).
  Plain `fetch` with a bearer token works (CORS is supported on `www.googleapis.com`).
- Concurrency: Drive has no conditional-write on content for our purpose; store our `rev` in the file's
  `appProperties`, read metadata before writing and compare (`expectedRev`), which matches the `RemoteStore`
  contract from investigation 0001.
- Quotas are irrelevant at our scale (project-wide limits are in the hundreds of thousands of units per minute;
  a pull is ~100 units). Files count against the user's Drive storage, negligible (tens of KB).

## 4. Effort and obligations summary
| Item | One-off | Recurring |
|---|---|---|
| Custom domain + DNS to GitHub Pages | buy, configure, verify in Search Console | renew yearly |
| Homepage + privacy-policy page on that domain | write (short, honest: "data stays in your browser; the Drive adapter writes your own file to your own Drive") | keep accurate |
| Google Cloud project, Drive API, OAuth client, consent screen, brand verification | 1–2 hours plus Google's review wait | respond to Google policy emails |
| Adapter code (GIS token client, 4 REST calls, conflict check) | ~1–2 days incl. tests with a mocked API | maintain against GIS changes |

## 5. Comparison with the other adapters
- **GitHub Gist**: no app registration, no domain, a fine-grained token pasted by the user; friction is on the
  user (creating a token), obligations on us are zero. Ship first.
- **Dropbox**: browser PKCE flow supported, "App folder" permission is the analogue of appData; apps stay in
  *development* mode limited to 50 users until a lightweight production approval; no custom-domain requirement.
  A reasonable second adapter if Google's domain requirement is not wanted.
- **Generic endpoint** (self-hosted worker): zero obligations on us, best for clans.

## 6. Recommendation
Keep S-46 but gate it on two decisions: (1) we commit to a custom domain for the official site, (2) someone owns
the Google Cloud project long-term. Build Gist (S-45) and the generic endpoint (S-47) first; evaluate Dropbox as
the "no domain needed" alternative before Google if (1) is refused. Never make Google the only sync path.

## Sources
- Drive API scopes: https://developers.google.com/workspace/drive/api/guides/api-specific-auth
- App data folder: https://developers.google.com/workspace/drive/api/guides/appdata
- Verification requirements: https://support.google.com/cloud/answer/13464321
- Unverified app screen and user cap: https://support.google.com/cloud/answer/7454865
- Publishing status / audience: https://support.google.com/cloud/answer/15549945
- Brand verification: https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification
- Policy compliance: https://developers.google.com/identity/protocols/oauth2/production-readiness/policy-compliance
- GIS token model: https://developers.google.com/identity/oauth2/web/guides/use-token-model and
  https://developers.google.com/identity/oauth2/web/reference/js-reference
- Drive limits: https://developers.google.com/workspace/drive/api/guides/limits
