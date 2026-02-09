import { Injectable, Injector } from '@angular/core';
import { Model } from 'services/model/model.service';
import { SearchService } from 'services/search.service';
import { DistributionDetails } from 'api/webApi/data/distributionDetails.interface';
import { BoundingBox } from 'api/webApi/data/boundingBox.interface';
import { DiscoverResponse } from 'api/webApi/classes/discoverApi.interface';
import { DataConfigurableDataSearchI } from 'utility/configurablesDataSearch/dataConfigurableDataSearchI.interface';
import { DataSearchConfigurablesService } from 'pages/dataPortal/services/dataSearchConfigurables.service';
import { CONTEXT_FACILITY } from 'api/api.service.factory';
import { DataConfigurableRegistrySearch } from '../utility/configurablesRegistrySearch/dataConfigurableRegistrySearch';
import { LocalStoragePersister } from 'services/model/persisters/localStoragePersister';
import { LocalStorageVariables } from 'services/model/persisters/localStorageVariables.enum';
import { BoundingBox as LeafletBbox } from 'utility/eposLeaflet/eposLeaflet';


@Injectable()
export class DataSearchConfigurablesServiceRegistry extends DataSearchConfigurablesService {

  constructor(
    protected readonly model: Model,
    protected readonly searchService: SearchService,
    protected readonly injector: Injector,
    protected readonly localStoragePersister: LocalStoragePersister,
  ) {

    super(model, searchService, injector, model.dataSearchConfigurablesReg);

    this.configurables.valueObs.subscribe((configurables: Array<DataConfigurableDataSearchI>) => {
      // if something else set the configurables, refresh them to make sure consistent
      if (configurables !== this.previouslySetConfigurables && configurables.length > 0) {
        this.refresh();
      }
    });
    this.model.dataSearchBoundsReg.valueObs.subscribe((bbox: BoundingBox) => {
      this.updateSpatialBounds(bbox);
    });

    this.model.dataDiscoverResponseReg.valueObs.subscribe((discoverResponse: DiscoverResponse) => {
      const selectedItem = this.getSelected();
      if ((selectedItem != null) && (discoverResponse != null)) {
        if (!selectedItem.isPinned()) {
          const results = discoverResponse.results();
          const selectedItemId = selectedItem.id;

          const foundItem = results.getFlatData().find((item) => {
            return (item.getIdentifier() === selectedItemId);
          });

          if (foundItem == null) {
            this.setSelected(null, true);
          }
        }
      }
    });
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
  ): Promise<DataConfigurableRegistrySearch> {
    return this.searchService.getDetailsById(distId, CONTEXT_FACILITY)
      .then((distributionDetails: DistributionDetails) => {
        const paramDefs = distributionDetails.getParameters();

        return new DataConfigurableRegistrySearch(
          this.injector,
          distributionDetails,
          paramDefs.getDefaultParameterValues(),
          this.bBoxOrDefaults(paramDefs, this.model.dataSearchBoundsReg.get()),
        );
      });
  }


  /**
   * This TypeScript function updates linked equipment types for configurable data search objects based
   * on the provided array of equipment types.
   * @param {Array<string> | null} equipmentTypes - The `updateEquipmentTypes` method takes an array of
   * strings as the `equipmentTypes` parameter. This array contains the types of equipment that need to
   * be updated. If `equipmentTypes` is `null`, it means that no equipment types are provided for
   * updating.
   */
  public updateEquipmentTypes(equipmentTypes: Array<string> | null): void {
    this.configurables.get().forEach((configurable: DataConfigurableDataSearchI) => {
      if (configurable instanceof DataConfigurableRegistrySearch) {
        configurable.updateLinkedEquipmentTypesParams(equipmentTypes, false);
      }
    });
  }


  /**
   * The function `setModelVariablesFromConfigurables` sets model variables based on configurable
   * values retrieved from local storage.
   */
  public setModelVariablesFromConfigurables(): void {

    const keywords = this.localStoragePersister.getValue(LocalStorageVariables.LS_CONFIGURABLES, LocalStorageVariables.LS_DATA_SEARCH_KEYWORDS_REG);
    if (keywords && (keywords as Array<string>).length > 0) {
      this.model.dataSearchKeywordsReg.set(keywords as Array<string>, true);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const bbox = this.localStoragePersister.getValue(LocalStorageVariables.LS_CONFIGURABLES, LocalStorageVariables.LS_DATA_SEARCH_BOUNDS_REG);
    if (bbox !== null && Array.isArray(bbox)) {
      try {
        const maxLat = bbox[0] as unknown;
        const maxLon = bbox[1] as unknown;
        const minLat = bbox[2] as unknown;
        const minLon = bbox[3] as unknown;
        const bboxObj = new LeafletBbox(maxLat as number, maxLon as number, minLat as number, minLon as number);
        bboxObj.setId(CONTEXT_FACILITY);
        this.model.dataSearchBoundsReg.set(bboxObj, true);
      } catch (error) {
        console.warn(LocalStorageVariables.LS_DATA_SEARCH_BOUNDS_REG, 'incorrect variable on local storage');
      }
    }

    const organizationData = this.localStoragePersister.getValue(LocalStorageVariables.LS_CONFIGURABLES, LocalStorageVariables.LS_DATA_SEARCH_FACET_LEAF_ITEMS_REG);
    if (organizationData && (organizationData as Array<string>).length > 0) {
      this.model.dataSearchFacetLeafItemsReg.set(organizationData as Array<string>, true);
    }

    const facilityTypeData = this.localStoragePersister.getValue(LocalStorageVariables.LS_CONFIGURABLES, LocalStorageVariables.LS_DATA_SEARCH_FACILITY_TYPE_REG);
    if (facilityTypeData && (facilityTypeData as Array<string>).length > 0) {
      this.model.dataSearchFacilityTypeReg.set(facilityTypeData as Array<string>, true);
    }

    const equipmentTypeData = this.localStoragePersister.getValue(LocalStorageVariables.LS_CONFIGURABLES, LocalStorageVariables.LS_DATA_SEARCH_EQUIPMENT_TYPE_REG);
    if (equipmentTypeData && (equipmentTypeData as Array<string>).length > 0) {
      this.model.dataSearchEquipmentTypeReg.set(equipmentTypeData as Array<string>, true);
    }

  }

}
