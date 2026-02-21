// Safely extract error message string from API error responses
// Handles various error shapes: {error: {message: "..."}}, {error: "..."}, {message: "..."}, etc.
// Always returns a string, never an object
export function getErrorMessage(err, fallback = 'An error occurred') {
  const data = err?.response?.data;
  if (!data) return fallback;

  // {error: {message: "..."}}
  if (data.error && typeof data.error === 'object' && typeof data.error.message === 'string') {
    return data.error.message;
  }
  // {error: "string"}
  if (typeof data.error === 'string') {
    return data.error;
  }
  // {message: "string"}
  if (typeof data.message === 'string') {
    return data.message;
  }
  // {message: {message: "..."}}
  if (data.message && typeof data.message === 'object' && typeof data.message.message === 'string') {
    return data.message.message;
  }

  return fallback;
}
