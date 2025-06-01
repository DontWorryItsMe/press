// logger.js: Simple audit logger for sensitive actions
export function logAudit(event, details = {}) {
  // In production, send to backend or external log service
  // Here, just print to console (can be enhanced)
  console.info(`[AUDIT] ${event}`, details, new Date().toISOString());
}
