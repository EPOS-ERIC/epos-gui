import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-object-displayer',
  templateUrl: './objectDisplayer.component.html',
  styleUrls: ['./objectDisplayer.component.scss'],
})
export class ObjectDisplayerComponent implements OnInit {
  @Input() value: unknown;
  @Input() index = 0;
  @Input() indexOf = 1; // total count iterating around
  @Input() depth = 0;

  public isEmpty = true;
  public stringValue: null | string = null;
  public objectValue: null | Record<string, unknown> = null;

  public childrenCount = 0;
  public showChildLabels = false;

  ngOnInit(): void {
    // guard against circular references
    try {
      JSON.stringify(this.value);

      // if no error
      switch (true) {
        case (typeof this.value === 'object'): {
          const entriesLength = (Array.isArray(this.value))
            ? this.value.length
            : Object.entries(this.value as Record<string, unknown>).length;
          if (0 < entriesLength) { // don't display empty objects
            this.objectValue = this.value as Record<string, unknown>;
            this.childrenCount = entriesLength;
            this.showChildLabels = (!Array.isArray(this.value)); // object
          }
          break;
        }
        case (typeof this.value === 'string'): {
          const stringVal = String(this.value).trim();
          if (0 < stringVal.length) {// don't display empty strings
            this.stringValue = stringVal;
          }
          break;
        }
      }

      this.isEmpty = ((null == this.stringValue)
        && (null == this.objectValue));
    } catch (e) {
      console.warn(e);
    }
  }

}
