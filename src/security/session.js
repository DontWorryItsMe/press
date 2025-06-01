// session.js: Device/session binding helpers
export function getDeviceId() {
  let id = localStorage.getItem('device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('device_id', id);
  }
  return id;
}

export function isSessionValid(sessionDeviceId) {
  return getDeviceId() === sessionDeviceId;
}
