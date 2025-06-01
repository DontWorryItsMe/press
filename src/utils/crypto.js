// AES-GCM encryption/decryption using Web Crypto API
// All functions async. No local storage. Key derived from passcode.

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Derive a 256-bit AES-GCM key from a passcode using PBKDF2
export async function deriveKey(passcode, salt) {
  const passBuf = encoder.encode(passcode);
  const saltBuf = encoder.encode(salt);
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw', passBuf, { name: 'PBKDF2' }, false, ['deriveKey']
  );
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuf,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt a string using AES-GCM. Returns base64 ciphertext and IV.
export async function encryptString(str, key) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const data = encoder.encode(str);
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, key, data
  );
  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

// Decrypt a string using AES-GCM. Input is base64 ciphertext and IV.
export async function decryptString({ciphertext, iv}, key) {
  const ctBuf = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
  const ivBuf = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
  const plainBuf = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBuf }, key, ctBuf
  );
  return decoder.decode(plainBuf);
}
