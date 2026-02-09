import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/** The SafeHtmlPipe class is a TypeScript class that transforms a string into a SafeHtml object by
bypassing security checks. */
@Pipe({ name: 'safeHtml' })
export class SafeHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) { }

  /**
   * The function transforms a string into a SafeHtml object by bypassing security checks.
   * @param {string} value - The value parameter is a string that represents the HTML content that you
   * want to transform into a SafeHtml object.
   * @returns a value of type SafeHtml.
   */
  transform(value: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(value);
  }
}
