// memory.js: Secure memory handling for sensitive data
export function clearSensitive(obj) {
  if (typeof obj === 'object') {
    Object.keys(obj).forEach(k => { obj[k] = null; });
  }
}
