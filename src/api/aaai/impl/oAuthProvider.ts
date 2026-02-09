import { AuthConfig, OAuthService, UserInfo } from 'angular-oauth2-oidc';
import { JwksValidationHandler } from 'angular-oauth2-oidc-jwks';
import { Router } from '@angular/router';
import { AuthenticationProvider } from '../authProvider.interface';
import { BehaviorSubject, Observable } from 'rxjs';
import { AAAIUser } from '../aaaiUser.interface';
import { BasicUser } from './basicUser';
import { Injector } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

/** OAuth provider implementation */
export class OAuthAuthenticationProvider implements AuthenticationProvider {
  private static readonly EPOS_CLIENT = 'eposICS';
  private static readonly CYFRONET_ROOT = 'https://aaai.epos-eu.org';
  private static readonly CYFRONET_ISSUER = OAuthAuthenticationProvider.CYFRONET_ROOT + '/oauth2';
  private static readonly REVOKE_ENDPOINT = OAuthAuthenticationProvider.CYFRONET_ISSUER + '/revoke';
  private static readonly REDIRECTION_PAGE = '/last-page-redirect';

  private readonly router: Router;
  private readonly http: HttpClient;

  private updateUserProfileTimeout: NodeJS.Timeout;

  /** Current user */
  private readonly userProfileSource = new BehaviorSubject<null | AAAIUser>(null);

  constructor(
    injector: Injector,
    private readonly oAuthService: OAuthService,
  ) {
    this.router = injector.get(Router);
    this.http = injector.get(HttpClient);
    this.init();
  }

  public watchForUserChange(): Observable<null | AAAIUser> {
    return this.userProfileSource.asObservable();
  }

  public getUser(): null | AAAIUser {
    return this.userProfileSource.getValue();
  }

  // angular-oauth2-oidc suggests that "Code Flow" rather than "Implicit Flow" should be favoured.
  // SHould we adopt that? https://www.npmjs.com/package/angular-oauth2-oidc
  public login(): void {
    this.oAuthService.initCodeFlow();
  }

  public logout(): void {
    // This only logs out the client.
    // in order to log out at the server, we need a logout url.
    void this.revokeTokenManually()
      .then(() => {
        this.oAuthService.logOut();
      });
  }

  public getManageUrl(): string {
    return OAuthAuthenticationProvider.CYFRONET_ROOT;
  }


  private makeAuthConfig(router: Router): AuthConfig {
    const authConfig: AuthConfig = {

      // Url of the Identity Provider
      issuer: OAuthAuthenticationProvider.CYFRONET_ISSUER,

      // URL of the SPA to redirect the user to after login
      // redirectUri: this.redirectionUri(),
      get redirectUri(): string {
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, no-underscore-dangle, @typescript-eslint/dot-notation
        const base = String(router['location']._baseHref); // e.g. /testpath
        const origin = window.location.origin; // e.g. http://localhost:4200

        // e.g. http://localhost:4200/testpath/last-page-redirect
        const redirect = origin + base + OAuthAuthenticationProvider.REDIRECTION_PAGE;
        return redirect;
      },

      // The SPA's id. The SPA is registerd with this id at the auth-server
      clientId: OAuthAuthenticationProvider.EPOS_CLIENT,

      // URL of the SPA to redirect the user after silent refresh
      silentRefreshRedirectUri: window.location.origin + '/silent-token-refresh.html',

      timeoutFactor: 0.75,

      // set the scope for the permissions the client should request
      // The first three are defined by OIDC. The 4th is a usecase-specific one
      scope: [
        'openid',
        'profile',
        'single-logout',
      ].join(' '),

      disableAtHashCheck: true,
    };
    return authConfig;
  }

  private init() {
    this.configure();
    this.oAuthService.setupAutomaticSilentRefresh();
    this.oAuthService.tokenValidationHandler = new JwksValidationHandler();
    void this.oAuthService.loadDiscoveryDocumentAndTryLogin()
      // maybe we should do this like this
      // https://www.linkedin.com/pulse/implicit-flow-authentication-using-angular-ghanshyam-shukla
      .catch((e) => {
        console.warn('Caught Error - Failed to contact Authentication Server.', e);
      })
      .then(() => {
        console.log('Successfully Contacted Authentication Server.');
      });

    this.oAuthService.events.subscribe(e => {
      // angular-oauth2-oidc EventType string values
      switch (e.type) {
        case ('discovery_document_loaded'): // page refresh when logged in
        case ('token_received'): // first logged in
        case ('logout'): // logout to clear user info
          this.updateUserProfile();
          break;
      }
    });

  }

  private updateUserProfile(): void {
    // ensure not called too often
    clearTimeout(this.updateUserProfileTimeout);
    this.updateUserProfileTimeout = setTimeout(() => {
      const token = this.getUserToken();
      const currentProfile = this.userProfileSource.getValue();
      // only if the token has changed
      if ((currentProfile == null) || (currentProfile.getToken() !== token)) {
        // Try protects against a promise not being returned from "loadUserProfile" function.
        try {
          this.oAuthService.loadUserProfile()
            .then((object: UserInfo) => {
              this.userProfileSource.next(BasicUser.makeFromProfileResponse(token, object));
            })
            .catch((error: unknown) => {
              const userId = this.getUserId();
              const user = BasicUser.makeOrDefault(userId, userId, token, userId);
              this.userProfileSource.next(user);
            });
        } catch (error) {
          this.userProfileSource.next(null);
        }
      }
    }, 100);
  }
  private configure() {
    this.oAuthService.configure(this.makeAuthConfig(this.router));
  }


  private revokeTokenManually(): Promise<void> {
    const httpOptions = {
      headers: new HttpHeaders({
        Authorization: 'Bearer ' + this.oAuthService.getAccessToken(),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'Content-Type': 'application/x-www-form-urlencoded',
      }),
    };

    return this.http.post(
      OAuthAuthenticationProvider.REVOKE_ENDPOINT,
      `token=${this.oAuthService.getAccessToken()}` +
      `&client_id=${this.oAuthService.clientId}` +
      '&token_type_hint=access_token' +
      '&logout=true',
      httpOptions,
    )
      .toPromise()
      .then(() => { })
      .catch((e) => {
        console.warn('Unable to revoke Access Token', e);
      });
  }

  private getUserId(): null | string {
    const claims = this.oAuthService.getIdentityClaims() as Record<string, unknown>;
    if (claims) {
      return String(claims.sub);
    }
    return null;
  }

  private getUserToken(): string {
    return this.oAuthService.getAccessToken();
  }
}

