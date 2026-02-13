import { OAuthAuthenticationProvider } from './aaai/impl/oAuthProvider';

export const authAppInitializer = (
  authProvider: OAuthAuthenticationProvider,
): (() => Promise<void>) => {
  return () => authProvider.init();
};
