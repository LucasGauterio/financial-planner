import { describe, it, expect } from 'vitest';
import { deriveKey, encryptData, decryptData } from './cryptoService.js';

describe('cryptoService', () => {
  it('derives a WebCrypto key from password and salt', async () => {
    const key = await deriveKey('MasterPass123!', 'CustomSalt_v1');
    expect(key).toBeDefined();
    expect(key.type).toBe('secret');
    expect(key.algorithm.name).toBe('AES-GCM');
  });

  it('encrypts and decrypts JSON data payload correctly', async () => {
    const key = await deriveKey('MasterPass123!', 'CustomSalt_v1');
    const originalPayload = { portfolioBalance: 15000.50, currency: 'USD', lockState: false };

    const cipherText = await encryptData(key, originalPayload);
    expect(typeof cipherText).toBe('string');
    expect(cipherText.length).toBeGreaterThan(20);

    const decryptedPayload = await decryptData(key, cipherText);
    expect(decryptedPayload).toEqual(originalPayload);
  });

  it('returns null on decryption failure with invalid key or tampered ciphertext', async () => {
    const key1 = await deriveKey('PasswordOne', 'SaltA');
    const key2 = await deriveKey('PasswordTwo', 'SaltB');

    const cipherText = await encryptData(key1, { secret: 'top-secret' });
    const failedDecrypt = await decryptData(key2, cipherText);
    expect(failedDecrypt).toBeNull();
  });
});
