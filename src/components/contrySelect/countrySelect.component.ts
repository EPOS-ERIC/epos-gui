import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { Countries, Country } from 'assets/data/countries';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-country-select',
  templateUrl: 'countrySelect.component.html',
  styleUrls: ['countrySelect.component.scss']
})
export class CountrySelectComponent implements OnInit {

  /** Emits the selected country object when the user makes a selection. */
  @Output() countrySelected: EventEmitter<Country> = new EventEmitter<Country>();

  public autoCompleteCountryFormControl = new UntypedFormControl();
  public filteredCountries: Observable<Array<Country> | null>;

  public countries = Countries;
  public countryLabel: Country | null;

  private lastValue: Country | null;

  /** Sets the default country for the component. */
  @Input() set countryDefault(value: Country | null) {
    this.countryLabel = value;
    this.autoCompleteCountryFormControl.setValue(value);
  }

  ngOnInit(): void {
    // Sort the countries alphabetically by name.
    this.countries.sort((a, b) => {
      return this.sortData(a, b);
    });

    // Set up the observable for filtering countries as the user types.
    this.filteredCountries = this.autoCompleteCountryFormControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value as string | Country)),
    );
  }

  /**
   * Handles the selection of a country from the autocomplete list.
   * Updates the component's state and emits the selected country.
   * @param country The country object selected by the user, or null.
   */
  public countrySelection(country: Country | null): void {
    this.countryLabel = country;
    // Emit the value only if it's a new, valid selection.
    if (country !== null && country !== this.lastValue) {
      this.lastValue = country;
      this.countrySelected.next(country);
    }
  }


  /**
   * The function "displayCountry" takes a Country object as input and returns its name if it exists,
   * otherwise it returns an empty string.
   * @param {Country} item - The parameter "item" is of type "Country".
   * @returns the name of the country if the item is defined and has a name property. Otherwise, it
   * returns an empty string.
   */
  public displayCountry(item: Country): string {
    return item && item.name ? item.name : '';
  }

  /**
   * The function filters an array of countries based on a given value.
   * @param {string | Country} value - The `value` parameter can be either a string or an object of
   * type `Country`.
   * @returns either `null` or an array of `Country` objects.
   */
  private _filter(value: string | Country | null): Array<Country> | null {
    if (value === '' || value === null) {
      return this.countries;
    }

    // Extract the string to use for filtering.
    const filterValue: string = value instanceof Object ? value.name : value;

    // Normalize the filter value for accent-insensitive comparison.
    const normalizedFilterValue = this._normalizeValue(filterValue);

    return this.countries?.filter(option =>
      // Also normalize the country name before checking for inclusion.
      this._normalizeValue(option.name).includes(normalizedFilterValue)
    ) ?? [];
  }

  /**
   * Normalizes a string by converting it to lower case and removing diacritics.
   * This allows for accent-insensitive searching (e.g., 'ü' matches 'u').
   * @param str The string to normalize.
   * @returns The normalized string.
   */
  private _normalizeValue(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD') // Decomposes accented characters into base characters and marks.
      .replace(/[\u0300-\u036f]/g, ''); // Removes the diacritical marks.
  }

  /**
   * The function sorts an array of Country objects based on their name property.
   * @param {Country} a - The parameter "a" is of type "Country".
   * @param {Country} b - The parameter "b" in the above code is a variable of type "Country". It is
   * used to represent the second country object that is being compared in the sorting function.
   * @returns The sortData function returns -1 if the name of country a is less than the name of
   * country b, 1 if the name of country a is greater than the name of country b, and 0 if the names
   * are equal.
   */
  private sortData(a: Country, b: Country): number {
    if (a.name < b.name) {
      return -1;
    }
    if (a.name > b.name) {
      return 1;
    }
    return 0;
  }
}
