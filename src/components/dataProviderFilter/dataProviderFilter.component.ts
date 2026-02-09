import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Organization } from 'api/webApi/data/organization.interface';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { SimpleOrganization } from 'api/webApi/data/impl/simpleOrganization';
import { DialogService } from 'components/dialog/dialog.service';
import { FacetLeafItemMI } from 'services/model/modelItems/facetLeafItemMI';
import { Subscription } from 'rxjs';
import { Unsubscriber } from 'decorators/unsubscriber.decorator';

export interface DataProvider extends Organization {
  isSelected: boolean;
}

@Unsubscriber('subscriptions')
@Component({
  selector: 'app-data-provider-filter',
  templateUrl: './dataProviderFilter.component.html',
  styleUrls: ['./dataProviderFilter.component.scss']
})
export class DataProviderFilterComponent implements OnInit {

  @Input() public dataProviders: Array<Organization>;
  @Input() public dataProvidersSelected: Array<string>;
  @Input() public title: string;
  @Input() public label: string;
  @Input() public model: FacetLeafItemMI;
  @Output() newDataProvidersSelected: EventEmitter<Array<string>> = new EventEmitter<Array<string>>();

  @ViewChild('organisationsSelect') private organisationsSelect: MatSelect;

  /** Variable for keeping track of subscriptions, which are cleaned up by Unsubscriber */
  private readonly subscriptions: Array<Subscription> = new Array<Subscription>();

  constructor(
    private readonly dialogService: DialogService,
  ) {
  }


  ngOnInit(): void {

    setTimeout(() => {
      // select options arrived from input array
      this.selectOption();

    }, 100);

    if (this.model !== undefined) {
      this.subscriptions.push(
        this.model.valueObs.subscribe((value: Array<string>) => {
          if (value !== null) {
            this.dataProvidersSelected = value;
            this.selectOption();
          }
        })
      );
    }
  }

  /**
   * The `openFilter` function opens a dialog for selecting data providers, updates the selected data
   * providers, and closes the select.
   */
  public openFilter(): void {
    void this.dialogService.openDataProvidersFilter(this.dataProviders,
      this.dataProvidersSelected,
      this.title).then((output) => {

        this.dataProviders.map((_dp: DataProvider) => _dp.isSelected = false);

        if (output !== null && output.dataOut !== false) {
          if (output !== null) {
            const selected = output.dataOut as Array<string>;
            this.newDataProvidersSelected.emit(output.dataOut as Array<string>);

            this.organisationsSelect.options.forEach((item: MatOption) => {
              const id = (item.value as SimpleOrganization).getIdentifier();
              if (selected.includes(id)) {
                item.select();
              }
            });
          }
        }
        // close select
        this.organisationsSelect.close();

      });
  }

  private selectOption(): void {

    if (this.organisationsSelect !== undefined) {

      this.organisationsSelect.options.forEach(item => {
        const id = (item.value as SimpleOrganization).getIdentifier();
        if (this.dataProvidersSelected.includes(id)) {
          item.select();
        } else {
          item.deselect();
        }
      });
    }
  }
}

