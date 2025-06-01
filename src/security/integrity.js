// integrity.js: Add HMAC for data integrity
// NOTE: This is a Node.js-style API; for browser, use Web Crypto API or a library like crypto-js
import crypto from 'crypto';

export function computeHMAC(data, key) {
  return crypto.createHmac('sha256', key).update(data).digest('hex');
}

export function verifyHMAC(data, key, hmac) {
  return computeHMAC(data, key) === hmac;
}
