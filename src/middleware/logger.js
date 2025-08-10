export function logRequest(req) {
  console.log(`📊 ${req.method} ${req.url} - ${new Date().toISOString()}`);
}