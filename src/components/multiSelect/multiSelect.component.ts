import { Component, Input, Output, ViewChild, EventEmitter, OnInit } from '@angular/core';
import { MatOption } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';
import { FacetLeafItem } from 'api/webApi/data/impl/facetLeafItem';
import { Unsubscriber } from 'decorators/unsubscriber.decorator';
import { Subscription } from 'rxjs';
import { FacetLeafItemMI } from 'services/model/modelItems/facetLeafItemMI';

@Unsubscriber('subscriptions')
@Component({
  selector: 'app-multi-select',
  templateUrl: './multiSelect.component.html',
  styleUrls: ['./multiSelect.component.scss'],
})
export class MultiSelectComponent implements OnInit {

  @Input() list: Array<FacetLeafItem>;
  @Input() label: string = '';
  @Input() toSelect: Array<string> = [];
  @Input() toSelectAttr: string = 'id';
  @Input() model: FacetLeafItemMI;

  @Output() newSelectedIds: EventEmitter<Array<string>> = new EventEmitter<Array<string>>();

  @ViewChild('select') private select: MatSelect;
  @ViewChild('option') private option: MatOption;

  public selectedObject: Array<FacetLeafItem> = [];
  public countSelected: number;

  /** Variable for keeping track of subscriptions, which are cleaned up by Unsubscriber */
  private readonly subscriptions: Array<Subscription> = new Array<Subscription>();

  ngOnInit(): void {

    setTimeout(() => {
      // select options arrived from input array
      this.selectOption();
    }, 500);

    if (this.model !== undefined) {
      this.subscriptions.push(
        this.model.valueObs.subscribe((value: Array<string>) => {
          if (value !== null) {
            this.toSelect = value;
            this.selectOption();
          }
        })
      );
    }

  }

  /**
   * The function `toggleSelected` is used to update the selected items in a facet source based on the
   * provided event and selected items.
   * @param {boolean} eventOpen - A boolean value indicating whether the select options are open or
   * closed.
   * @param selected - The `selected` parameter is an optional array of `FacetLeafItem` objects. It
   * represents the currently selected items in a facet. If no items are selected, it defaults to an
   * empty array.
   */
  public toggleSelected(eventOpen: boolean, selected: Array<FacetLeafItem> = []): void {

    // only when close select options
    if (!eventOpen) {

      let items = selected.length === 0 ? this.selectedObject : selected;
      items = items.filter(i => i !== null);

      this.countSelected = items.length;

      const newSelected: Array<string> = [];

      // add selected items to facetSource
      items.forEach(item => {
        newSelected.push(item.id);
      });

      this.newSelectedIds.emit(newSelected);
    }

  }

  /**
   * The function toggles the selection of all options in a select component, either selecting all
   * options or deselecting all options based on the value of the "deselectAll" parameter.
   * @param [deselectAll=false] - The "deselectAll" parameter is a boolean value that determines
   * whether all options should be deselected. If it is set to true, then the "deselect()" method will
   * be called on the "option" object to deselect it. If it is set to false, then the method will check
   */
  public toggleAllSelection(deselectAll = false): void {
    if (deselectAll) {
      this.option.deselect();
    } else {
      if (this.option.selected) {
        this.select.options.forEach((item: MatOption) => item.select());
      } else {
        this.select.options.forEach((item: MatOption) => item.deselect());
      }
    }
  }

  /**
   * The function selects options in a select element based on a list of values to be selected.
   */
  private selectOption(): void {

    if (this.option !== undefined) {
      this.toggleAllSelection(true);
    }

    if (this.select !== undefined) {

      this.select.options.forEach((item: MatOption) => {

        const obj = item.value as FacetLeafItem;
        if (obj !== null) {
          let check = false;
          if (this.toSelectAttr === 'id') {
            check = this.toSelect.includes(obj.id);
          } else if (this.toSelectAttr === 'label') {
            check = this.toSelect.includes(obj.label);
          }

          if (check) {
            item.select();
          } else {
            item.deselect();
          }
        }
      });
    }
  }

}
