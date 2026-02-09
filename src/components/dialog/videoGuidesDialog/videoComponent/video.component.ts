import { Component, Input, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-video',
  templateUrl: './video.component.html',
  animations: [
  ],
})
export class VideoComponent implements OnInit {

  @Input() video: Video;
  public videoUrl: SafeResourceUrl;

  constructor(
    private domSanitizer: DomSanitizer
  ) {
  }

  ngOnInit(): void {
    this.videoUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(this.video.url);
  }

}

export interface Video {
  title: string;
  url: string;
}

