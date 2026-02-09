export interface ErrorHandler {
  handleError(error: unknown, url: string, method: string): Promise<unknown>;
}
