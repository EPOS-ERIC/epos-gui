/*
  CustomLightbox
  Handles image slideshows
*/

import { LightboxImage, LightboxOptions } from './customLightbox.model';

export class CustomLightbox {
  private overlay: HTMLDivElement | null = null;
  private currentIndex: number = 0;
  private images: LightboxImage[] = [];
  private options: LightboxOptions;

  private imageContainer!: HTMLDivElement;
  private img!: HTMLImageElement;
  private spinner!: HTMLDivElement;
  private caption!: HTMLDivElement;
  private counter!: HTMLDivElement;

  constructor(options: LightboxOptions = {}) {
    this.options = {
      showCounter: true,
      showNavigation: true,
      showCloseButton: true,
      closeOnOverlayClick: true,
      closeOnEscape: true,
      ...options
    };
  }

  /**
   * Opens the lightbox with the given images
   * @param images Array of images with src and caption
   * @param startIndex Index of the image to show first
   */
  public open(images: LightboxImage[], startIndex: number = 0): void {
    if (images.length === 0) {
      console.warn('No images provided to lightbox');
      return;
    }

    this.images = images;
    this.currentIndex = startIndex;

    this.createOverlay();
    this.createElements();
    this.assembleDOM();
    this.attachEventListeners();
    this.loadImage(this.currentIndex);

    document.body.appendChild(this.overlay!);
  }

  /**
   * Closes the lightbox and cleans up event listeners
   */
  public close(): void {
    if (this.overlay && this.overlay.parentNode) {
      document.body.removeChild(this.overlay);
      this.removeEventListeners();
      this.overlay = null;
    }
  }

  /**
   * Creates the overlay div that covers the screen
   */
  private createOverlay(): void {
    this.overlay = document.createElement('div');
    this.overlay.className = 'custom-lightbox-overlay';
  }

  /**
   * Creates all required DOM elements for the lightbox
   */
  private createElements(): void {
    this.createImageContainer();
    this.createImage();
    this.createSpinner();
    this.createCaption();
    this.createCounter();
  }

  /** Creates the container for the image and spinner */
  private createImageContainer(): void {
    this.imageContainer = document.createElement('div');
    this.imageContainer.className = 'custom-lightbox-image-container';
  }

  /** Creates the <img> element for displaying the current image */
  private createImage(): void {
    this.img = document.createElement('img');
    this.img.className = 'custom-lightbox-image';
  }

  /** Creates the spinner element for loading state */
  private createSpinner(): void {
    this.spinner = document.createElement('div');
    this.spinner.className = 'custom-lightbox-spinner';
    this.spinner.innerHTML = '<i class="spinner fas fa-spinner fa-pulse"></i>';
  }

  /** Creates the caption element */
  private createCaption(): void {
    this.caption = document.createElement('div');
    this.caption.className = 'custom-lightbox-caption';
  }

  /** Creates the counter element (e.g., "Image 1 of 5") */
  private createCounter(): void {
    this.counter = document.createElement('div');
    this.counter.className = 'custom-lightbox-counter';
  }

  /**
   * Appends all elements into the overlay and assembles the lightbox
   */
  private assembleDOM(): void {
    if (!this.overlay) {
        return;
    }

    // Add the image to its container
    this.imageContainer.appendChild(this.img);

    // Add close button if enabled
    if (this.options.showCloseButton) {
      this.overlay.appendChild(this.createCloseButton());
    }

    // Add navigation buttons if enabled and there are multiple images
    if (this.options.showNavigation && this.images.length > 1) {
      this.overlay.appendChild(this.createPrevButton());
      this.overlay.appendChild(this.createNextButton());
    }

    this.overlay.appendChild(this.imageContainer);
    this.overlay.appendChild(this.caption);

    // Add counter if enabled and multiple images exist
    if (this.options.showCounter && this.images.length > 1) {
      this.overlay.appendChild(this.counter);
    }
  }

  /** Creates the close button and binds the click event */
  private createCloseButton(): HTMLButtonElement {
    const closeBtn = document.createElement('button');
    closeBtn.className = 'custom-lightbox-close';
    closeBtn.innerHTML = '✕';
    closeBtn.setAttribute('aria-label', 'Close lightbox');
    closeBtn.onclick = () => this.close();
    return closeBtn;
  }

  /** Creates the previous image button */
  private createPrevButton(): HTMLButtonElement {
    const prevBtn = document.createElement('button');
    prevBtn.className = 'custom-lightbox-prev';
    prevBtn.innerHTML = '‹';
    prevBtn.setAttribute('aria-label', 'Previous image');
    prevBtn.onclick = () => this.navigate(-1);
    return prevBtn;
  }

  /** Creates the next image button */
  private createNextButton(): HTMLButtonElement {
    const nextBtn = document.createElement('button');
    nextBtn.className = 'custom-lightbox-next';
    nextBtn.innerHTML = '›';
    nextBtn.setAttribute('aria-label', 'Next image');
    nextBtn.onclick = () => this.navigate(1);
    return nextBtn;
  }

  /**
   * Moves to the next or previous image
   * @param direction 1 for next, -1 for previous
   */
  private navigate(direction: number): void {
    const newIndex = (this.currentIndex + direction + this.images.length) % this.images.length;
    this.loadImage(newIndex);
  }

  /**
   * Loads and displays the image at the given index
   * Handles spinner, error, caption, and counter updates
   */
  private loadImage(index: number): void {
    if (index < 0 || index >= this.images.length) {
      console.error('Invalid image index:', index);
      return;
    }

    this.currentIndex = index;
    this.showSpinner();
    this.hideImage();

    const newImg = new Image();

    newImg.onload = () => {
      this.img.src = newImg.src;
      this.showImage();
      this.hideSpinner();
      this.updateCaption();
      this.updateCounter();
    };

    newImg.onerror = () => {
      console.error('Failed to load image:', this.images[index].src);
      this.hideSpinner();
      this.showImage();
      this.img.alt = 'Failed to load image';
      this.updateCaption();
      this.updateCounter();
    };

    newImg.src = this.images[index].src;
  }

  /** Show the loading spinner */
  private showSpinner(): void {
    if (!this.imageContainer.contains(this.spinner)) {
      this.imageContainer.appendChild(this.spinner);
    }
  }

  /** Hide the loading spinner */
  private hideSpinner(): void {
    if (this.imageContainer.contains(this.spinner)) {
      this.imageContainer.removeChild(this.spinner);
    }
  }

  /** Display the image element */
  private showImage(): void {
    this.img.style.display = 'block';
  }

  /** Hide the image element */
  private hideImage(): void {
    this.img.style.display = 'none';
  }

  /** Updates the caption text for the current image */
  private updateCaption(): void {
    this.caption.textContent = this.images[this.currentIndex].caption;
  }

  /** Updates the counter text for the current image */
  private updateCounter(): void {
    this.counter.textContent = `Image ${this.currentIndex + 1} of ${this.images.length}`;
  }

  /**
   * Attaches global and overlay event listeners
   */
  private attachEventListeners(): void {
    if (this.options.closeOnOverlayClick) {
      this.overlay!.addEventListener('click', this.handleOverlayClick);
    }
  }

  /** Removes all event listeners when the lightbox closes */
  private removeEventListeners(): void {
    if (this.overlay) {
      this.overlay.removeEventListener('click', this.handleOverlayClick);
    }
  }

  /** Overlay click closes lightbox if clicked outside the image */
  private handleOverlayClick = (e: MouseEvent): void => {
    if (e.target === this.overlay) {
      this.close();
    }
  };

}
