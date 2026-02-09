import { Directive, ElementRef, Input, OnInit } from '@angular/core';

@Directive({
  selector: '[appMatBadgeFaClass]'
})
export class MatBadgeFaIconDirective implements OnInit {

  @Input() appMatBadgeFaClass: string;

  constructor(private el: ElementRef) { }

  ngOnInit() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const badge: HTMLElement = this.el.nativeElement as HTMLElement;

    badge.innerHTML = `<span class="mat-badge-content mat-badge-active"><i class="${this.appMatBadgeFaClass}"></i></span>`;
  }
}
