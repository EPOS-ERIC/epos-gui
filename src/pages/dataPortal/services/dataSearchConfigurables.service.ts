import { Injectable, Injector } from '@angular/core';
import { Model } from 'services/model/model.service';
import { Observable } from 'rxjs';
import { Style } from 'utility/styler/style';
import { defaultStyles } from 'utility/styler/styler';
import { SearchService } from 'services/search.service';
import { DistributionDetails } from 'api/webApi/data/distributionDetails.interface';
import { BoundingBox } from 'api/webApi/data/boundingBox.interface';
import { TemporalRange } from 'api/webApi/data/temporalRange.interface';
import { ParameterDefinitions } from 'api/webApi/data/parameterDefinitions.interface';
import { DistributionLevel } from 'api/webApi/data/distributionLevel.interface';
import { DataConfigurableDataSearchI } from 'utility/configurablesDataSearch/dataConfigurableDataSearchI.interface';
import { DataSearchConfigurablesMI } from 'services/model/modelItems/dataSearchConfigurablesMI';
import { DataConfigurableDataSearch } from 'utility/configurablesDataSearch/dataConfigurableDataSearch';
import { DataConfigurableDataSearchLoading } from 'utility/configurablesDataSearch/dataConfigurableDataSearchLoading';
import { CONTEXT_RESOURCE } from 'api/api.service.factory';
import { DistributionSummary } from 'api/webApi/data/distributionSummary.interface';
import { DistributionItem } from 'api/webApi/data/distributionItem.interface';
import { Domain } from 'api/webApi/data/domain.interface';
import { ViewType } from 'api/webApi/data/viewType.enum';
import { SimpleDistributionItem } from 'api/webApi/data/impl/simpleDistributionItem';
import { FacetModel } from 'api/webApi/data/facetModel.interface';
import { Facet } from 'api/webApi/data/facet.interface';

@Injectable()
export class DataSearchConfigurablesService {

  // cache of configurables we last set
  protected previouslySetConfigurables: Array<DataConfigurableDataSearchI>;

  private readonly CONTEXT = CONTEXT_RESOURCE;

  private readonly VIEW_TYPE_ENUM = ViewType;
  private data: Array<DistributionItem>;

  constructor(
    protected readonly model: Model,
    protected readonly searchService: SearchService,
    protected readonly injector: Injector,
    protected configurables: DataSearchConfigurablesMI,
  ) {
  }

  /**
   * Get a DataConfigurableDataSearchI by its id
   * @param {string} id - The id of the data search.
   * @returns An object with the following properties:
   */
  public get(id: string): DataConfigurableDataSearchI | null {
    return this.getAll().find((item) => (item.id === id)) ?? null;
  }

  /**
   * The function getAll() returns an array of objects that implement the DataConfigurableDataSearchI
   * interface.
   * @returns An array of objects that implement the `DataConfigurableDataSearchI` interface.
   */
  public getAll(): Array<DataConfigurableDataSearchI> {
    return this.configurables.get();
  }

  /**
   * The function "watchAll" returns an Observable that emits an array of DataConfigurableDataSearchI
   * objects.
   * @returns The method is returning an Observable of an array of objects that implement the
   * DataConfigurableDataSearchI interface.
   */
  public watchAll(): Observable<Array<DataConfigurableDataSearchI>> {
    return this.configurables.valueObs;
  }

  /**
   * The function `replaceOrAdd` replaces an existing object in an array with a new object if it exists,
   * otherwise it adds the new object to the array.
   * @param {DataConfigurableDataSearchI} configurable - The `configurable` parameter is an object of
   * type `DataConfigurableDataSearchI`. It represents the data that needs to be replaced or added.
   * @param [doRefresh=true] - The `doRefresh` parameter is a boolean value that determines whether to
   * trigger a refresh after replacing or adding the configurable. If `doRefresh` is `true`, a refresh
   * will be triggered; if `doRefresh` is `false`, no refresh will be triggered.
   */
  public replaceOrAdd(configurable: DataConfigurableDataSearchI, doRefresh = true): void {
    const confs = this.getAll();
    const foundIndex = confs.findIndex((thisConfigurable: DataConfigurableDataSearchI) => {
      return (configurable.id === thisConfigurable.id);
    });

    // if found replace it
    if (foundIndex > -1) {
      // updated configurable so replace old with new
      confs.splice(foundIndex, 1, configurable);
    } else {
      // just add
      this.getAll().push(configurable);
    }
    this.tryDoRefresh(doRefresh);
  }

  /**
   * The function getAllPinned returns an array of DataConfigurableDataSearch objects that are marked as
   * pinned.
   * @returns The method `getAllPinned` returns an array of `DataConfigurableDataSearch` objects.
   */
  public getAllPinned(): Array<DataConfigurableDataSearch> {
    return this.getAll().filter(item => item.isPinned()) as Array<DataConfigurableDataSearch>;
  }

  /**
   * The function `setPinned` updates the pinned status of a data configuration and optionally refreshes
   * the data.
   * @param {string} id - The id parameter is a string that represents the identifier of the data
   * configuration. It is used to retrieve the configuration from the data source.
   * @param {boolean} pinned - A boolean value indicating whether the item should be pinned or not.
   * @param [doRefresh=true] - The `doRefresh` parameter is a boolean value that determines whether or
   * not to refresh the data after updating the configuration. If `doRefresh` is set to `true`, the data
   * will be refreshed. If it is set to `false`, the data will not be refreshed. By default, the
   * @returns a Promise that resolves to void.
   */
  public setPinned(id: string, pinned: boolean, doRefresh = true): Promise<void> {
    return this.getConfig(id)
      .then((conf: DataConfigurableDataSearchI) => {
        if (conf != null) {
          this.updateConfigurable(conf, pinned, conf.isSelected(), doRefresh);
        }
      });
  }

  public updateLayerBbox(id: string, layerBbox: Array<number>, doRefresh = true): Promise<void> {
    return this.getConfig(id)
      .then((conf: DataConfigurableDataSearchI) => {
        if (conf != null) {
          conf.setLayerBbox(layerBbox);
            this.refresh();
        }
      });
  }
  /**
   * The function `togglePinned` toggles the pinned status of a data configuration and returns a promise
   * that resolves to a boolean indicating whether the configuration is pinned or not.
   * @param {string} id - The `id` parameter is a string that represents the identifier of the data
   * configuration.
   * @param [doRefresh=true] - The `doRefresh` parameter is a boolean value that determines whether or
   * not to refresh the data after toggling the pinned status. If `doRefresh` is set to `true`, the data
   * will be refreshed. If it is set to `false`, the data will not be refreshed.
   * @returns The function `togglePinned` returns a Promise that resolves to a boolean value.
   */
  public togglePinned(id: string, doRefresh = true): Promise<boolean> {
    return this.getConfig(id)
      .then((conf: DataConfigurableDataSearchI) => {
        if (conf != null) {
          this.updateConfigurable(conf, !conf.isPinned(), conf.isSelected(), doRefresh);
        }
        return ((conf != null) && conf.isPinned());
      });
  }

  /**
   * The function checks if an item with a given ID is pinned and returns a boolean value.
   * @param {string} id - A string representing the ID of an item.
   * @returns a boolean value. It returns true if there is an item with the given id in the list of all
   * pinned items, and false otherwise.
   */
  public isPinned(id: string): boolean {
    const pinned = this.getAllPinned().filter(item => item.id === id);
    return pinned.length === 0 ? false : true;
  }

  /**
   * The function `setSelected` checks if the given `id` is different from the currently selected id, and
   * if so, it retrieves the configuration for the new id, ensures that only one item is selected, and
   * optionally refreshes the data.
   * @param {null | string} id - The `id` parameter is of type `null | string`, which means it can either
   * be `null` or a string value. It represents the identifier of the item to be selected.
   * @param [doRefresh=true] - The `doRefresh` parameter is a boolean value that determines whether or
   * not to refresh the data after selecting a new item. If `doRefresh` is `true`, the data will be
   * refreshed; if `doRefresh` is `false`, the data will not be refreshed. By default, `
   */
  public setSelected(id: null | string, doRefresh = true): void {
    const selected = this.getSelected();
    if ((selected == null) || (id !== selected.id)) {

      void this.getConfig(id, true)
        .then(() => {
          const changed = this.ensureOnlyOneSelected(this.getAll(), id);
          this.tryDoRefresh(changed && doRefresh);
        })
        .catch((e) => {

          // remove configurable from list
          const configurables = this.configurables.get();
          configurables.forEach((item, index) => {
            if (item.id === id) {
              configurables.splice(index, 1);
            }
          });
        });
    }

  }

  /**
   * The function returns the first selected item from a list of data items, or null if no item is
   * selected.
   * @returns The method is returning either null or an object that implements the
   * DataConfigurableDataSearchI interface.
   */
  public getSelected(): null | DataConfigurableDataSearchI {
    return this.getAll().find((item) => item.isSelected()) ?? null;
  }

  /**
   * The function checks if a given id is selected and returns a boolean value.
   * @param {string} id - A string representing the ID of an item.
   * @returns a boolean value.
   */
  public isSelected(id: string): boolean {
    const selected = this.getSelected();
    return (selected != null && selected.id === id) ? true : false;
  }

  /**
   * The clearPinned function clears all pinned items and optionally refreshes the data.
   * @param [doRefresh=true] - The `doRefresh` parameter is a boolean value that determines whether to
   * refresh the data after clearing the pinned items. If `doRefresh` is `true`, the data will be
   * refreshed; if `doRefresh` is `false`, the data will not be refreshed.
   */
  public clearPinned(doRefresh = true): void {
    void Promise.all(
      this.getAll()
        .map((item: DataConfigurableDataSearchI) => this.setPinned(item.id, false, false)))
      .then(() => this.tryDoRefresh(doRefresh));
  }

  /**
   * The function updates the spatial bounds of data search configurables based on a given bounding box.
   * @param {BoundingBox} bbox - The parameter "bbox" is of type "BoundingBox".
   */
  public updateSpatialBounds(bbox: BoundingBox): void {
    this.configurables.get().forEach((configurable: DataConfigurableDataSearchI) => {
      if (configurable instanceof DataConfigurableDataSearch) {
        const paramDefs = configurable.getParameterDefinitions();
        configurable.updateLinkedSpatialParams(this.bBoxOrDefaults(paramDefs, bbox), false);
      }
    });
  }

  /**
   * The function updates the temporal range of data search configurables.
   * @param {TemporalRange} tempRange - The `tempRange` parameter is of type `TemporalRange`. It
   * represents a range of time, typically used for filtering or querying data within a specific time
   * period.
   */
  public updateTemporalRange(tempRange: TemporalRange): void {
    this.configurables.get().forEach((configurable: DataConfigurableDataSearchI) => {
      if (configurable instanceof DataConfigurableDataSearch) {
        const paramDefs = configurable.getParameterDefinitions();
        configurable.updateLinkedTemporalParams(this.tempRangeOrDefaults(paramDefs, tempRange), false);
      }
    });
  }

  /**
   * The function `addLevels` takes an `id` and an array of `DistributionLevel` objects, retrieves a
   * `DataConfigurableDataSearchI` object using the `get` method, sets the levels of the object if it
   * exists, and then triggers a refresh.
   * @param {string} id - The `id` parameter is a string that represents the identifier of the data
   * configuration.
   * @param levels - The `levels` parameter is an array of `DistributionLevel` objects.
   */
  public addLevels(id: string, levels: Array<DistributionLevel>): void {
    const conf: DataConfigurableDataSearchI | null = this.get(id);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    conf?.setLevels(levels);
    this.tryDoRefresh(true);
  }

  public addLayerBbox(id: string, coords: Array<number>): void {
    const conf: DataConfigurableDataSearchI | null = this.get(id);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    conf?.setLayerBbox(coords);
    this.tryDoRefresh(true);
  }

  /**
   * The function updates the style of a data search configuration and triggers a refresh.
   * @param {string} id - A string representing the ID of the data to be updated.
   * @param {Style} style - The `style` parameter is of type `Style`. It represents the new style that
   * you want to update for the specified `id`.
   */
  public updateStyle(id: string, style: Style): void {

    const conf: DataConfigurableDataSearchI | null = this.get(id);
    conf?.setStyle(style);
    this.tryDoRefresh(true);
  }

  /**
   * The function creates a configurable data search object based on the distribution details and default
   * parameter values.
   * @param {string} distId - The `distId` parameter is a string that represents the ID of a
   * distribution.
   * @returns A Promise that resolves to a DataConfigurableDataSearch object.
   */
  public createConfigurable(
    distId: string,
  ): Promise<DataConfigurableDataSearch> {
    return this.searchService.getDetailsById(distId, this.CONTEXT)
      .then((distributionDetails: DistributionDetails) => {
        const paramDefs = distributionDetails.getParameters();

        return new DataConfigurableDataSearch(
          this.injector,
          distributionDetails,
          paramDefs.getDefaultParameterValues(),
          this.bBoxOrDefaults(paramDefs, this.model.dataSearchBounds.get()),
          this.tempRangeOrDefaults(paramDefs, this.model.dataSearchTemporalRange.get()),
        );
      });
  }

  /**
   * This TypeScript function retrieves domain information based on a specified level0 value and field.
   * @param domains - The `domains` parameter is an array of `Domain` objects.
   * @param {string} level0 - The `level0` parameter in the `getDomainInfoBy` function is used to
   * specify the value to search for in the `field` property of the `Domain` objects within the
   * `domains` array. The function will return the first `Domain` object that matches the `level0`
   * @param [field=title] - The `field` parameter in the `getDomainInfoBy` function is a string
   * parameter that specifies the field to be used for comparison when searching for a domain in the
   * `domains` array. By default, the value of `field` is set to `'title'`, but it can be overridden
   * @returns The function `getDomainInfoBy` returns a `Domain` object that matches the specified
   * `level0` value in the `domains` array based on the specified `field` (defaulted to 'title'). If a
   * matching domain is found, it is returned; otherwise, an empty `Domain` object with a `code`
   * property is returned.
   */
  public getDomainInfoBy(domains: Array<Domain>, level0: string, field = 'title'): Domain {
    if (domains !== null && domains !== undefined) {
      const domain = domains.find(icon => icon[field] === level0);
      return domain != null ? domain : { code: '' };
    }
    return { code: '' };
  }

  /**
   * The function creates and displays distribution items based on provided facet model, domains, and
   * type filters, including handling favorites and sorting the results.
   * @param {FacetModel<DistributionSummary> | null} distFacetModelSource - The `distFacetModelSource`
   * parameter is a FacetModel that contains DistributionSummary objects or it can be null.
   * @param domains - The `domains` parameter in the `createItemsToDisplay` function is an array of
   * `Domain` objects. It is used as one of the inputs to filter and create the `DistributionItem`
   * objects based on the provided domains.
   * @param filterByType - The `filterByType` parameter in the `createItemsToDisplay` function is an
   * array of strings that is used to filter the items based on their type. It is passed as an argument
   * to the function and is used to determine which items should be included in the final array of
   * `DistributionItem
   * @returns The function `createItemsToDisplay` returns an array of `DistributionItem` objects.
   */
  public createItemsToDisplay(distFacetModelSource: FacetModel<DistributionSummary> | null, domains: Array<Domain>, filterByType: Array<string>): Array<DistributionItem> {
    this.data = new Array<DistributionItem>();
    if (distFacetModelSource != null && domains !== undefined) {

      distFacetModelSource.roots().forEach((root: Facet<DistributionSummary>) => {
        this.recursiveCreateItemsDisplay(root, [], filterByType, domains);
      });

      // add favourites data
      const favourites = this.getAllPinned();

      favourites.forEach((fav: DataConfigurableDataSearch) => {
        const found = this.data.findIndex((d) => { return d.id === fav.id; });

        // not found on results data => add to array
        if (found === -1) {

          // get info levels
          const levels = fav.getLevels();

          // add to result array with info levels
          this.setDistributionItem(
            fav.getDistributionDetails(),
            levels,
            domains
          );

          // exclude item from original section
          const item = this.data.find((i: DistributionItem) => { return i.id === fav.id; });
          if (item !== undefined) {
            item.hideToResult = true;
          }
        }
      });

      // sort data results
      this.data.sort((a, b) => {
        return this.sortData(a, b);
      });
    }
    return this.data;
  }


  /**
   * The function `sortData` compares two `DistributionItem` objects based on their `name` property for
   * sorting.
   * @param {DistributionItem} a - DistributionItem object with a property "name" to compare.
   * @param {DistributionItem} b - b is a DistributionItem object that is being compared to another
   * DistributionItem object (a) based on their name property. The sortData function is sorting these
   * objects alphabetically by their name property.
   * @returns In the provided code snippet, the `sortData` function is a comparison function used for
   * sorting `DistributionItem` objects based on their `name` property.
   */
  public sortData(a: DistributionItem, b: DistributionItem) {
    if (a.name < b.name) {
      return -1;
    }
    if (a.name > b.name) {
      return 1;
    }
    return 0;
  }

  protected bBoxOrDefaults(
    paramDefs: ParameterDefinitions,
    boundingBox: BoundingBox,
  ): BoundingBox {
    if ((null != paramDefs) && (!boundingBox.isBounded())) {
      boundingBox = paramDefs.getSpatialBounds(paramDefs.getDefaultParameterValues());
    }
    return boundingBox;
  }

  protected refresh(): void {
    this.setAll(this.getPinnedOrSelected());
  }

  protected tempRangeOrDefaults(
    paramDefs: ParameterDefinitions,
    tempRange: TemporalRange,
  ): TemporalRange {
    if ((null != paramDefs) && (tempRange.isUnbounded())) {
      tempRange = paramDefs.getTemporalRange(paramDefs.getDefaultParameterValues());
    }
    return tempRange;
  }

  /**
 * This TypeScript function creates a DistributionItem object based on the provided
 * DistributionSummary, DistributionLevels, and Domains.
 * @param {DistributionSummary} dist - The `dist` parameter in the `createDistribution` function
 * represents a `DistributionSummary` object, which contains information about a distribution.
 * @param levels - The `levels` parameter in the `createDistribution` function is an array of
 * `DistributionLevel` objects. Each `DistributionLevel` object likely contains information about a
 * specific level or category within the distribution. The function uses the value of the first level
 * in the array (`levels[0].value`)
 * @param domains - The `domains` parameter in the `createDistribution` function is an array of
 * Domain objects. These Domain objects likely contain information related to the distribution, such
 * as codes, image URLs, and colors. The function uses this information to create a DistributionItem
 * object that represents the distribution with the specified levels and
 * @returns The function `createDistribution` returns a `DistributionItem` object after processing
 * the input parameters `dist`, `levels`, and `domains`. The function constructs a `basicItem` using
 * the provided data and returns it as the output.
 */
  private createDistribution(dist: DistributionSummary, levels: Array<DistributionLevel>, domains: Array<Domain>): DistributionItem {

    const info = this.getDomainInfoBy(domains, levels[0].value);
    const map = dist.isMappable === true ? this.VIEW_TYPE_ENUM.MAP : '';
    const graph = dist.isGraphable === true ? this.VIEW_TYPE_ENUM.GRAPH : '';
    const tab = dist.isTabularable === true ? this.VIEW_TYPE_ENUM.TABLE : '';
    const notViewable = (dist.isMappable === false && dist.isGraphable === false && dist.isTabularable === false) ? 'Not viewable' : '';

    const basicItem = SimpleDistributionItem.make(
      dist.getIdentifier(),
      dist.getIdentifier(),
      dist.getName(),
      info != null ? info.code : '',
      info != null && info.imgUrl !== undefined ? info.imgUrl : '',
      info != null && info.color !== undefined ? info.color : '',
      '',
      [notViewable, map, tab, graph],
      dist.isDownloadable,
      dist,
      this.isPinned(dist.getIdentifier()),
      false,
      [levels],
      dist.getStatus() as number,
      dist.getStatusTimestamp() as string,
      dist.getStatusURL() as string,
      dist.getVersioningStatus(),
      dist.getVersioningInfo() != null ? dist.getVersioningInfo() : null,
      dist.getServiceProvider() != null ? dist.getServiceProvider() : null);

      return basicItem;
  }

  private recursiveCreateItemsDisplay(
    item: Facet<DistributionSummary>,
    levels: Array<DistributionLevel> = [],
    typeFilters: Array<string> | null = [],
    domains: Array<Domain>,
  ): void {

    item.getChildren().forEach((child: Facet<DistributionSummary>) => {

      const level: DistributionLevel = {
        id: levels.length,
        value: child.getName(),
        level: levels.length,
        count: child.getFlatData().length,
        children: [],
        distId: child.getIdentifier(),
      };

      // add level to array (push function cannot be used)
      levels = levels.concat(level);

      this.getData(child, levels, typeFilters, domains);

      if (child.getChildren().length > 0) {
        this.recursiveCreateItemsDisplay(child, levels, typeFilters, domains);
      }

      // remove last elem to array (slice function cannot be used)
      levels = levels.filter((e, i) => i < levels.length - 1);

    });

  }

  private getData(element: Facet<DistributionSummary>, levels: Array<DistributionLevel>, typeFilters: Array<string> | null, domains: Array<Domain>): void {
    element.getData().forEach((dist: DistributionSummary) => {

      let take = true;

      // if only one filter was chosen => OR
      if (null !== typeFilters && typeFilters.length === 1) {

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        take = (dist.isMappable && typeFilters.some(i => i === ViewType.MAP as string))
          || (dist.isGraphable && typeFilters.some(i => i === ViewType.GRAPH as string))
          || (dist.isTabularable && typeFilters.some(i => i === ViewType.TABLE as string));

      } else if (null !== typeFilters && typeFilters.length > 1) {

        if (typeFilters.some(i => i === ViewType.MAP as string)) {
          take = dist.isMappable && take;
        }

        if (typeFilters.some(i => i === ViewType.TABLE as string)) {
          take = dist.isTabularable && take;
        }

        if (typeFilters.some(i => i === ViewType.GRAPH as string)) {
          take = dist.isGraphable && take;
        }
      }

      if (take) {
        this.setDistributionItem(dist, levels, domains);
      }
    });
  }

  private setDistributionItem(dist: DistributionSummary, levels: Array<DistributionLevel>, domains: Array<Domain>): void {
    if (dist != null) {
      try {

        // check if it's already present on this.data
        const updateItem = this.data.find((i: DistributionItem) => { return i.id === dist.getIdentifier(); });

        if (updateItem !== undefined) {

          // add new facets
          updateItem.levels.push(levels);
        } else {
          const basicItem = this.createDistribution(dist, levels, domains);
          this.data.push(basicItem);
        }

      } catch (e) {
        console.warn('error in createItemsDisplay method ', e);
      }
    }
  }



  private setAll(configurables: Array<DataConfigurableDataSearchI>): void {
    this.previouslySetConfigurables = configurables;
    this.configurables.set(configurables);
  }

  private ensureOnlyOneSelected(
    items: Array<DataConfigurableDataSearchI>,
    selectedId: null | string,
  ): boolean {
    let changed = false;
    items.forEach((item: DataConfigurableDataSearchI) => {
      const thisChanged = this.updateConfigurable(
        item,
        item.isPinned(),
        (item.id === selectedId),
        false,
      );
      changed = changed || thisChanged;
    });
    return changed;
  }

  private getConfig(id: null | string, setSelectedLoadingPlaceholder = false): Promise<null | DataConfigurableDataSearchI> {
    let returnPromise = Promise.resolve<null | DataConfigurableDataSearchI>(null);
    if (id != null) {
      const conf = this.get(id);

      if (conf != null) {
        returnPromise = Promise.resolve(conf);
      } else {
        if (setSelectedLoadingPlaceholder) {
          // set a "LOADING" placeholder configurable
          this.getAll().push(new DataConfigurableDataSearchLoading(id));
          this.ensureOnlyOneSelected(this.getAll(), id);
          this.refresh();
        }

        returnPromise = this.createConfigurable(id)
          .then((newConf: DataConfigurableDataSearchI) => {
            if (newConf != null) {
              this.replaceOrAdd(newConf, false);
            }
            return newConf;
          });
      }
    }
    return returnPromise;
  }

  private getPinnedOrSelected(): Array<DataConfigurableDataSearchI> {
    return this.getAll().filter((item) => (item.isPinned() || item.isSelected()));
  }

  private tryDoRefresh(doRefresh: boolean): void {
    if (doRefresh) {
      this.refresh();
    }
  }

  private updateConfigurable(
    conf: DataConfigurableDataSearchI,
    newPinned: boolean,
    newSelected: boolean,
    doRefresh: boolean,
  ): boolean {
    const wasPinned = conf.isPinned();
    const wasSelected = conf.isSelected();

    conf.setPinned(newPinned)
      .setSelected(newSelected);

    if (conf.getStyle() === null) {
      this.ensureStylesAssigned();
    }

    const changed = ((wasPinned !== newPinned) || (wasSelected !== newSelected));
    this.tryDoRefresh(doRefresh && changed);
    return changed;
  }

  private ensureStylesAssigned(): void {
    const configurables = this.getAll();
    configurables.forEach((configurable: DataConfigurableDataSearchI) => {
      const style = configurable.getStyle();

      if (style == null) {

        // get random color by defaultStyles
        const randomPredefinedStyle = defaultStyles[Math.floor(Math.random() * defaultStyles.length)];
        randomPredefinedStyle.setId('styler_default_id_' + configurables.length.toString());

        configurable.setStyle(randomPredefinedStyle);
      }

    });
  }

}
