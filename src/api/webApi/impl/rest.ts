import { Rest } from 'api/webApi/classes/rest.interface';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { AaaiService } from 'api/aaai.service';
import { ErrorHandler } from '../classes/errorHandler.interface';
import { SuccessHandler } from '../classes/successHandler.interface';

/**
 * Performs the required http request to the API module.
 * Forms the correct request, adding authentication information as required
 * Validate responses.
 */
export class RestImpl implements Rest {
  constructor(
    private readonly http: HttpClient,
    private readonly errorHandler: ErrorHandler,
    private readonly successHandler: SuccessHandler,
    private readonly aaai: AaaiService
  ) {

  }

  /**
   * Get
   * @param url
   * @param fullResponse
   * @param asBlob Whether to return a Blob instead of JSON
   * @returns JSON/Blob or HttpResponse (Blob/JSON as body) depending of fullResponse.
   */
  public get(url: string, fullResponse = false, asBlob = false): Promise<unknown> {
    const method = 'get';

    return (
      (asBlob)
        ? this.http.get(url, {
          ...this.makeOptions(),
          responseType: 'blob',
        })
        : this.http.get(url, this.makeOptions())
    )
      .toPromise()
      .then((res: HttpResponse<unknown>) => {
        // test unauthorized response
        // if (asBlob) {
        //   return Promise.reject(new HttpResponse({ status: HttpStatus.UNAUTHORIZED }));
        // }
        return this.doThen(res, method, url, fullResponse);
      })
      .catch((error: unknown) => {
        return this.doCatch(error, method, url);
      });
  }


  /**
   * Put
   * @param url
   * @param body
   * @param fullResponse
   * @returns JSON or HttpResponse depending of fullResponse
   */
  public put(url: string, body: unknown, fullResponse = false, extraHeaders: Record<string, string> = {}): Promise<unknown> {
    const method = 'put';
    return this.http.put(url, body, { ...this.makeOptions(extraHeaders) }).toPromise().then((res: HttpResponse<unknown>) => {
      return this.doThen(res, method, url, fullResponse);
    }).catch((error: unknown) => {
      return this.doCatch(error, method, url);
    });
  }

  /**
   * Post
   * @param url
   * @param body
   * @param fullResponse
   * @returns JSON or HttpResponse depending of fullResponse
   */
  public post(url: string, body: unknown, fullResponse = false, extraHeaders: Record<string, string> = {}): Promise<unknown> {
    const method = 'post';
    return this.http.post(url, body, {
      ...this.makeOptions(extraHeaders),
    }).toPromise().then((res: HttpResponse<unknown>) => {
      return this.doThen(res, method, url, fullResponse);
    }).catch(
      (error: unknown) => {
        return this.doCatch(error, method, url);
      });
  }

  /**
   * Delete
   * @param url
   * @param fullResponse
   * @returns JSON or HttpResponse depending of fullResponse
   */
  public delete(url: string, fullResponse = false): Promise<unknown> {
    const method = 'delete';
    return this.http.delete(url, this.makeOptions()).toPromise().then((res: HttpResponse<unknown>) => {
      return this.doThen(res, method, url, fullResponse);
    }).catch(
      (error: unknown) => {
        return this.doCatch(error, method, url);
      });
  }

  private createAuthorisationHeader() {
    const user = this.aaai.getUser();
    const headers: Record<string, string> = {};

    if (user != null) {
      headers.Authorization = 'Bearer ' + user.getToken();
    }

    return headers;

  }

  private makeOptions(extraHeaders: Record<string, string> = {}): Record<string, unknown> {

    let headers: Record<string, string> = {};
    const authHeaders = this.createAuthorisationHeader();

    headers = { ...headers, ...authHeaders, ...extraHeaders };

    return {
      headers: new HttpHeaders(headers),
      observe: 'response',
    };
  }

  private doThen(res: HttpResponse<unknown>, method: string, url: string, fullResponse = false): unknown {
    const respondWith = fullResponse ? res : res.body;
    this.successHandler.handleSuccess(res.status, url, method);
    return respondWith;
  }

  private doCatch(error: unknown, method: string, url: string): Promise<unknown> {
    return this.errorHandler.handleError(error, url, method);
  }

}

// type ResponseType = 'arraybuffer' | 'blob' | 'text' | 'json';
