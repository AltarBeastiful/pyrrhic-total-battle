/**
 * A PocketBase stand-in for the account tests (S-49b).
 *
 * `src/account/client.ts` reaches the SDK through a dynamic `import('pocketbase')`, so a test can
 * replace the whole module with these two classes and drive every flow without a network, a
 * container or a browser. The shape is deliberately the small part of the SDK we use, and nothing
 * else — a fake that grew the rest of PocketBase would stop being evidence of anything.
 *
 * Test-only: nothing in `src/` imports it, so it never reaches a bundle.
 */

export type Responder = (...args: unknown[]) => unknown;

export interface FakeCall {
  collection: string;
  method: string;
  args: unknown[];
}

/** An error shaped like the SDK's `ClientResponseError`: what our code reads is `status`. */
export class FakeResponseError extends Error {
  readonly status: number;

  constructor(status: number, message = `status ${String(status)}`) {
    super(message);
    this.name = 'ClientResponseError';
    this.status = status;
  }
}

/** The SDK's `LocalAuthStore`, including the fact that it writes the token to `localStorage`. */
export class FakeAuthStore {
  token = '';
  record: unknown = null;
  private readonly storageKey: string;

  constructor(storageKey = 'pocketbase_auth') {
    this.storageKey = storageKey;
    try {
      const raw = globalThis.localStorage?.getItem(this.storageKey);
      if (raw !== null && raw !== undefined) {
        const parsed = JSON.parse(raw) as { token?: string; record?: unknown };
        this.token = parsed.token ?? '';
        this.record = parsed.record ?? null;
      }
    } catch {
      /* a browser with no storage is a supported browser */
    }
  }

  get isValid(): boolean {
    return this.token !== '';
  }

  save(token: string, record?: unknown): void {
    this.token = token;
    this.record = record ?? null;
    try {
      globalThis.localStorage?.setItem(
        this.storageKey,
        JSON.stringify({ token: this.token, record: this.record }),
      );
    } catch {
      /* ignored, as in the SDK */
    }
  }

  clear(): void {
    this.token = '';
    this.record = null;
    try {
      globalThis.localStorage?.removeItem(this.storageKey);
    } catch {
      /* ignored, as in the SDK */
    }
  }
}

/** Every answer the tests set up, and every call they want to assert on. */
const responders = new Map<string, Responder>();
export const fakeCalls: FakeCall[] = [];

/** `on('authWithPassword', …)` — return a value, or throw a `FakeResponseError` from inside it. */
export function onRequest(method: string, responder: Responder): void {
  responders.set(method, responder);
}

export function resetFakePocketBase(): void {
  responders.clear();
  fakeCalls.length = 0;
  FakePocketBase.last = null;
}

class FakeCollection {
  private readonly pb: FakePocketBase;
  private readonly name: string;

  constructor(pb: FakePocketBase, name: string) {
    this.pb = pb;
    this.name = name;
  }

  private call(method: string, args: unknown[]): unknown {
    fakeCalls.push({ collection: this.name, method, args });
    const responder = responders.get(method);
    if (!responder) throw new FakeResponseError(500, `no fake answer for ${method}`);
    return responder(...args);
  }

  listAuthMethods(): Promise<unknown> {
    return Promise.resolve(this.call('listAuthMethods', []));
  }

  getFirstListItem(filter: string): Promise<unknown> {
    return Promise.resolve(this.call('getFirstListItem', [filter]));
  }

  create(body: unknown): Promise<unknown> {
    return Promise.resolve(this.call('create', [body]));
  }

  requestVerification(email: string): Promise<unknown> {
    return Promise.resolve(this.call('requestVerification', [email]));
  }

  confirmVerification(token: string): Promise<unknown> {
    return Promise.resolve(this.call('confirmVerification', [token]));
  }

  requestPasswordReset(email: string): Promise<unknown> {
    return Promise.resolve(this.call('requestPasswordReset', [email]));
  }

  confirmPasswordReset(token: string, password: string, passwordConfirm: string): Promise<unknown> {
    return Promise.resolve(this.call('confirmPasswordReset', [token, password, passwordConfirm]));
  }

  update(id: string, body: unknown): Promise<unknown> {
    return Promise.resolve(this.call('update', [id, body]));
  }

  delete(id: string): Promise<unknown> {
    return Promise.resolve(this.call('delete', [id]));
  }

  /** The three auth calls all save the token, exactly as the SDK does. */
  private auth(method: string, args: unknown[]): Promise<unknown> {
    const result = this.call(method, args) as { token?: string; record?: unknown };
    this.pb.authStore.save(result.token ?? 'fake-token', result.record);
    return Promise.resolve(result);
  }

  authWithPassword(identity: string, password: string): Promise<unknown> {
    return this.auth('authWithPassword', [identity, password]);
  }

  authWithOAuth2Code(
    provider: string,
    code: string,
    codeVerifier: string,
    redirectURL: string,
  ): Promise<unknown> {
    return this.auth('authWithOAuth2Code', [provider, code, codeVerifier, redirectURL]);
  }

  authRefresh(): Promise<unknown> {
    return this.auth('authRefresh', []);
  }
}

export class FakePocketBase {
  static last: FakePocketBase | null = null;

  readonly baseURL: string;
  readonly authStore: FakeAuthStore;

  constructor(baseURL: string, authStore?: FakeAuthStore) {
    this.baseURL = baseURL;
    this.authStore = authStore ?? new FakeAuthStore();
    FakePocketBase.last = this;
  }

  collection(name: string): FakeCollection {
    return new FakeCollection(this, name);
  }
}
