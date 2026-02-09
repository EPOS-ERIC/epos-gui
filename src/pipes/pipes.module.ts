import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UrlToLinkPipe } from './urlToLink.pipe';
import { SafeHtmlPipe } from './safeHtml.pipe';

@NgModule({
  declarations: [
    UrlToLinkPipe,
    SafeHtmlPipe
  ],
  imports: [
    CommonModule,
  ],
  exports: [
    UrlToLinkPipe,
    SafeHtmlPipe
  ],
  providers: [
    UrlToLinkPipe
  ]
})
export class PipesModule { }
