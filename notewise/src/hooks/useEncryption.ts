import { useCallback, useState } from 'react';
import { deriveKey, encrypt as utilEncrypt, decrypt as utilDecrypt } from '../utils/encryption';

export function useEncryption() {
  const [encryptionKey, setEncryptionKey] = useState<Uint8Array | null>(null);
  const [salt, setSalt] = useState<string>('');

  const initializeKey = useCallback(async (pwd: string, saltValue?: string) => {
    const { key, salt: newSalt } = await deriveKey(pwd, saltValue);
    setEncryptionKey(key);
    setSalt(newSalt);
  }, []);

  const encrypt = useCallback((plaintext: string) => {
    if (!encryptionKey) throw new Error('Encryption key not initialized');
    return utilEncrypt(plaintext, encryptionKey);
  }, [encryptionKey]);

  const decrypt = useCallback((ciphertext: string, nonce: string) => {
    if (!encryptionKey) throw new Error('Encryption key not initialized');
    return utilDecrypt(ciphertext, nonce, encryptionKey);
  }, [encryptionKey]);

  return {
    initializeKey,
    encrypt,
    decrypt,
    encryptionKey,
    salt,
    isInitialized: encryptionKey !== null
  };
}
