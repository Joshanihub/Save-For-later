import { deriveKey, encrypt, decrypt } from '../encryption';

describe('Encryption Utils', () => {
  const password = 'my-super-secret-password';
  const plaintext = 'This is a top secret note!';

  it('should derive a key and salt from password', async () => {
    const { key, salt } = await deriveKey(password);
    expect(key).toBeInstanceOf(Uint8Array);
    expect(key.length).toBe(32); // 256 bits
    expect(typeof salt).toBe('string');
    expect(salt.length).toBeGreaterThan(0);
  });

  it('should derive the same key given the same password and salt', async () => {
    const { key: key1, salt } = await deriveKey(password);
    const { key: key2 } = await deriveKey(password, salt);
    expect(key1).toEqual(key2);
  });

  it('should encrypt and decrypt correctly', async () => {
    const { key } = await deriveKey(password);
    const { ciphertext, nonce, version } = encrypt(plaintext, key);
    
    expect(ciphertext).toBeDefined();
    expect(nonce).toBeDefined();
    expect(version).toBe(1);
    
    const decrypted = decrypt(ciphertext, nonce, key);
    expect(decrypted).toBe(plaintext);
  });

  it('should throw error on incorrect key decryption', async () => {
    const { key: key1 } = await deriveKey(password);
    const { key: wrongKey } = await deriveKey('wrong-password');
    
    const { ciphertext, nonce } = encrypt(plaintext, key1);
    
    expect(() => {
      decrypt(ciphertext, nonce, wrongKey);
    }).toThrow('Decryption failed');
  });
});
