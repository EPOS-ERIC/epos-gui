import { AfterViewInit, Directive, ElementRef } from '@angular/core';

/**
 * Direcive for showing the a string as a link if it is a url.
 */
@Directive({
  selector: '[appLinkIfUrl]'
})
export class LinkIfUrlDirective implements AfterViewInit {

  constructor(
    private readonly el: ElementRef,
  ) {
  }

  ngAfterViewInit(): void {
    const element = this.el.nativeElement as HTMLElement;
    const text = element.innerText;
    if (this.validURL(text)) {
      const link = document.createElement('a');
      link.target = '_blank';
      link.href = text;
      link.innerHTML = text;

      element.innerHTML = '';
      element.appendChild(link);
    }

  }


  private validURL(text: string): boolean {
    const pattern = /^(http|https|ftp):\/\//;
    return ((null != text) && (pattern.test(text)));
  }

}
