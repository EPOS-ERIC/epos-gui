import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DialogData } from 'components/dialog/baseDialogService.abstract';
import { Organization } from 'api/webApi/data/organization.interface';
import { Country } from 'assets/data/countries';
import { DataProvider } from 'components/dataProviderFilter/dataProviderFilter.component';
import { Tracker } from 'utility/tracker/tracker.service';
import { TrackerAction, TrackerCategory } from 'utility/tracker/tracker.enum';
import { debounceTime, distinctUntilChanged } from 'rxjs';

export interface DetailsDataIn {
  dataProviders: Array<DataProvider>;
  dataProvidersSelected: Array<string>;
  title: string;
}

@Component({
  selector: 'app-data-provider-filter-dialog',
  templateUrl: './dataProviderFilterDialog.component.html',
  styleUrls: ['./dataProviderFilterDialog.component.scss']
})
export class DataProviderFilterDialogComponent implements OnInit {

  public alphabetList: Array<string>;
  public alphabetCheck: Array<string>;
  public activeLetter: string = 'selected';

  public dataProviders: Array<DataProvider>;
  public dataProvidersSelectedInput: Array<string>;
  public dataProviderList: Array<[string, Array<DataProvider>]>;
  public dataProviderListSelected: Array<DataProvider> = [];
  public dataProviderCounter: number = 0;
  public dataProviderCounterTotal: number = 0;

  public freeTextFormControl = new UntypedFormControl();

  public newDataProvidersSelected: Array<string> = [];

  public showOnlySelected = true;
  public filters = {
    letter: false,
    text: false,
    country: false,
  };

  public spinner = true;

  public title: string;

  private alphabet = 'abcdefghijklmnopqrstuvwxyz';

  private countrySelected: string = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DialogData<DetailsDataIn>,
    private readonly tracker: Tracker,
  ) {
    this.dataProviders = this.data.dataIn.dataProviders;
    this.dataProvidersSelectedInput = this.data.dataIn.dataProvidersSelected;
    this.dataProviderCounter = this.dataProviderCounterTotal = this.dataProviders.length;
    this.title = this.data.dataIn.title;

    this.data.dataOut = [];

    this.alphabetList = this.alphabet.toUpperCase().split('');
  }

  public ngOnInit(): void {

    this.dataProviders.map(_o => {
      // trim name
      _o.getName().trim();

      // set selected
      if (this.dataProvidersSelectedInput.includes(_o.getIdentifier())) {
        _o.isSelected = true;
        this.dataProviderListSelected.push(_o);
      }
    });

    // sort dataProviders
    this.dataProviders.sort((a, b) => {
      return this.sortData(a, b);
    });

    this.freeTextFormControl.valueChanges.subscribe((value: string) => {
      // If the text is empty, reset the filter
      if (value.trim() === '') {
        this.filters.text = false;
        this.alphabetCheck = this.alphabetList; // Reset the alphabet check array
        this._filter();
        return;
      }

      this.filters.text = true;

      this._filter();
      this.refreshAlphabetCheckArray();
    });

    // track text 2sec after typing
    this.freeTextFormControl.valueChanges.pipe(
      debounceTime(2000),
      distinctUntilChanged()
    ).subscribe((value: string) => {

      if (value.trim() !== '') {
        this.tracker.trackEvent(TrackerCategory.PROVIDERS, TrackerAction.FREE_TEXT_SEARCH, value);
      }
    });

    this.dataProviderList = this.groupByFirstLetter(this.dataProviders);
    this.refreshAlphabetCheckArray();

    setTimeout(() => {
      this.spinner = false;
    }, 300);

    if (this.dataProviderListSelected.length === 0) {
      this.activeLetter = '';
      this.showOnlySelected = false;
    }

  }

  /**
   * The activateLetter function sets the active letter, updates the showOnlySelected flag, and applies
   * filters based on the selected letter.
   * @param {string} letter - The "letter" parameter is a string that represents the letter to be
   * activated. It can be an empty string, the string "selected", or any other letter of the alphabet.
   */
  public activateLetter(letter: string): void {
    this.activeLetter = letter;
    this.showOnlySelected = false;

    if (letter === '') {
      this.filters.letter = false;
    } else if (letter === 'selected') {
      this.showOnlySelected = true;
    } else {
      this.filters.letter = true;
    }

    this._filter();

  }

  /**
   * The function "countrySelection" updates the filters and countrySelected variables based on the
   * selected country's isoCode, and then calls the _filter and refreshAlphabetCheckArray functions.
   * @param {Country} country - The parameter "country" is of type "Country".
   */
  public countrySelection(country: Country): void {

    if (country.isoCode !== undefined) {
      this.filters.country = true;
      this.countrySelected = country.isoCode;

      // track
      this.tracker.trackEvent(TrackerCategory.PROVIDERS, TrackerAction.SELECT_COUNTRY, country.name);

    } else {
      this.activeLetter = '';
      this.filters.country = false;
      this.filters.letter = false;
    }

    this._filter();

    this.refreshAlphabetCheckArray();

  }

  /**
   * The function toggles the "isSelected" property of all objects in the "dataProviderListSelected"
   * array to the given status.
   * @param {boolean} status - The "status" parameter is a boolean value that determines whether all
   * items in the "dataProviderListSelected" array should be selected or deselected. If "status" is
   * true, all items will be selected. If "status" is false, all items will be deselected.
   */
  public toggleAllSelected(status: boolean): void {
    this.dataProviderListSelected.map(_obj => {
      _obj.isSelected = status;
    });
  }

  /**
   * The function toggles the "isSelected" property of all data providers in a list to a specified
   * status.
   * @param {boolean} status - The "status" parameter is a boolean value that determines whether the
   * "isSelected" property of each "DataProvider" object should be set to true or false.
   */
  public toggleAllFiltered(status: boolean): void {
    this.dataProviderList.forEach(_g => {
      _g[1].forEach((_dp: DataProvider) => {
        _dp.isSelected = status;
      });
    });
  }

  /**
   * The submit function updates the dataOut property of the data object with the identifiers of the
   * selected data providers and then closes the data object.
   */
  public submit(): void {

    this.newDataProvidersSelected = [];
    const newDataProvidersSelectedName: Array<string> = [];

    this.dataProviders.forEach((_dp: DataProvider) => {
      if (_dp.isSelected) {
        this.newDataProvidersSelected.push(_dp.getIdentifier());
        newDataProvidersSelectedName.push(_dp.getName());
      }
    });

    this.data.dataOut = this.newDataProvidersSelected;

    if (this.newDataProvidersSelected.length > 0) {
      // track search
      this.tracker.trackEvent(TrackerCategory.SEARCH, TrackerAction.DATA_PROVIDER, newDataProvidersSelectedName.join(Tracker.TARCKER_DATA_SEPARATION));
    }

    this.data.close();
  }

  public cancel(): void {
    this.data.dataOut = false;
    this.data.close();
  }

  /**
   * Updates the list of selected data providers based on the checkbox status of a data provider.
   * @param {DataProvider} dataProvider - The data provider whose checkbox status has changed.
   */
  public updateDataProviderListSelected(dataProvider: DataProvider): void {
    if (dataProvider.isSelected) {
      // If the checkbox is checked, add the data provider to the list
      this.dataProviderListSelected.push(dataProvider);
    } else {  // If the checkbox is unchecked, remove the data provider from the list
      // Find the index of the data provider in the list
      const index = this.dataProviderListSelected.indexOf(dataProvider);
      // If the data provider is in the list
      if (index > -1) {
        // Remove it
        this.dataProviderListSelected.splice(index, 1);
      }
    }
  }

  private _filter(): void {

    let dataProvidersFiltered: Array<Organization> = this.dataProviders;

    // filter by first letter
    if (this.filters.letter) {
      const filterValue = this.activeLetter;

      dataProvidersFiltered = dataProvidersFiltered.filter(
        option => option.getName()[0].toLowerCase().includes(filterValue.toLowerCase())
      );
    }

    // filter by free text
    if (this.filters.text) {

      const filterValue = this.freeTextFormControl.value as string;

      if (filterValue !== '') {
        dataProvidersFiltered = dataProvidersFiltered.filter(
          option => option.getName().toLowerCase().includes(filterValue.toLowerCase())
        );
      }
    }

    // filter by country
    if (this.filters.country) {

      const filterValue = this.countrySelected;

      dataProvidersFiltered = dataProvidersFiltered.filter(
        option => option.getCountry().toLowerCase().includes(filterValue.toLowerCase())
      );
    }

    this.dataProviderCounter = dataProvidersFiltered.length;

    // group by first letter
    this.dataProviderList = this.groupByFirstLetter(dataProvidersFiltered);
  }

  private refreshAlphabetCheckArray() {
    this.alphabetCheck = [];
    this.dataProviderList.forEach(_g => {
      this.alphabetCheck.push(_g[0].toUpperCase());
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private groupByFirstLetter(arr: Array<Organization>): Array<[string, Array<DataProvider>]> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    const group = arr.reduce((acc, cur: DataProvider) => {
      const firstLetter = cur.getName()[0].toLowerCase();

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      return { ...acc, [firstLetter]: [...(acc[firstLetter] || []), cur] };
    }, {}) as Array<Array<DataProvider>>;

    const groupedArray = Object.entries(group);
    const result: Array<[string, Array<DataProvider>]> = [];

    // first element not in alphabet list
    groupedArray.forEach((_g, index) => {
      const key = _g[0];
      if (!this.alphabetList.includes(key.toUpperCase())) {
        result.push(_g);
      }
    });

    // other grouped list
    groupedArray.forEach((_g, index) => {
      const key = _g[0];
      if (this.alphabetList.includes(key.toUpperCase())) {
        result.push(_g);
      }
    });

    return result;
  }

  private sortData(a: DataProvider, b: DataProvider) {
    if (a.getName().toLowerCase() < b.getName().toLowerCase()) {
      return -1;
    }
    if (a.getName().toLowerCase() > b.getName().toLowerCase()) {
      return 1;
    }
    return 0;
  }
}
