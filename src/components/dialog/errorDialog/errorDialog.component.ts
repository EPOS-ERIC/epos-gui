import { Component, OnInit } from '@angular/core';
import { environment } from 'environments/environment';

@Component({
  selector: 'app-error-dialog',
  templateUrl: './errorDialog.component.html',
  styleUrls: ['./errorDialog.component.scss']
})
export class ErrorDialogComponent implements OnInit {
  public environment = environment;

  ngOnInit() {
    console.log();
  }
}
