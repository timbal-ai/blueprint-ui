/* eslint-disable @typescript-eslint/no-explicit-any */
export class TimbalApiError extends Error {
  public statusCode: number;
  public code?: string;
  public details?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number,
    code?: string,
    details?: Record<string, any>,
  ) {
    super(message);
    this.name = "TimbalApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static async fromResponse(response: Response): Promise<TimbalApiError> {
    try {
      const errorData = (await response.json()) as any;
      return new TimbalApiError(
        errorData.message || errorData.error || "Unknown error",
        response.status,
        errorData.code,
        errorData.details,
      );
    } catch {
      return new TimbalApiError(
        response.statusText || "Unknown error",
        response.status,
      );
    }
  }
}
