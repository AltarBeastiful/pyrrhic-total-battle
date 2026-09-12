/** AES-GCM / PBKDF2 envelope (S-45). Node environment: WebCrypto is `globalThis.crypto`. */
import { expect, test } from 'vitest';

import { createCodec } from './codec';
import {
  decryptValue,
  deriveKey,
  encryptValue,
  fromBase64,
  isEncrypted,
  newKdfHeader,
  PBKDF2_ITERATIONS,
  toBase64,
} from './crypto';
import { isSyncError } from './types';

test('base64 helpers round trip arbitrary bytes', () => {
  const bytes = new Uint8Array([0, 1, 127, 128, 255, 65]);
  expect([...fromBase64(toBase64(bytes))]).toEqual([...bytes]);
});

test('a fresh header carries a random salt and the OWASP iteration count', () => {
  const first = newKdfHeader();
  const second = newKdfHeader();
  expect(first.iterations).toBe(PBKDF2_ITERATIONS);
  expect(first.kdf).toBe('pbkdf2-sha256');
  expect(first.salt).not.toBe(second.salt);
});

test('a value encrypts and decrypts again, with a fresh iv every time', async () => {
  const header = newKdfHeader();
  const key = await deriveKey('a passphrase', header);
  const value = { name: 'Secret account', setups: [1, 2, 3] };

  const first = await encryptValue(value, key, header);
  const second = await encryptValue(value, key, header);

  expect(isEncrypted(first)).toBe(true);
  expect(first.enc).toBe('aes-gcm');
  expect(first.salt).toBe(header.salt);
  expect(first.iv).not.toBe(second.iv);
  expect(first.data).not.toBe(second.data);
  expect(await decryptValue(first, key)).toEqual(value);
});

test('a wrong passphrase fails with a typed error, not with garbage', async () => {
  const header = newKdfHeader();
  const blob = await encryptValue({ hello: true }, await deriveKey('right', header), header);
  const wrongKey = await deriveKey('wrong', header);

  await expect(decryptValue(blob, wrongKey)).rejects.toSatisfy(
    (error: unknown) => isSyncError(error) && error.kind === 'passphrase',
  );
});

test('the codec passes values through when no passphrase is set', async () => {
  const codec = createCodec();
  await codec.adopt(undefined);
  expect(codec.encrypting).toBe(false);
  expect(codec.header()).toBeUndefined();
  expect(await codec.encode({ a: 1 })).toEqual({ a: 1 });
  expect(await codec.decode({ a: 1 })).toEqual({ a: 1 });
});

test('the codec adopts the remote salt so two devices derive the same key', async () => {
  const writer = createCodec('shared passphrase');
  await writer.adopt(undefined);
  const header = writer.header();
  const blob = await writer.encode({ profiles: ['one'] });

  const reader = createCodec('shared passphrase');
  await reader.adopt(header);
  expect(reader.header()?.salt).toBe(header?.salt);
  expect(await reader.decode(blob)).toEqual({ profiles: ['one'] });
});

test('an encrypted remote without a passphrase reports it instead of failing obscurely', async () => {
  const writer = createCodec('shared passphrase');
  await writer.adopt(undefined);

  const reader = createCodec();
  await expect(reader.adopt(writer.header())).rejects.toSatisfy(
    (error: unknown) => isSyncError(error) && error.kind === 'encrypted',
  );
});

test('a remote that is half converted still decodes: plaintext files stay readable', async () => {
  const codec = createCodec('passphrase');
  await codec.adopt(undefined);
  expect(await codec.decode({ kind: 'profile' })).toEqual({ kind: 'profile' });
});
