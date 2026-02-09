export interface SuccessHandler {
    handleSuccess(status: number, url: string, method: string): void;
}
