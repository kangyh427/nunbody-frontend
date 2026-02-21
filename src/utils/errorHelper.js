// Safely extract error message string from API error responses
// Always returns a string, never an object - guaranteed
export function getErrorMessage(err, fallback = 'An error occurred') {
  try {
    const data = err?.response?.data;
    if (!data) return String(fallback);
    if (typeof data === 'string') return data;

    // Try all known error response shapes
    const candidates = [
      data?.error?.message,
      data?.error,
      data?.message?.message,
      data?.message,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.length > 0) {
        return candidate;
      }
    }

    // Last resort: stringify any non-null data
    if (data.error && typeof data.error === 'object') {
      return JSON.stringify(data.error);
    }
    if (data.message && typeof data.message === 'object') {
      return JSON.stringify(data.message);
    }

    return String(fallback);
  } catch (e) {
    return String(fallback);
  }
}
