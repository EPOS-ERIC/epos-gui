export interface Rest {

  get(url: string, fullResponse?: boolean, asBlob?: boolean): Promise<unknown>;

  put(url: string, body: unknown, fullResponse?: boolean, extraHeaders?: Record<string, string>): Promise<unknown>;

  post(url: string, body: unknown, fullResponse?: boolean, extraHeaders?: Record<string, string>): Promise<unknown>;

  delete(url: string): Promise<unknown>;

}

