export interface LightboxImage {
  src: string;
  caption: string;
}

export interface LightboxOptions {
  showCounter?: boolean;
  showNavigation?: boolean;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}
