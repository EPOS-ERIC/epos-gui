import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormControl, NgForm } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';


@Component({
  selector: 'app-select-check-all',
  templateUrl: './selectCheckAll.component.html',
  styleUrls: ['./selectCheckAll.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SelectCheckAllComponent implements OnInit {
  @Input() values: Array<string> = [];
  @Input() text = 'Select All';
  @Input() name: string;
  @Input() form: NgForm;

  private model: UntypedFormControl;

  ngOnInit(): void {
    setTimeout(() => {
      this.model = this.form.form.controls[this.name] as UntypedFormControl;
    }, 100);

  }

  isChecked(): boolean {
    if (this.model !== undefined) {
      return this.model.value && this.values.length
        && this.model.value.length === this.values.length;
    }
    return false;
  }

  isIndeterminate(): boolean {
    if (this.model !== undefined) {
      return this.model.value && this.values.length && this.model.value.length
        && this.model.value.length < this.values.length;
    }
    return false;
  }

  toggleSelection(change: MatCheckboxChange): void {
    if (change.checked) {
      this.model.setValue(this.values);
    } else {
      this.model.setValue([]);
    }
  }
}
