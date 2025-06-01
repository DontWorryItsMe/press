// validation.js: Centralized input validation and sanitization
export function validatePasscode(passcode) {
  return /^\d{4}$/.test(passcode);
}

export function validateNoteTitle(title) {
  return typeof title === 'string' && title.length > 0 && title.length <= 100;
}

export function validateNoteContent(content) {
  return typeof content === 'string' && content.length <= 10000;
}
