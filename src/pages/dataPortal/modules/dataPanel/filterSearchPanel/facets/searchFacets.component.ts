import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { Subscription, BehaviorSubject, Subject } from 'rxjs';
import { Model } from 'services/model/model.service';
import { Facet } from 'api/webApi/data/facet.interface';
import { Unsubscriber } from 'decorators/unsubscriber.decorator';
import { UntypedFormControl } from '@angular/forms';
import { SimpleBoundingBox } from 'api/webApi/data/impl/simpleBoundingBox';
import { BoundingBox } from 'api/webApi/data/boundingBox.interface';
import { TemporalRange } from 'api/webApi/data/temporalRange.interface';
import { SimpleTemporalRange } from 'api/webApi/data/impl/simpleTemporalRange';
import { MapInteractionService } from 'utility/eposLeaflet/services/mapInteraction.service';
import { Countries, Country } from 'assets/data/countries';
import { FacetDisplayItem } from 'api/webApi//data/impl/facetDisplayItem';
import { FacetLeafItem } from 'api/webApi//data/impl/facetLeafItem';
import { FacetParentItem } from 'api/webApi//data/impl/facetParentItem';
import { DisplayItemService } from '../services/displayItem.service';
import { BoundingBox as BBEpos } from 'utility/eposLeaflet/eposLeaflet';
import { MatOption } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';
import { TemporalControlsComponent } from 'pages/dataPortal/modules/temporalSpatialControls/temporalControls/temporalControls.component';
import { RadioTempRangeFilterService } from 'services/radioTempRangeFilter.service';
import { TourService } from 'services/tour.service';
import { ViewType } from 'api/webApi/data/viewType.enum';
import { SearchService } from '../services/search.service';
import { DataSearchService } from 'services/dataSearch.service';
import { Organization } from 'api/webApi/data/organization.interface';
import { FacetLeafItemMI } from 'services/model/modelItems/facetLeafItemMI';
import { CONTEXT_RESOURCE } from 'api/api.service.factory';
import { Tracker } from 'utility/tracker/tracker.service';
import { TrackerAction, TrackerCategory } from 'utility/tracker/tracker.enum';
import { Popover } from 'driver.js';

/**
 * This component displays the facet panel and when a user changes their selection,
 * it notifies the parent component ({@link AdvancedSeachPanelComponent}).
 *
 * TODO: the {@link ItemsDisplayTableComponent} and the {@link FacetsComponent} have many
 * similarities. Maybe we can extract common functionality.
 */
@Component({
  selector: 'app-data-facets',
  templateUrl: './searchFacets.component.html',
  styleUrls: ['./searchFacets.component.scss']
})
@Unsubscriber('subscriptions')
export class SearchFacetsComponent implements OnInit {

  public static readonly SELECT_TYPE_GEOLOCATION = 'geolocation';
  public static readonly SELECT_TYPE_COORDINATES = 'coordinates';

  /**
   * Whether the "Clear" button should be disabled.
   */
  @Input() public clearEnabled: boolean;

  @Output() public applyEmit = new EventEmitter<void>();
  @Output() public clearEmit = new EventEmitter<void>();

  @ViewChild(TemporalControlsComponent) private temporalControls: TemporalControlsComponent;
  @ViewChild('typesSelect') private typesSelect: MatSelect;

  /** The display objects relating to all of the available facets. */
  public allDisplayItems: null | Array<FacetDisplayItem> = null;

  /** The filtered display objects only including ones that aren't hidden. */
  public shownDisplayItems: null | Array<FacetDisplayItem> = null;

  public temporalRangeSource = new BehaviorSubject<TemporalRange>(SimpleTemporalRange.makeUnbounded());

  public countrySource = new BehaviorSubject<Country | null>(null);
  public countries = Countries;
  public demoCountry: Country = this.countries.find((country: Country) => country.name === 'Italy') as Country;

  /**
   * A variable for recording all of the parent facets that have been collapsed.
   * Used for re-collapsing the facets when the search results change.
   */
  public collapsedFacetIds = new Array<string>();

  // TODO: add comments for below variables.
  public locationRadio = new UntypedFormControl();
  public dataProviders: Array<Organization>;
  public types: Array<string> = [ViewType.MAP, ViewType.TABLE, ViewType.GRAPH];
  public selectedOrganisations: Array<FacetLeafItem> = [];
  public selectedTypes: Array<string> = [];
  public locationRadioSelect = SearchFacetsComponent.SELECT_TYPE_COORDINATES;
  public countrySelected: Country | null;
  public bBoxFromModel: BoundingBox;
  public startBBoxSource = new Subject<void>();

  public organisationsSelected: Array<string> = [];
  public organisationsModel: FacetLeafItemMI;

  public locationRadioSelectTypeCoordinates = SearchFacetsComponent.SELECT_TYPE_COORDINATES;
  public locationRadioSelectTypeGeolocation = SearchFacetsComponent.SELECT_TYPE_GEOLOCATION;

  public searchFacetTypeLabel = SearchService.FILTER_TYPE;

  public numberTypeSelected = 0;

  /** Variable for keeping track of subscriptions, which are cleaned up by Unsubscriber */
  private readonly subscriptions: Array<Subscription> = new Array<Subscription>();

  /** Constructor. */
  constructor(
    public tourService: TourService,
    private readonly displayItemService: DisplayItemService,
    private readonly model: Model,
    private mapInteractionService: MapInteractionService,
    private readonly dataSearchService: DataSearchService,
    private readonly tracker: Tracker,
    private readonly radioTempFilterService: RadioTempRangeFilterService
  ) {
    this.countrySelected = null;
    this.organisationsModel = this.model.dataSearchFacetLeafItems;
  }

  /**
   * Initialises subscriptions to monitor changes on:
   * - the search results in the {@link Model#DataDiscoverResponse}
   * - the internal {@link #facetsSource}
   */
  public ngOnInit(): void {
    this.subscriptions.push(
      this.model.dataDiscoverResponse.valueObs.subscribe(() => {
        this.updateDisplay();
        this.displayItemService.updateDisplayItems(this.allDisplayItems);
      }),
      this.model.dataSearchBounds.valueObs.subscribe((bbox: BoundingBox) => {
        this.bBoxFromModel = bbox;
        bbox.setId(CONTEXT_RESOURCE);
        this.mapInteractionService.spatialRange.set(bbox);
      }),
      this.countrySource.subscribe((country: Country) => {

        if (country !== null && country !== this.model.dataSearchGeolocation.get()) {
          this.model.dataSearchGeolocation.set(country);
        }

      }),
      this.model.dataSearchTemporalRange.valueObs.subscribe((tempRange: TemporalRange) => {
        this.temporalRangeSource.next(tempRange);
      }),
      this.temporalRangeSource.subscribe((tempRange: TemporalRange) => {
        if (tempRange !== this.model.dataSearchTemporalRange.get()) {
          this.model.dataSearchTemporalRange.set(tempRange);
        }
      }),
      this.mapInteractionService.startBBox.observable.subscribe((val: boolean) => {
        if (val) {
          this.clearCountriesSelect();
        }
      }),
      this.mapInteractionService.mapBBox.observable.subscribe((bbox: BoundingBox) => {
        if (this.mapInteractionService.bboxContext.get() === CONTEXT_RESOURCE) {
          this.setBBoxFromControl(bbox);
        }
      }),
      this.tourService.triggerClearFiltersObservable.subscribe(() => this.clearAll()),
      this.model.dataSearchTypeData.valueObs.subscribe((arrayType: Array<string> | null) => {
        if (arrayType !== null) {
          this.selectedTypes = arrayType;
          this.numberTypeSelected = arrayType.length;
        }
      }),

      this.model.dataSearchFacetLeafItems.valueObs.subscribe((arrayDataProviders: Array<string>) => {
        if (arrayDataProviders !== null) {
          this.organisationsSelected = arrayDataProviders;
        }
      })

    );

    if (this.model.dataSearchGeolocation.get() !== null) {
      this.locationRadioSelect = SearchFacetsComponent.SELECT_TYPE_GEOLOCATION;
      this.countrySelected = this.model.dataSearchGeolocation.get();
    }

    void this.dataSearchService.getOrganizations('dataproviders%2Cserviceproviders').then(r => {
      this.dataProviders = r;
    });
  }

  public dataProviderSelected(listDataProvider: Array<string>): void {
    this.model.dataSearchFacetLeafItems.set(listDataProvider);
    this.triggerAdvancedSearch();
  }


  /**
   * The function "organisationsClear" clears the dataSearchFacetLeafItems array and triggers an
   * advanced search.
   */
  public organisationsClear(): void {
    this.model.dataSearchFacetLeafItems.set([]);
    this.triggerAdvancedSearch();
  }


  public typesToggleSelected(eventOpen: boolean, selectedTypes: Array<string> = []): void {

    // only when close select options
    if (!eventOpen) {

      const items = selectedTypes.length === 0 ? this.selectedTypes : selectedTypes;

      this.numberTypeSelected = items.length;

      this.model.dataSearchTypeData.set(items);

      if (items.length > 0) {
        this.tracker.trackEvent(TrackerCategory.SEARCH, TrackerAction.DATA_VISUALIZATION, items.join(','));
      }

      this.applyEmit.next();

    }

  }

  /**
   * When the user clicks the "Clear" button, the facet is cleared.
   * @param {Event} event - Event - The event that triggered the function.
   * @returns None
   */
  public typesClear(event: Event): void {
    this.typesSelect.options.forEach((item: MatOption) => item.deselect());
    this.typesToggleSelected(false);
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
      this.setBBoxFromControl(bbox, true, false);

      // center map on bounding box
      this.mapInteractionService.centerMapOnBoundingBox(bbox);

      this.countrySelected = country;

      this.countrySource.next(country);

      if (this.tourService.isActive() === false) {
        this.tracker.trackEvent(TrackerCategory.SEARCH, TrackerAction.SELECT_COUNTRY, country.name);
      }

    }

  }

  /**
   * The function `setBBoxFromControl` sets the bounding box based on user input, with an option to
   * track the action.
   * @param {BoundingBox} bbox - The `bbox` parameter is of type BoundingBox and represents the
   * bounding box that will be used to set the spatial range for a control.
   * @param [force=false] - The `force` parameter in the `setBBoxFromControl` method is a boolean
   * parameter that determines whether to force the update of the bounding box even if it is not
   * bounded. If `force` is set to `true`, the bounding box will be updated regardless of whether it is
   * bounded or
   * @param [track=true] - The `track` parameter in the `setBBoxFromControl` method is a boolean flag
   * that determines whether to track an event using a tracker service. If `track` is set to `true`, an
   * event related to the search category and drawing a bounding box action will be tracked. If `
   */
  public setBBoxFromControl(bbox: BoundingBox, force = false, track = true): void {
    if (this.mapInteractionService.bboxContext.get() === CONTEXT_RESOURCE) {
      this.mapInteractionService.setBoundingBoxSpatialRangeFromControl(bbox, force);
      if (bbox.isBounded() || force) {
        this.model.dataSearchBounds.set(bbox);
        if (track) {
          this.tracker.trackEvent(TrackerCategory.SEARCH, TrackerAction.DRAW_BBOX, bbox.asArrayFormat('nswe').join(Tracker.TARCKER_DATA_SEPARATION));
        }
      }
    }
  }

  public setEditableBBoxFromControl(bbox: BoundingBox): void {
    this.mapInteractionService.editableSpatialRange.set(bbox);
  }

  /**
   * It clears all the values in the form.
   * @returns None
   */
  public clearAll(): void {
    this.model.dataSearchKeywords.set([]);
    this.locationRadioSelect = SearchFacetsComponent.SELECT_TYPE_COORDINATES;
    this.countrySelected = null;
    this.setBBoxFromControl(SimpleBoundingBox.makeUnbounded(), true, false);
    this.model.dataSearchGeolocation.set(null);
    this.model.dataSearchFacetLeafItems.set([]);
    this.model.dataSearchTypeData.set([]);
    this.selectedTypes = [];
    this.radioTempFilterService.setTempRadioFilter(null);
    this.clearEmit.next();
  }

  public resetGeolocation(): void {
    this.clearCountriesSelect();
    this.setBBoxFromControl(SimpleBoundingBox.makeUnbounded(), true, false);
    this.model.dataSearchGeolocation.set(null);
    this.triggerAdvancedSearch();
  }

  public clearCountriesSelect(): void {
    this.countrySelected = null;
    this.model.dataSearchGeolocation.set(null);
  }

  public clearTemporal(): void {
    this.temporalControls.datePickerClearClick(new Event(''));
  }

  public triggerAdvancedSearch(): void {
    this.applyEmit.next();
  }

  public geolocationHighlight(): void {
    const holdingdiv = document.createElement('div') as HTMLElement;
    const boundingBox = document.getElementsByClassName('leaflet-interactive').item(0) as HTMLElement;
    const tourName = 'EPOS Overview';
    // add overlay Pane
    this.mapInteractionService.setOverlayPane(true);
    const options: Popover = {
      title: `<span class="tour-title"><strong>Tour:</strong> ${tourName}</span>Bounding Box`,
      description: 'This is the bounding box.',
      side: 'right',
    };
    if (null != boundingBox) {
      this.tourService.addStep(tourName, boundingBox, options, 3, true);
    } else {
      // holding step - replaced by step over bounding box.
      this.tourService.addStep(tourName, holdingdiv, options, 3);
    }
  }

  /**
   * Called when the source facets or the selections are changed.  Creates the
   * {@link FacetDisplayItem}s taking into account selections, collapsing etc.
   */
  private updateDisplay() {
    const discoverResponse = this.model.dataDiscoverResponse.get();
    let currentProgressArray: null | Array<FacetDisplayItem> = null;

    if (discoverResponse != null) {
      const facets = discoverResponse.filters();

      // Moved outside of below if statement as otherwise might not have been initialised.
      // Seems to not have an adverse affect.
      currentProgressArray = new Array<FacetDisplayItem>();
      if (facets != null) {
        facets.roots().forEach((root: Facet<void>) => {
          this.recursiveDisplayItemCreator(root, currentProgressArray!);
        });
      }

      // restore collapsed status
      this.collapsedFacetIds.forEach((collapsedItemId: string) => {
        const item = currentProgressArray!.find((thisItem: FacetDisplayItem) => (thisItem.id === collapsedItemId));
        if ((item != null) && (item instanceof FacetParentItem)) {
          item.setCollapsed(true);
        }
      });
    }
    this.allDisplayItems = currentProgressArray;

  }

  /**
   * Recursively iterates over the facets and creates corresponding appropriate
   * {@link FacetDisplayItem}s.
   * @param facet Reference facet to iterate over.
   * @param currentProgressArray Current array of previously created FacetDisplayItems.
   * @param currentDepth Current depth of iteration.
   */
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

    facet.getChildren().forEach((child: Facet<void>) => {
      let childItem: FacetDisplayItem;
      if (child.hasChildren()) {
        childItem = this.recursiveDisplayItemCreator(child, currentProgressArray, currentDepth + 1);
      } else {
        childItem = new FacetLeafItem(
          currentDepth + 1,
          child.getIdentifier(),
          child.getName(),
          false,
        );
        currentProgressArray.push(childItem);
      }
      parentItem.addChild(childItem);
    });
    return parentItem;
  }

}
