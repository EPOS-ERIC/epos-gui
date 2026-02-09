export class ApiError extends Error {
  constructor(m: string) {
    super(m);
  }
}
