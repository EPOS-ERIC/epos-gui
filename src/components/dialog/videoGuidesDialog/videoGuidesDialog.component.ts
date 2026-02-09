import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { environment } from 'environments/environment';
import { DialogData } from '../baseDialogService.abstract';
import { Video } from './videoComponent/video.component';
import { Tracker } from 'utility/tracker/tracker.service';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { TrackerAction, TrackerCategory } from 'utility/tracker/tracker.enum';

@Component({
  selector: 'app-video-guides-dialog',
  templateUrl: './videoGuidesDialog.component.html',
  styleUrls: ['./videoGuidesDialog.component.scss']
})
export class VideoGuidesDialogComponent {

  public videos: Array<Video>;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private readonly tracker: Tracker
  ) {
    this.videos = environment.videos;
    this.tracker.trackEvent(TrackerCategory.VIDEO, TrackerAction.PLAY, this.videos[0].title);
  }

  public changeTab(event: MatTabChangeEvent): void {
    this.tracker.trackEvent(TrackerCategory.VIDEO, TrackerAction.PLAY, this.videos[event.index].title);
  }

}
