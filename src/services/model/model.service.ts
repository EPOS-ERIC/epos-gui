import { Injectable } from '@angular/core';
import { ModelBase } from './modelBase.abstract';
import { ModelItem } from './modelItems/modelItem';
import { LocalStoragePersister } from './persisters/localStoragePersister';
import { ItemSummary } from 'api/webApi/data/itemSummary.interface';
import { BoundingBox } from 'api/webApi/data/boundingBox.interface';
import { UserMI } from './modelItems/userMI';
import { DiscoverResponse } from 'api/webApi/classes/discoverApi.interface';
import { SimpleBoundingBox } from 'api/webApi/data/impl/simpleBoundingBox';
import { TemporalRangeMI } from './modelItems/temporalRangeMI';
import { DomainMI } from './modelItems/domainMI';
import { DataSearchConfigurablesMI } from 'services/model/modelItems/dataSearchConfigurablesMI';
import { KeywordsMI } from './modelItems/keywordsMI';
import { CountryMI } from './modelItems/countryMI';
import { FacetLeafItemMI } from './modelItems/facetLeafItemMI';
import { TypeDataMI } from './modelItems/typeDataMI';
import { MetadataPreviewModeMI } from './modelItems/metadataPreviewModeMI';
import { LocalStorageVariables } from './persisters/localStorageVariables.enum';
import { CONTEXT_FACILITY, CONTEXT_RESOURCE, CONTEXT_SOFTWARE } from 'api/api.service.factory';
import { MetadataPreviewModeStatusesMI } from './modelItems/metadataPreviewModeStatusesMI';

/**
 * The model service is a globally accessible single point of truth.  It is a wrapper for
 * {@link ModelItem}s, which are publicly accessible, updatable data objects that are
 * instances of the {@link ModelItem} class.
 *
 * In order to keep this class simple, this extends the {@link ModelBase} class, where most of
 * the functionality is defined.
 *
 * NOTE: The infrastructure page is currently not available, so although referenced, the
 * infrastructure variables are not really used and are likely to be removed/changed with the
 * infrastructure page code in the near future.
 *
 * @example
 * public aSimpleExampleValue = new ModelItem<string>()
 * .setDefaultValueFunction(() => Promise.resolve('sausage'))
 * .setPersistable();
 */
@Injectable()
export class Model extends ModelBase {

  /**
   * A {@link UserMI} for accessing the current authenticated {@link AAAIUser}.
   */
  public user = new UserMI();

  /**
   * A {@link ModelItem} for accessing the current {@link BoundingBox} selected on
   * the data search page.
   * Item is persisted.
   */
  public dataSearchBounds = ModelItem.make<BoundingBox>(SimpleBoundingBox.makeUnbounded())
    .setPersistFunctions(
      (modelItem: ModelItem<BoundingBox>) => (!modelItem.get().isBounded())
        ? null
        : modelItem.get().asArray(),
      (modelItem: ModelItem<BoundingBox>, value: null | [number, number, number, number]) => {
        return Promise.resolve((value == null)
          ? SimpleBoundingBox.makeUnbounded()
          : SimpleBoundingBox.makeFromArray(value));
      })
    .setPersistableOnConfigurables(true);

  /** The line `public dataSearchGeolocation = new CountryMI();` is creating a public property named
  `dataSearchGeolocation` in the `Model` class and initializing it with a new instance of the
  `CountryMI` class. This property is used for accessing the current geolocation selected on the
  data search page. */
  public dataSearchGeolocation = new CountryMI();

  /** The line `public dataSearchFacetLeafItems = new FacetLeafItemMI();` is creating a public property
  named `dataSearchFacetLeafItems` in the `Model` class and initializing it with a new instance of
  the `FacetLeafItemMI` class. This property is used for accessing the current facet leaf items
  selected on the data search page. */
  public dataSearchFacetLeafItems = new FacetLeafItemMI();

  public dataSearchFacetLeafItemsReg = new FacetLeafItemMI();

  public dataSearchFacilityTypeReg = new FacetLeafItemMI();
  public dataSearchEquipmentTypeReg = new FacetLeafItemMI();

  /** The line `public dataSearchTypeData = new TypeDataMI();` is creating a public property named
  `dataSearchTypeData` in the `Model` class and initializing it with a new instance of the
  `TypeDataMI` class. This property is used for accessing the current type data selected on the data
  search page. */
  public dataSearchTypeData = new TypeDataMI();

  /**
   * A {@link TemporalRangeMI} for accessing the current {@link TemporalRange} selected on
   * the data search page.
   */
  public dataSearchTemporalRange = new TemporalRangeMI(true);

  /**
 * A {@link KeywordsMI} for accessing the current {@link Array<string>} selected on
 * the data search page.
 */
  public dataSearchKeywords = new KeywordsMI();

  /**
  * A {@link KeywordsMI} for accessing the current {@link Array<string>} selected on
  * the data search page.
  */
  public dataSearchKeywordsReg = new KeywordsMI();

  public dataSearchBoundsReg = ModelItem.make<BoundingBox>(SimpleBoundingBox.makeUnbounded())
    .setPersistFunctions(
      (modelItem: ModelItem<BoundingBox>) => (!modelItem.get().isBounded())
        ? null
        : modelItem.get().asArray(),
      (modelItem: ModelItem<BoundingBox>, value: null | [number, number, number, number]) => {
        return Promise.resolve((value == null)
          ? SimpleBoundingBox.makeUnbounded()
          : SimpleBoundingBox.makeFromArray(value));
      })
    .setPersistableOnConfigurables(true);

  public dataSearchGeolocationReg = new CountryMI();

  /**
   * A {@link ModelItem} for accessing the current {@link DiscoverResponse} on
   * the data search page.
   */
  public dataDiscoverResponse = ModelItem.makeNullable<DiscoverResponse>();

  public dataDiscoverResponseReg = ModelItem.makeNullable<DiscoverResponse>();

  /**
   * A {@link DataSearchConfigurablesMI} for accessing the current array of
   * {@link DataConfigurableDataSearch} items on the data search page.
   */
  public dataSearchConfigurables = new DataSearchConfigurablesMI();
  public dataSearchConfigurablesReg = new DataSearchConfigurablesMI();

  /** The line `public domainMI = new DomainMI();` is creating a public property named `domainMI` in the
  `Model` class and initializing it with a new instance of the `DomainMI` class. This property is
  used for accessing the current domain selected on the data search page. */
  public domainMI = new DomainMI();
  public domainMIReg = new DomainMI();

  public dataDiscoverResponseSoft = ModelItem.makeNullable<DiscoverResponse>();
  public dataSearchConfigurablesSoft = new DataSearchConfigurablesMI();
  public domainMISoft = new DomainMI();
  public dataSearchKeywordsSoft = new KeywordsMI();
  public dataSearchFacetLeafItemsSoft = new FacetLeafItemMI();
  public dataSearchBoundsSoft = ModelItem.make<BoundingBox>(SimpleBoundingBox.makeUnbounded())
    .setPersistFunctions(
      (modelItem: ModelItem<BoundingBox>) => (!modelItem.get().isBounded())
        ? null
        : modelItem.get().asArray(),
      (modelItem: ModelItem<BoundingBox>, value: null | [number, number, number, number]) => {
        return Promise.resolve((value == null)
          ? SimpleBoundingBox.makeUnbounded()
          : SimpleBoundingBox.makeFromArray(value));
      })
    .setPersistableOnConfigurables(true);
  public dataSearchTemporalRangeSoft = new TemporalRangeMI(true);
  public dataSearchTypeDataSoft = new TypeDataMI();
  public dataSearchGeolocationSoft = new CountryMI();

  /**
   * An array of four numbers representing the (n,e,s,w) bounds of the bounding box used
   * on the infrastucture search page.
   */
  public infrastructureSearchBounds = ModelItem.makeNullable<[number, number, number, number]>(); // n,e,s,w

  /**
   * A {@link ModelItem} for accessing the selected {@link ItemSummary} item from the
   * infrastructure search page search.
   */
  public infrastructureSearchSelectedItem = ModelItem.makeNullable<ItemSummary>();


  // START OF Metadata Preview Mode Model Items -----------------------------------------------------
  /**
   * A {@link ModelItem} for accessing the status of Metadata Preview Mode (active or not) and the selected metadata statuses
   * (Selected Statuses still need to be correclty implemented in this model!)
   */
  public metadataPreviewMode = new MetadataPreviewModeMI();

  /**
   * A {@link ModelItem} for accessing the selected statuses of Metadata Preview Mode
   */
  public metadataPreviewModeStatuses = new MetadataPreviewModeStatusesMI();
  // END OF Metadata Preview Mode Model Items ----------------------------------------------------------------------

  /**
   * Initialises the object and sets the persistance to use a {@link LocalStoragePersister} as the
   * mechanism for persisting state.  This is primarily used within the GUI to ensure
   * that the state of the GUI is not lost when the page is refreshed or the user logs
   * in (which navigates the browser away from the EPOS GUI).
   */
  constructor() {
    super();
    this.setPersister(new LocalStoragePersister());
    this.init();
  }
}

/** The `modelContextInterface` interface defines the structure of an object that represents a variable
and its corresponding context in the `Model` class. It has two properties: */
export interface modelContextInterface {
  /** The line `variable: string;` is defining a property named `variable` in the
  `modelContextInterface` interface. This property is of type `string`, which means it can hold a
  string value. */
  variable: string;

  /** The `context: string;` property in the `modelContextInterface` interface is defining a property
  named `context` that holds a string value. This property is used to provide additional context or
  information about the variable defined in the `variable` property. It can be used to describe the
  purpose or usage of the variable in the `Model` class. */
  context: string;
}

/** The `modelContext` constant is an array of objects that define the variables used in the `Model`
class and their corresponding context. Each object in the array has two properties: `variable` and
`context`. */
export const modelContext: modelContextInterface[] = [
  {
    variable: LocalStorageVariables.LS_DATA_SEARCH_BOUNDS,
    context: CONTEXT_RESOURCE
  },
  {
    variable: LocalStorageVariables.LS_DATA_SEARCH_GEOLOCATION,
    context: CONTEXT_RESOURCE
  },
  {
    variable: LocalStorageVariables.LS_DATA_SEARCH_CONFIGURABLES,
    context: CONTEXT_RESOURCE
  },
  {
    variable: LocalStorageVariables.LS_DATA_SEARCH_TEMPORAL_RANGE,
    context: CONTEXT_RESOURCE
  },
  {
    variable: LocalStorageVariables.LS_DATA_DISCOVER_RESPONSE,
    context: CONTEXT_RESOURCE
  },
  {
    variable: LocalStorageVariables.LS_DATA_SEARCH_FACET_LEAF_ITEMS,
    context: CONTEXT_RESOURCE
  },
  {
    variable: LocalStorageVariables.LS_DATA_SEARCH_TYPE_DATA,
    context: CONTEXT_RESOURCE
  },
  {
    variable: LocalStorageVariables.LS_DOMAIN,
    context: CONTEXT_RESOURCE
  },
  {
    variable: LocalStorageVariables.LS_DATA_SEARCH_BOUNDS_REG,
    context: CONTEXT_FACILITY
  },
  {
    variable: LocalStorageVariables.LS_DATA_SEARCH_GEOLOCATION_REG,
    context: CONTEXT_FACILITY
  },
  {
    variable: LocalStorageVariables.LS_DATA_SEARCH_CONFIGURABLES_REG,
    context: CONTEXT_FACILITY
  },
  {
    variable: LocalStorageVariables.LS_DATA_SEARCH_TEMPORAL_RANGE,
    context: CONTEXT_FACILITY
  },
  {
    variable: LocalStorageVariables.LS_DATA_DISCOVER_RESPONSE_REG,
    context: CONTEXT_FACILITY
  },
  {
    variable: LocalStorageVariables.LS_DATA_SEARCH_FACET_LEAF_ITEMS,
    context: CONTEXT_FACILITY
  },
  {
    variable: LocalStorageVariables.LS_DATA_SEARCH_TYPE_DATA,
    context: CONTEXT_FACILITY
  },
  {
    variable: LocalStorageVariables.LS_DOMAIN_REG,
    context: CONTEXT_FACILITY
  },
  {
    variable: LocalStorageVariables.LS_DATA_DISCOVER_RESPONSE_SOFT,
    context: CONTEXT_SOFTWARE
  },
  {
    variable: LocalStorageVariables.LS_DATA_SEARCH_CONFIGURABLES_SOFT,
    context: CONTEXT_SOFTWARE
  },
  {
    variable: LocalStorageVariables.LS_DOMAIN_SOFT,
    context: CONTEXT_SOFTWARE
  },
  {
    variable: LocalStorageVariables.LS_DATA_SEARCH_KEYWORDS_SOFT,
    context: CONTEXT_SOFTWARE
  },
  {
    variable: LocalStorageVariables.LS_DATA_SEARCH_FACET_LEAF_ITEMS_SOFT,
    context: CONTEXT_SOFTWARE
  },
  {
    variable: LocalStorageVariables.LS_DATA_SEARCH_BOUNDS_SOFT,
    context: CONTEXT_SOFTWARE
  },
  {
    variable: LocalStorageVariables.LS_DATA_SEARCH_TEMPORAL_RANGE_SOFT,
    context: CONTEXT_SOFTWARE
  },
  {
    variable: LocalStorageVariables.LS_DATA_SEARCH_TYPE_DATA_SOFT,
    context: CONTEXT_SOFTWARE
  },
  {
    variable: LocalStorageVariables.LS_DATA_SEARCH_GEOLOCATION_SOFT,
    context: CONTEXT_SOFTWARE
  }
];

