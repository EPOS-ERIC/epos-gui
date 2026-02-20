import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { OnAttachDetach } from 'decorators/onAttachDetach.decorator';
import { BehaviorSubject, Subscription } from 'rxjs';
import { Unsubscriber } from 'decorators/unsubscriber.decorator';
import { MapInteractionService } from 'utility/eposLeaflet/services/mapInteraction.service';
import { UntypedFormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { PanelsEmitterService } from 'services/panelsEventEmitter.service';
import { SearchService } from '../services/search.service';
import { MatExpansionPanel } from '@angular/material/expansion';
import { LocalStoragePersister } from 'services/model/persisters/localStoragePersister';
import { LocalStorageVariables } from 'services/model/persisters/localStorageVariables.enum';
import { FacetLeafItem } from 'api/webApi/data/impl/facetLeafItem';
import { FacetDisplayItem } from 'api/webApi/data/impl/facetDisplayItem';
import { Model } from 'services/model/model.service';
import { Country } from 'assets/data/countries';
import { BoundingBox as BBEpos } from 'utility/eposLeaflet/eposLeaflet';
import { BoundingBox } from 'api/webApi/data/boundingBox.interface';
import { SimpleBoundingBox } from 'api/webApi/data/impl/simpleBoundingBox';
import { SimpleDiscoverRequest } from '../../api/webapi/data/impl/simpleDiscoverRequest';
import { DiscoverRequest, DiscoverResponse } from 'api/webApi/classes/discoverApi.interface';
import { Organization } from 'api/webApi/data/organization.interface';
import { Facet } from 'api/webApi/data/facet.interface';
import { FacetParentItem } from 'api/webApi/data/impl/facetParentItem';
import { LoadingServiceRegistry } from '../../services/loading.service';
import { DataSearchConfigurablesServiceRegistry } from '../../services/dataSearchConfigurables.service';
import { CONTEXT_FACILITY } from 'api/api.service.factory';
import { LandingService } from '../../services/landing.service';
import { FacetLeafItemMI } from 'services/model/modelItems/facetLeafItemMI';
import { MetaDataStatusService } from 'services/metaDataStatus.service';


@OnAttachDetach('onAttachComponents')
@Unsubscriber('subscriptions')
@Component({
  selector: 'app-search-facility',
  templateUrl: './searchFacility.component.html',
  styleUrls: ['./searchFacility.component.scss'],
  providers: [SearchService],
})
export class SearchFacilityComponent implements OnInit {

  public static readonly SELECT_TYPE_GEOLOCATION = 'geolocation';
  public static readonly SELECT_TYPE_COORDINATES = 'coordinates';

  @ViewChild('textSearchInput') textSearchInput: ElementRef<HTMLInputElement>;
  @ViewChild('filterPanel') filterPanel: MatExpansionPanel;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  public separatorKeysCodes: number[] = [ENTER, COMMA];

  public autoCompleteFormControl = new UntypedFormControl();
  public filteredKeys: Observable<Array<FacetDisplayItem> | null>;

  public allDisplayItems: null | Array<FacetDisplayItem> = null;
  /** The filtered display objects only including ones that aren't hidden. */
  public shownDisplayItems: null | Array<FacetDisplayItem> = null;


  /** The keywords objects */
  public keywords: null | Array<FacetLeafItem> = null;

  /** The facilityTypes objects */
  public facilityTypes: null | Array<FacetLeafItem> = null;

  /** Current free-text value. */
  public newText = '';

  /**
   * Whether the "Clear" button should be disabled.
   */
  public clearEnabled = false;

  public typeFilters: string[] = [];

  public listKeyString: string[] = [];

  public locationRadioSelect = SearchFacilityComponent.SELECT_TYPE_COORDINATES;
  public locationRadioSelectTypeCoordinates = SearchFacilityComponent.SELECT_TYPE_COORDINATES;
  public locationRadioSelectTypeGeolocation = SearchFacilityComponent.SELECT_TYPE_GEOLOCATION;

  public countrySelected: Country | null = null;
  public countrySource = new BehaviorSubject<Country | null>(null);

  public bBoxFromModel: BoundingBox;

  public dataProviders: Array<Organization>;
  public organisationsSelected: Array<string> = [];
  public organisationsModel: FacetLeafItemMI;

  public facilitiesType: Array<FacetLeafItem>;
  public facilitiesTypeSelected: Array<string> = [];
  public facilitiesModel: FacetLeafItemMI;

  public equipmentType: Array<FacetLeafItem>;
  public equipmentTypeSelected: Array<string> = [];
  public equipmentModel: FacetLeafItemMI;

  public context = CONTEXT_FACILITY;
  private metadataStatusModeActive: boolean = false;
  private selectedStatuses: Array<string> = [];

  /** Constant reference for the "keywords" element of the returned facets data. */
  private readonly FACET_KEYWORDS = 'keywords';
  private readonly FACET_FACILITY_TYPE = 'facilitytypes';
  private readonly FACET_EQUIPMENT_TYPE = 'equipmenttypes';
  /** Variable for keeping track of subscriptions, which are cleaned up by Unsubscriber */
  private readonly subscriptions: Array<Subscription> = new Array<Subscription>();

  /** Timer used to ensure that the search isn't done too many times in quick succession. */
  private searchTimer: NodeJS.Timeout;

  /** Constructor. */
  public constructor(
    private readonly dataSearchService: SearchService,
    private landingService: LandingService,
    private readonly model: Model,
    private mapInteractionService: MapInteractionService,
    private loadingService: LoadingServiceRegistry,
    private readonly panelsEvent: PanelsEmitterService,
    private readonly configurables: DataSearchConfigurablesServiceRegistry,
    private readonly localStoragePersister: LocalStoragePersister,
    private readonly metadataStatusService: MetaDataStatusService
  ) {
    this.filteredKeys = this.autoCompleteFormControl.valueChanges.pipe(
      startWith(''),
      map((value: string | null) => (value ? this._filter(value) : [])),
    );
    this.countrySelected = null;

    this.organisationsModel = this.model.dataSearchFacetLeafItemsReg;
    this.facilitiesModel = this.model.dataSearchFacilityTypeReg;
    this.equipmentModel = this.model.dataSearchEquipmentTypeReg;

  }


  public ngOnInit(): void {

    // get filters from API service
    void this.landingService.getFilters().then((r: DiscoverResponse) => {

      const facets = r.filters();

      const currentProgressArray = new Array<FacetDisplayItem>();
      if (facets != null) {
        facets.roots().forEach((root: Facet<void>) => {
          this.recursiveDisplayItemCreator(root, currentProgressArray!);
        });
      }

      this.allDisplayItems = currentProgressArray;
      this.filterHiddenItems();
    });

    this.subscriptions.push(

      this.model.dataSearchBoundsReg.valueObs.subscribe((bbox: BoundingBox) => {
        bbox.setId(CONTEXT_FACILITY);
        this.bBoxFromModel = bbox;
        this.mapInteractionService.spatialRange.set(bbox);
        this.triggerAdvancedSearch();
      }),

      this.landingService.returnToLandingObs.subscribe(() => {
        this.clearClicked();
      }),

      this.dataSearchService.typeFiltersObs.subscribe(typeFilters => {
        this.typeFilters = typeFilters;
      }),

      this.countrySource.subscribe((country: Country) => {

        if (country !== null && country !== this.model.dataSearchGeolocationReg.get()) {
          this.model.dataSearchGeolocationReg.set(country);
        }

      }),

      this.mapInteractionService.startBBox.observable.subscribe((val: boolean) => {
        if (val) {
          this.clearCountriesSelect();
        }
      }),
      this.mapInteractionService.mapBBox.observable.subscribe((bbox: BoundingBox) => {
        if (this.mapInteractionService.bboxContext.get() === CONTEXT_FACILITY) {
          this.setBBoxFromControl(bbox);
        }
      }),

      this.model.dataSearchFacetLeafItemsReg.valueObs.subscribe((arrayDataProviders: Array<string>) => {
        if (arrayDataProviders !== null) {
          this.organisationsSelected = arrayDataProviders;
        }
      }),

      this.model.dataSearchFacilityTypeReg.valueObs.subscribe((arrayFacilitiesType: Array<string>) => {
        if (arrayFacilitiesType !== null) {
          this.facilitiesTypeSelected = arrayFacilitiesType;
        }
      }),

      this.model.dataSearchEquipmentTypeReg.valueObs.subscribe((arrayEquipmentType: Array<string>) => {
        if (arrayEquipmentType !== null) {
          this.equipmentTypeSelected = arrayEquipmentType;
        }
      }),

      this.model.metadataPreviewMode.valueObs.subscribe((active: boolean) => {
        if (active) {
          this.metadataStatusModeActive = true;
        }
        else {
          this.metadataStatusModeActive = false;
        }
      }),
      // using this subscription for startup, page reload, trigger of search call from Header component
      this.model.metadataPreviewModeStatuses.valueObs.subscribe((selectedStatuses: null | Array<string>) => {
        if (this.metadataStatusModeActive && selectedStatuses !== null) {
          if (selectedStatuses.length === 0) {
            this.selectedStatuses = [];
            this.triggerAdvancedSearch();
            return;
          }
          this.selectedStatuses = selectedStatuses as Array<string>;
          // at startup, loggedIn not immediately available, so subscription
          if (this.model.user.get() == null) {
            this.model.user.valueObs.subscribe((logged) => {
              if (logged !== null) {
                this.triggerAdvancedSearch();
              }
            });
          }
          // if already loggedIn and just selecting/deselecting statuses
          else {
            this.triggerAdvancedSearch();
          }
        }
        else if (this.metadataStatusModeActive === false) {
          this.selectedStatuses = [];
          this.triggerAdvancedSearch();
        }
      }),

    );

    if (this.model.dataSearchKeywordsReg.get() !== null) {
      this.listKeyString = this.model.dataSearchKeywordsReg.get();
    }

    if (this.model.dataSearchGeolocationReg.get() !== null) {
      this.locationRadioSelect = SearchFacilityComponent.SELECT_TYPE_GEOLOCATION;
      this.countrySelected = this.model.dataSearchGeolocationReg.get();
    }

    this.triggerAdvancedSearch();

    setTimeout(() => {
      if (this.filterPanel !== undefined) {
        this.filterPanel.expanded = this.localStoragePersister.getValue(LocalStorageVariables.LS_CONFIGURABLES, LocalStorageVariables.LS_MAIN_FILTER_EXPANDED) === 'false' ? false : true;
      }
    }, 100);

    // Commenting OUT the getOrganizations - facilitiesproviders: temporary BE problem (404)
    /* void this.dataSearchService.getOrganizations('facilitiesproviders').then(r => {
      this.dataProviders = r;
    }); */

  }

  /**
 * Set the country bounding box and center on the map.
 * @param {Country} country - Country
 * @returns None
 */
  public geolocationSelection(country: Country): void {

    if (country.bboxCoordinates !== undefined) {
      // eslint-disable-next-line max-len
      const bbox = new BBEpos(country.bboxCoordinates[3], country.bboxCoordinates[2], country.bboxCoordinates[1], country.bboxCoordinates[0]);
      this.setBBoxFromControl(bbox, true);

      // center map on bounding box
      this.mapInteractionService.centerMapOnBoundingBox(bbox);

      this.countrySelected = country;

      this.countrySource.next(country);

    }

  }

  public setBBoxFromControl(bbox: BoundingBox, force = false): void {
    if (this.mapInteractionService.bboxContext.get() === CONTEXT_FACILITY) {
      this.mapInteractionService.setBoundingBoxSpatialRangeFromControl(bbox, force);
      if (bbox.isBounded() || force) {
        this.model.dataSearchBoundsReg.set(bbox);
      }
    }
  }

  public setEditableBBoxFromControl(bbox: BoundingBox): void {
    this.mapInteractionService.editableSpatialRange.set(bbox);
  }

  public clearCountriesSelect(): void {
    this.countrySelected = null;
    this.model.dataSearchGeolocationReg.set(null);
  }

  public resetGeolocation(): void {
    this.clearCountriesSelect();
    this.setBBoxFromControl(SimpleBoundingBox.makeUnbounded(), true);
    this.model.dataSearchGeolocationReg.set(null);
    this.triggerAdvancedSearch();
  }

  public dataProviderSelected(listDataProvider: Array<string>): void {
    this.model.dataSearchFacetLeafItemsReg.set(listDataProvider);
    this.triggerAdvancedSearch();
  }

  public facilityTypeSelect(selectedIds: Array<string>) {
    this.model.dataSearchFacilityTypeReg.set(selectedIds);
    this.triggerAdvancedSearch();
  }

  public equipmentTypeSelect(selectedIds: Array<string>) {
    const toSave: Array<string> = [];
    this.equipmentType.map((_item: FacetLeafItem) => {
      if (selectedIds.includes(_item.id)) {
        toSave.push(_item.label);
      }
    });
    this.model.dataSearchEquipmentTypeReg.set(toSave);
    this.triggerAdvancedSearch();
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

    setTimeout(() => {
      const listEquipmentType = this.model.dataSearchEquipmentTypeReg.get();
      const equipmentToSearch: Array<string> = [];
      if (listEquipmentType !== null && this.equipmentType !== undefined) {
        this.equipmentType.map((_item: FacetLeafItem) => {
          if (listEquipmentType.includes(_item.label)) {
            equipmentToSearch.push(_item.id);
          }
        });
      }

      // if metadata preview mode active and selectedStatuses not empty
      if (this.metadataStatusModeActive === true && this.selectedStatuses.length > 0 && this.model.user.get() !== null) {
        this.doSearch(SimpleDiscoverRequest.makeFullQuery(
          CONTEXT_FACILITY,
          this.newText,
          this.model.dataSearchBoundsReg.get(),
          null,
          this.model.dataSearchFacetLeafItemsReg.get(),
          this.model.dataSearchFacilityTypeReg.get(),
          equipmentToSearch,
          this.selectedStatuses
        ));
      } else {
        this.doSearch(SimpleDiscoverRequest.makeFullQuery(
          CONTEXT_FACILITY,
          this.newText,
          this.model.dataSearchBoundsReg.get(),
          null,
          this.model.dataSearchFacetLeafItemsReg.get(),
          this.model.dataSearchFacilityTypeReg.get(),
          equipmentToSearch,
        ));
      }

    }, 500);

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

  public addKeyString(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    if (value) {
      this.listKeyString.push(value);
    }

    // Clear the input value
    event.chipInput!.clear();

    this.autoCompleteFormControl.setValue(null);

    this.model.dataSearchKeywordsReg.set(this.listKeyString);

    this.triggerAdvancedSearch();
  }

  public removeKeyString(key: string): void {
    const index = this.listKeyString.indexOf(key);

    if (index >= 0) {
      this.listKeyString.splice(index, 1);
    }

    this.model.dataSearchKeywordsReg.set(this.listKeyString);

    this.triggerAdvancedSearch();
  }

  public selectedKey(event: MatAutocompleteSelectedEvent): void {
    this.listKeyString.push(event.option.viewValue);
    this.textSearchInput.nativeElement.value = '';
    this.autoCompleteFormControl.setValue(null);

    this.model.dataSearchKeywordsReg.set(this.listKeyString);

    this.triggerAdvancedSearch();
  }

  public removeFilter(filter: string): void {
    switch (filter) {
      case SearchService.FILTER_SPATIAL:
        this.resetGeolocation();
        break;
      case SearchService.FILTER_ORGANIZATION:
        this.organisationsClear();
        break;
      case SearchService.FILTER_FACILITY_TYPE:
        this.facilityTypeClear();
        break;
      case SearchService.FILTER_EQUIPMENT_TYPE:
        this.equipmentTypeClear();
        break;
    }
  }


  /**
   * It clears all the values in the form.
   * @returns None
   */
  public clearAll(): void {
    this.model.dataSearchKeywordsReg.set([]);
    this.locationRadioSelect = SearchFacilityComponent.SELECT_TYPE_COORDINATES;
    this.countrySelected = null;
    this.setBBoxFromControl(SimpleBoundingBox.makeUnbounded(), true);
    this.model.dataSearchGeolocationReg.set(null);
    this.model.dataSearchFacetLeafItemsReg.set([]);
    this.model.dataSearchFacilityTypeReg.set([]);
    this.model.dataSearchEquipmentTypeReg.set([]);
    this.triggerAdvancedSearch();
  }

  /**
 * The function "organisationsClear" clears the dataSearchFacetLeafItems array and triggers an
 * advanced search.
 */
  public organisationsClear(): void {
    this.model.dataSearchFacetLeafItemsReg.set([]);
    this.triggerAdvancedSearch();
  }

  public facilityTypeClear(): void {
    this.model.dataSearchFacilityTypeReg.set([]);
    this.triggerAdvancedSearch();
  }

  public equipmentTypeClear(): void {
    this.model.dataSearchEquipmentTypeReg.set([]);
    this.triggerAdvancedSearch();
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

  private clearFreeText(): void {
    this.newText = '';
    this.listKeyString = [];
    this.autoCompleteFormControl.setValue(this.newText);
  }

  private somethingChanged(): void {
    this.clearEnabled = (0
      || (this.newText !== '')
      || this.typeFilters.length > 0
    );
  }

  private recursiveDisplayItemCreator(
    facet: Facet<void>,
    currentProgressArray: Array<FacetDisplayItem>,
    currentDepth = 0,
  ): FacetParentItem {
    const parentItem = new FacetParentItem(
      currentDepth,
      facet.getIdentifier(),
      facet.getName(),
    );
    currentProgressArray.push(parentItem);

    const thisParentsSelectedIds = [];

    facet.getChildren().forEach((child: Facet<void>) => {
      let childItem: FacetDisplayItem;
      if (child.hasChildren()) {
        childItem = this.recursiveDisplayItemCreator(child, currentProgressArray, currentDepth + 1);
      } else {
        childItem = new FacetLeafItem(
          currentDepth + 1,
          child.getIdentifier(),
          child.getName(),
          (thisParentsSelectedIds.find((id: string) => (id === child.getIdentifier())) != null),
        );
        currentProgressArray.push(childItem);
      }
      parentItem.addChild(childItem);
    });
    return parentItem;
  }

  private filterHiddenItems(): void {

    this.shownDisplayItems = (this.allDisplayItems == null)
      ? null
      : this.allDisplayItems.filter((item: FacetDisplayItem) => (!item.isHidden));

    if (this.shownDisplayItems != null) {
      this.shownDisplayItems.forEach((item: FacetDisplayItem) => {

        if (null != item && item.id === this.FACET_KEYWORDS) {
          const parentItem = item as FacetParentItem;
          this.keywords = parentItem.children as Array<FacetLeafItem>;
        }

        if (null != item && item.id === this.FACET_FACILITY_TYPE) {
          const parentItem = item as FacetParentItem;
          this.facilitiesType = parentItem.children as Array<FacetLeafItem>;
        }

        if (null != item && item.id === this.FACET_EQUIPMENT_TYPE) {
          const parentItem = item as FacetParentItem;
          this.equipmentType = parentItem.children as Array<FacetLeafItem>;
        }

      });
    }
  }


}
