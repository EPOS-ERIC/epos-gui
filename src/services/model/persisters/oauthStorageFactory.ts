import { OAuthStorage } from 'angular-oauth2-oidc';
/**
 * The function `oauthStorageFactory` returns the `localStorage` object as an instance of
 * `OAuthStorage`.
 * @returns the localStorage object.
 */
// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export function oauthStorageFactory(): OAuthStorage {
  return localStorage;
}
