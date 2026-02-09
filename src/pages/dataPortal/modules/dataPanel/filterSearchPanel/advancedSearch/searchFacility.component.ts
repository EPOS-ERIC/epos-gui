import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { OnAttachDetach } from 'decorators/onAttachDetach.decorator';
import { Subscription } from 'rxjs';
import { Model } from 'services/model/model.service';
import { SimpleDiscoverRequest } from 'api/webApi/data/impl/simpleDiscoverRequest';
import { DiscoverRequest } from 'api/webApi/classes/discoverApi.interface';
import { Unsubscriber } from 'decorators/unsubscriber.decorator';
import { SimpleTemporalRange } from 'api/webApi/data/impl/simpleTemporalRange';
import { MapInteractionService } from 'utility/eposLeaflet/services/mapInteraction.service';
import { LoadingService } from 'services/loading.service';
import { UntypedFormControl } from '@angular/forms';
import { FacetDisplayItem } from 'api/webApi//data/impl/facetDisplayItem';
import { FacetLeafItem } from 'api/webApi//data/impl/facetLeafItem';
import { FacetParentItem } from 'api/webApi//data/impl/facetParentItem';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { DisplayItemService } from '../services/displayItem.service';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { SearchFacetsComponent } from '../facets/searchFacets.component';
import { PanelsEmitterService } from 'services/panelsEventEmitter.service';
import { SearchService } from '../services/search.service';
import { LandingService } from '../../services/landing.service';
import { MatExpansionPanel } from '@angular/material/expansion';
import { LocalStoragePersister } from 'services/model/persisters/localStoragePersister';
import { LocalStorageVariables } from 'services/model/persisters/localStorageVariables.enum';
import { CONTEXT_RESOURCE } from 'api/api.service.factory';
import { DataSearchConfigurablesServiceResource } from '../../services/dataSearchConfigurables.service';
import { Tracker } from 'utility/tracker/tracker.service';
import { TrackerAction, TrackerCategory } from 'utility/tracker/tracker.enum';
import { MetaDataStatusService } from 'services/metaDataStatus.service';
import { DataSearchService } from 'services/dataSearch.service';


/**
 * This component triggers the search (discover) call out to the webAPI when:
 * - the Search or Clear button is pressed
 * - the spatial bounds attribute of the Model changes
 * - the temporal range attribute of the Model changes
 * It contains the free text html input element and the {@link FacetsComponent},
 * which it monitors for changes in values.
 */
@OnAttachDetach('onAttachComponents')
@Unsubscriber('subscriptions')
@Component({
  selector: 'app-search-facility',
  templateUrl: './searchFacility.component.html',
  styleUrls: ['./searchFacility.component.scss'],
  providers: [DisplayItemService, SearchService],
})
export class SearchFacilityComponent implements OnInit {

  @ViewChild('matInput') matInput: ElementRef<HTMLInputElement>;
  @ViewChild(SearchFacetsComponent) searchFacets: SearchFacetsComponent;
  @ViewChild('filterPanel') filterPanel: MatExpansionPanel;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  public separatorKeysCodes: number[] = [ENTER, COMMA];

  public autoCompleteFormControl = new UntypedFormControl();
  public filteredKeys: Observable<Array<FacetDisplayItem> | null>;

  /** The display objects relating to all of the available facets. */
  public allDisplayItems: null | Array<FacetDisplayItem> = null;

  /** The keywords objects */
  public keywords: null | Array<FacetLeafItem> = null;

  /** Current free-text value. */
  public newText = '';

  /**
   * Whether the "Clear" button should be disabled.
   */
  public clearEnabled = false;

  public typeFilters: string[] = [];

  public listKeyString: string[] = [];

  /** Constant reference for the "keywords" element of the returned facets data. */
  private readonly FACET_KEYWORDS = 'keywords';
  /** Variable for keeping track of subscriptions, which are cleaned up by Unsubscriber */
  private readonly subscriptions: Array<Subscription> = new Array<Subscription>();

  /** Timer used to ensure that the search isn't done too many times in quick succession. */
  private searchTimer: NodeJS.Timeout;

  private metadataStatusModeActive: boolean = false;

  private selectedStatuses: Array<string> = [];

  /** Constructor. */
  public constructor(
    private readonly dataSearchService: SearchService,
    private readonly dataSearchServiceAuth: DataSearchService,
    private landingService: LandingService,
    private readonly model: Model,
    private mapInteractionService: MapInteractionService,
    private loadingService: LoadingService,
    private readonly displayItemService: DisplayItemService,
    private readonly panelsEvent: PanelsEmitterService,
    private readonly configurables: DataSearchConfigurablesServiceResource,
    private readonly localStoragePersister: LocalStoragePersister,
    private readonly tracker: Tracker,
    private readonly metadataStatusService: MetaDataStatusService
  ) {
    this.filteredKeys = this.autoCompleteFormControl.valueChanges.pipe(
      startWith(''),
      map((value: string | null) => (value ? this._filter(value) : [])),
    );
  }

  /**
   * Initialises subscriptions and triggers the initial search for an un-filtered set of results.
   * Monitors page [temporal]{@link Model#DataSearchTemporalRange} and
   * [spatial]{@link Model#dataSearchBounds} parameters,
   * calling {@link #triggerSearchOnTemporalSpatialChange} if they change.
   */
  public ngOnInit(): void {
    this.subscriptions.push(

      this.model.dataSearchTemporalRange.valueObs.subscribe(() => {
        this.triggerAdvancedSearch();
      }),

      this.model.dataSearchBounds.valueObs.subscribe(() => {
        this.triggerAdvancedSearch();
      }),


      this.model.metadataPreviewMode.valueObs.subscribe((active: boolean)=>{
        if(active){
          this.metadataStatusModeActive = true;
        }
        else{
          this.metadataStatusModeActive = false;
        }
      }),
      // using this subscription for startup, page reload, trigger of search call from Header component
      this.model.metadataPreviewModeStatuses.valueObs.subscribe((selectedStatuses: null | Array<string>)=>{
        if(this.metadataStatusModeActive && selectedStatuses !== null ){
          // ADJUST THIS CHECK!!!
          if(selectedStatuses.length === 0){
            this.selectedStatuses = [];
            this.triggerAdvancedSearch();
            return;
          }
          this.selectedStatuses = selectedStatuses as Array<string>;
          // at startup, loggedIn not immediately available, so subscription
          if(this.model.user.get() == null){
            this.model.user.valueObs.subscribe((logged)=>{
              if(logged !== null){
                this.triggerAdvancedSearch();
              }
            });
          }
          // if already loggedIn and just selecting/deselecting statuses
          else{
            this.triggerAdvancedSearch();
          }
        }
        else if(this.metadataStatusModeActive === false){
          this.selectedStatuses = [];
          this.triggerAdvancedSearch();
        }
      }),

      // ----------------------------------------------------------------------------------

      this.landingService.returnToLandingObs.subscribe(() => {
        this.clearClicked();
      }),

      this.displayItemService.allDisplayItemsObs.subscribe(allDisplayItems => {
        this.allDisplayItems = allDisplayItems;
        if (this.keywords === null) {
          this.filterHiddenItems();
        }
      }),
      this.dataSearchService.typeFiltersObs.subscribe(typeFilters => {
        this.typeFilters = typeFilters;
      }),
    );

    if (this.model.dataSearchKeywords.get() !== null) {
      this.listKeyString = this.model.dataSearchKeywords.get();
    }

    this.triggerAdvancedSearch();

    setTimeout(() => {
      if (this.filterPanel !== undefined) {
        this.filterPanel.expanded = this.localStoragePersister.getValue(LocalStorageVariables.LS_CONFIGURABLES, LocalStorageVariables.LS_MAIN_FILTER_EXPANDED) === 'false' ? false : true;
      }
    }, 100);

  }

  /**
   * Called when user performs an action that triggers the search. Updates display before
   * triggering search using {@link #doSearch} function.
   */
  public triggerAdvancedSearch(): void {
    this.loadingService.showLoading(true);

    // disable buttons
    this.clearEnabled = false;
    // reset text
    this.newText = this.listKeyString.toString();

    // if metadata preview mode active and selectedStatuses not empty
    if(this.metadataStatusModeActive === true && this.selectedStatuses.length > 0 && this.model.user.get() !== null){
      this.doSearchWithAuth(SimpleDiscoverRequest.makeFullQuery(
        CONTEXT_RESOURCE,
        this.newText,
        this.model.dataSearchTemporalRange.get(),
        this.model.dataSearchBounds.get(),
        null,
        this.model.dataSearchFacetLeafItems.get(),
        null,
        null,
        this.selectedStatuses
      ));
    }
    else{
      this.doSearch(SimpleDiscoverRequest.makeFullQuery(
        CONTEXT_RESOURCE,
        this.newText,
        this.model.dataSearchTemporalRange.get(),
        this.model.dataSearchBounds.get(),
        null,
        this.model.dataSearchFacetLeafItems.get(),
        null,
        null,
        null
      ));
    }
  }

  public clearTextClicked(): void {
    this.clearFreeText();
    this.triggerAdvancedSearch();
  }

  /**
   * Called to clear free-text and facet selections.
   */
  public clearClicked(): void {
    // clears the current search values and makes another search passing a null
    this.clearFreeText();
    this.model.dataSearchTemporalRange.set(SimpleTemporalRange.makeUnbounded());
    this.mapInteractionService.resetAll();
    this.triggerAdvancedSearch();
    this.landingService.showLanding(true);
  }

  /**
   * Called by attribute directive displayWith (mat-autocomplete)
   */
  public displayLeafItem(item: FacetLeafItem): string {
    return item && item.label ? item.label : '';
  }

  /**
   * The function `addKeyString` adds a trimmed value from a MatChipInputEvent to a list, clears the
   * input value, resets a form control, and triggers a search function.
   * @param {MatChipInputEvent} event - The `event` parameter in the `addKeyString` function is of type
   * `MatChipInputEvent`. It is an event object that is triggered when a user interacts with a material
   * chip input component.
   */
  public addKeyString(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    if (value) {
      this.listKeyString.push(value);
    }

    // Clear the input value
    event.chipInput!.clear();

    this.autoCompleteFormControl.setValue(null);

    this.searchByFreeTextSearch();
  }

  /**
   * The function `removeKeyString` removes a specified key from a list, updates the data search
   * keywords, triggers an advanced search, and indicates that something has changed.
   * @param {string} key - The `key` parameter in the `removeKeyString` function is a string that
   * represents the key to be removed from the `listKeyString` array.
   */
  public removeKeyString(key: string): void {
    const index = this.listKeyString.indexOf(key);

    if (index >= 0) {
      this.listKeyString.splice(index, 1);
    }

    this.model.dataSearchKeywords.set(this.listKeyString);

    this.triggerAdvancedSearch();
    this.somethingChanged();
  }

  /**
   * The selectedKey function adds the selected option to a list, clears the input field, resets the
   * autocomplete control, and triggers a search using free text.
   * @param {MatAutocompleteSelectedEvent} event - The `event` parameter in the `selectedKey` function
   * is of type `MatAutocompleteSelectedEvent`. This parameter contains information about the option
   * that was selected in the autocomplete dropdown.
   */
  public selectedKey(event: MatAutocompleteSelectedEvent): void {
    this.listKeyString.push(event.option.viewValue);
    this.matInput.nativeElement.value = '';
    this.autoCompleteFormControl.setValue(null);

    this.searchByFreeTextSearch();
  }

  /**
   * The function `removeFilter` takes a filter string as input and performs specific actions based on
   * the filter type.
   * @param {string} filter - The `filter` parameter in the `removeFilter` function is a string that
   * specifies the type of filter to be removed. It can have one of the following values:
   * `FILTER_TEMPORAL`, `FILTER_SPATIAL`, `FILTER_ORGANIZATION`, or `FILTER_TYPE`.
   */
  public removeFilter(filter: string): void {
    switch (filter) {
      case SearchService.FILTER_TEMPORAL:
        this.searchFacets.clearTemporal();
        this.localStoragePersister.set(LocalStorageVariables.LS_CONFIGURABLES, null, false, LocalStorageVariables.LS_DATA_SEARCH_TEMPORAL_RANGE_RADIO_FILTER);
        break;
      case SearchService.FILTER_SPATIAL:
        this.searchFacets.resetGeolocation();
        break;
      case SearchService.FILTER_ORGANIZATION:
        this.searchFacets.organisationsClear();
        break;
      case SearchService.FILTER_TYPE:
        this.searchFacets.typesClear(new Event(''));
        break;
    }
  }

  public toggleFilterPanel(): void {
    this.localStoragePersister.set(LocalStorageVariables.LS_CONFIGURABLES, JSON.stringify(this.filterPanel.expanded), false, LocalStorageVariables.LS_MAIN_FILTER_EXPANDED);
    this.panelsEvent.dataPanelToggle();
  }

  public handleFilterEnter(filterPanel: MatExpansionPanel): void {
    filterPanel.close();
  }

  public handleFreeTextEnter(filterPanel: MatExpansionPanel): void {
    this.configurables.clearPinned();
    filterPanel.open();
    this.panelsEvent.setTogglePanelRef(filterPanel); // eslint-disable-line
  }

  /**
   * The function `searchByFreeTextSearch` sets search keywords, tracks a search event, triggers
   * advanced search, and calls `somethingChanged`.
   */
  private searchByFreeTextSearch(): void {
    this.model.dataSearchKeywords.set(this.listKeyString);

    this.tracker.trackEvent(TrackerCategory.SEARCH, TrackerAction.FREE_TEXT_SEARCH, this.listKeyString.toString());

    this.triggerAdvancedSearch();
    this.somethingChanged();
  }

  /**
   * Called to filter value on mat-autocomplete input
   */
  private _filter(value: FacetLeafItem | string): null | Array<FacetDisplayItem> {

    if (value === '') {
      return this.keywords;
    }

    const filterValue = value instanceof FacetLeafItem ? value.label : value;

    return this.keywords !== null ? this.keywords.filter(
      option => option.label.toLowerCase().includes(filterValue.toLowerCase())
    ) : [];
  }

  /**
   * Triggers a search.  Uses the {@link #searchTimer} to ensure not called too often.
   * @param request An object containing the search parameters.
   */
  private doSearch(request: DiscoverRequest): void {
    // Ensure not called too many times in succession on init
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      void this.dataSearchService.search(request).then(() => {
        this.somethingChanged();
      });
    }, 100);
  }
  /**
   * Triggers a search. It differs from the 'doSearch' in which the request includes the Authorization-header.
   * Uses the {@link #searchTimer} to ensure not called too often.
   * @param request An object containing the search parameters.
   */
  private doSearchWithAuth(request: DiscoverRequest): void {
    // Ensure not called too many times in succession on init
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      void this.dataSearchServiceAuth.doSearch(request).then(() => {
        this.somethingChanged();
      });
    }, 100);
  }

  private clearFreeText(): void {
    this.newText = '';
    this.listKeyString = [];
    this.autoCompleteFormControl.setValue(this.newText);
  }

  /**
   * Called to reevaluate the status of the variables that control the enabling/disabling of
   * search/clear/undo buttons.
   */
  private somethingChanged(): void {
    this.clearEnabled = (0
      || (this.newText !== '')
      || this.mapInteractionService.mapBBox.get().isBounded()
      || !this.model.dataSearchTemporalRange.get().isUnbounded()
      || this.typeFilters.length > 0
    );
  }

  /**
 * Filtering the {@link #keywords} variable based on its collapsed/hidden status.
 */
  private filterHiddenItems(): void {
    let shownDisplayItems: null | Array<FacetDisplayItem> = null;
    shownDisplayItems = (this.allDisplayItems == null)
      ? null
      : this.allDisplayItems.filter((item: FacetDisplayItem) => (!item.isHidden));

    if (shownDisplayItems != null) {
      shownDisplayItems.forEach((item: FacetDisplayItem) => {
        if (null != item && item.id === this.FACET_KEYWORDS) {
          const parentItem = item as FacetParentItem;
          this.keywords = parentItem.children as Array<FacetLeafItem>;
        }
      });
    }
  }

}
