import nacl from 'tweetnacl';
import utils from 'tweetnacl-util';

export async function deriveKey(password: string, saltValue?: string): Promise<{ key: Uint8Array, salt: string }> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  
  const key = await crypto.subtle.importKey('raw', data, 'PBKDF2', false, [
    'deriveBits'
  ]);
  
  const salt = saltValue || utils.encodeBase64(nacl.randomBytes(16));
  
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: utils.decodeBase64(salt) as unknown as BufferSource, iterations: 100000, hash: 'SHA-256' },
    key,
    256
  );
  
  return {
    key: new Uint8Array(bits),
    salt
  };
}

export function encrypt(plaintext: string, key: Uint8Array): {
  ciphertext: string;
  nonce: string;
  version: number;
} {
  const nonce = nacl.randomBytes(24);
  const box = nacl.secretbox(
    utils.decodeUTF8(plaintext),
    nonce,
    key
  );
  return {
    ciphertext: utils.encodeBase64(box),
    nonce: utils.encodeBase64(nonce),
    version: 1
  };
}

export function decrypt(
  ciphertext: string,
  nonce: string,
  key: Uint8Array
): string {
  const decrypted = nacl.secretbox.open(
    utils.decodeBase64(ciphertext),
    utils.decodeBase64(nonce),
    key
  );
  if (!decrypted) throw new Error('Decryption failed');
  return utils.encodeUTF8(decrypted);
}
