/**
 * Thrown by `apiClient` when a proxy/backend error response carries the v2
 * envelope's `message` — the backend's localized text — so UI can show it
 * instead of a generic fallback. Plain `Error`s (network, S3, missing
 * message) stay generic.
 */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}
