/**
 * Optional client-side encryption of every synced file (S-45). AES-GCM-256 with a key derived from a
 * passphrase by PBKDF2-SHA256 (210 000 iterations, the OWASP 2023 figure). The salt is generated once
 * per remote and stored in clear in the index header, because the other device needs it to derive the
 * same key; the passphrase itself never leaves the device (it is kept in `sessionStorage`, not written
 * to the synced document, the export file or a share link).
 *
 * File body format: `{ enc: 'aes-gcm', salt, iv, data }`, every value base64. A wrong passphrase fails
 * the AES-GCM tag check, which surfaces as a typed `SyncError('passphrase')` rather than as garbage.
 */
import { SyncError } from './types';
import type { EncryptedBlob, KdfHeader } from './types';

/** OWASP 2023 recommendation for PBKDF2-HMAC-SHA256. */
export const PBKDF2_ITERATIONS = 210_000;
export const SALT_BYTES = 16;
/** 96 bits is the size AES-GCM is specified for. */
export const IV_BYTES = 12;

function webcrypto(): Crypto {
  const available = globalThis.crypto as Crypto | undefined;
  if (!available?.subtle) {
    throw new SyncError(
      'unsupported',
      'Encryption needs WebCrypto, which this browser only offers over https:// or on localhost. ' +
        'Sync without encryption, or open the app from a secure origin.',
    );
  }
  return available;
}

/** `Uint8Array<ArrayBuffer>` (not `ArrayBufferLike`) is what `BufferSource` accepts under TS 6. */
export function randomBytes(length: number): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(new ArrayBuffer(length));
  webcrypto().getRandomValues(bytes);
  return bytes;
}

/** UTF-8 bytes of `text`, in a plain `ArrayBuffer` so WebCrypto accepts them. */
export function utf8(text: string): Uint8Array<ArrayBuffer> {
  const encoded = new TextEncoder().encode(text);
  const bytes = new Uint8Array(new ArrayBuffer(encoded.length));
  bytes.set(encoded);
  return bytes;
}

export function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  let binary: string;
  try {
    binary = atob(value);
  } catch (cause) {
    throw new SyncError('format', 'A synced file is damaged (invalid base64).', { cause });
  }
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

/** A fresh header for a remote that is being encrypted for the first time. */
export function newKdfHeader(): KdfHeader {
  return { kdf: 'pbkdf2-sha256', iterations: PBKDF2_ITERATIONS, salt: toBase64(randomBytes(SALT_BYTES)) };
}

export function isKdfHeader(value: unknown): value is KdfHeader {
  if (typeof value !== 'object' || value === null) return false;
  const header = value as Partial<KdfHeader>;
  return (
    header.kdf === 'pbkdf2-sha256' &&
    typeof header.iterations === 'number' &&
    header.iterations > 0 &&
    typeof header.salt === 'string' &&
    header.salt.length > 0
  );
}

export function isEncrypted(value: unknown): value is EncryptedBlob {
  if (typeof value !== 'object' || value === null) return false;
  const blob = value as Partial<EncryptedBlob>;
  return (
    blob.enc === 'aes-gcm' &&
    typeof blob.salt === 'string' &&
    typeof blob.iv === 'string' &&
    typeof blob.data === 'string'
  );
}

/** Derive the AES-GCM key for `passphrase` under `header`. Deliberately slow (that is the point). */
export async function deriveKey(passphrase: string, header: KdfHeader): Promise<CryptoKey> {
  const { subtle } = webcrypto();
  const material = await subtle.importKey('raw', utf8(passphrase), 'PBKDF2', false, ['deriveKey']);
  return subtle.deriveKey(
    { name: 'PBKDF2', salt: fromBase64(header.salt), iterations: header.iterations, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptValue(
  value: unknown,
  key: CryptoKey,
  header: KdfHeader,
): Promise<EncryptedBlob> {
  const iv = randomBytes(IV_BYTES);
  const plaintext = utf8(JSON.stringify(value));
  const cipher = await webcrypto().subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
  return { enc: 'aes-gcm', salt: header.salt, iv: toBase64(iv), data: toBase64(new Uint8Array(cipher)) };
}

export async function decryptValue(blob: EncryptedBlob, key: CryptoKey): Promise<unknown> {
  let plaintext: ArrayBuffer;
  try {
    plaintext = await webcrypto().subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64(blob.iv) },
      key,
      fromBase64(blob.data),
    );
  } catch (cause) {
    throw new SyncError(
      'passphrase',
      'That passphrase does not open this gist. Use the passphrase of the device that set up sync.',
      { cause },
    );
  }
  try {
    return JSON.parse(new TextDecoder().decode(plaintext));
  } catch (cause) {
    throw new SyncError('format', 'A synced file decrypted to something that is not JSON.', { cause });
  }
}
