import { Component, Input } from '@angular/core';
import { BoundingBox } from 'api/webApi/data/boundingBox.interface';
import { ViewType } from 'api/webApi/data/viewType.enum';
import { MapInteractionService } from 'utility/eposLeaflet/services/mapInteraction.service';
import { filter, first, firstValueFrom, skip, Subject } from 'rxjs';
import { DistributionItem } from 'api/webApi/data/distributionItem.interface';
import { DataSearchConfigurablesService } from 'pages/dataPortal/services/dataSearchConfigurables.service';
import { LocalStoragePersister } from 'services/model/persisters/localStoragePersister';
import { LocalStorageVariables } from 'services/model/persisters/localStorageVariables.enum';
import { BoundingBox as LeafletBbox } from 'utility/eposLeaflet/eposLeaflet';
import { DialogService } from 'components/dialog/dialog.service';
import { LeafletLoadingService } from 'utility/eposLeaflet/services/leafletLoading.service';
import { PanelsEmitterService } from 'services/panelsEventEmitter.service';


@Component({
  selector: 'app-visible-on',
  templateUrl: './visibleOn.component.html',
  styleUrls: ['./visibleOn.component.scss'],
  animations: [
  ],
})
export class VisibleOnComponent {

  @Input() item: DistributionItem;
  @Input() configurables: DataSearchConfigurablesService;

  public readonly VIEW_TYPE_ENUM = ViewType;
  public centerMapBBox = new Subject<BoundingBox>();

  public boundsFromGeoJSONData: number[] | null;
  public boundsFromWMSGetCapabilities: number[] | null;

  public dataLeafletObs: boolean = false;

  constructor(
    protected readonly panelsEvent: PanelsEmitterService,
    protected readonly mapInteractionService: MapInteractionService,
    protected readonly leafletLoadingService: LeafletLoadingService,
    protected readonly dialogService: DialogService,
    protected localStoragePersister: LocalStoragePersister,
  ) {
  }


  /**
   * If the selected item is not the same as the item passed in, then select the item and emit the
   * tablePanelToggle event
   * @param {DistributionItem} item - The item that was clicked.
   */
  public tablePanelToggle(item: DistributionItem): void {

    // eslint-disable-next-line prefer-const
    let newSelected = false;

    // if clicked not on the same element. [Note: it will enter in this "if" condition also the first time, when nothing is selected/expanded and the getSelected().id returns "undefined".]
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    if (this.configurables.getSelected()?.id !== item.id) {
      void this.selectItem(item).then(res => {
        newSelected = true;
        this.panelsEvent.tablePanelToggle(item.id, newSelected);
      });
    }else {
      this.panelsEvent.tablePanelToggle(item.id, newSelected);
    }
  }

  /**
   * *This function is used to toggle the right bottom sidenav.*
   * @param {DistributionItem} item - The item that was clicked.
   */
  public graphPanelToggle(item: DistributionItem): void {
    let newSelected = false;
    // if clicked not on the same element.
    // [Note: it will enter in this "if" condition also the first time, when nothing is selected/expanded and the getSelected().id returns "undefined".]
    if (this.configurables.getSelected()?.id !== item.id) {
      console.log('itemId' , item.id);
      void this.selectItem(item).then(res => {
        newSelected = true;
        this.panelsEvent.graphPanelToggle(item.id, newSelected);
      });
    } else {
      this.panelsEvent.graphPanelToggle(item.id, newSelected);
    }
  }

  /**
   * *Center the map on the bounding box of the selected item.*
   *
   * It calls the `selectItem` function to select the item, and then it
   * calls the `centerMapOnBoundingBox` function to center the map on the bounding box of the selected
   * item
   * @param {DistributionItem} item - DistributionItem
   */
  public async centerOnMapOBS(item: DistributionItem): Promise<void> {

    const notShowAgainSwitchDialog = this.localStoragePersister.getValue(LocalStorageVariables.LS_SWITCH_DISTRIBUTION_ITEM_CHECK);

    // -------- INIZIO DRAWN BOUNDING BOX ----------------
    // Drawn Bounding Box
    if(this.localStoragePersister.getValue(LocalStorageVariables.LS_CONFIGURABLES, LocalStorageVariables.LS_DATA_SEARCH_BOUNDS)!== null ){
      // if nothing expanded AND clicked one not pinned
      if(this.configurables.getSelected() == null && !this.configurables.isPinned(item.id)){
        await this.selectItem(item);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const dataLoading = await firstValueFrom(

          this.leafletLoadingService.showLoadingObs.pipe(
            filter((loading: boolean)=> loading !== true),
            skip(1),
            first()
          )
        );
        this.zoomForDrawnBbox();
        return;
      }
      else{
        await this.selectItem(item);
        this.zoomForDrawnBbox();
      }

      // if same element
      if(this.configurables.getSelected()?.id === item.id){
        this.zoomForDrawnBbox();
        return;
      }

      // if switching from an item to another AND current one and target one are not pinned or current one not pinned and new one is AND switchdialogNotShowAgain === false (dialog is going to show)
      if(this.configurables.getSelected()?.id !== item.id && ((!this.configurables.isPinned(this.configurables.getSelected()!.id) && !this.configurables.isPinned(item.id)) || (!this.configurables.isPinned(this.configurables.getSelected()!.id) && this.configurables.isPinned(item.id))) && (notShowAgainSwitchDialog === null || notShowAgainSwitchDialog === 'false')){

        await this.selectItem(item);

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const awaitDialog = await firstValueFrom(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          this.dialogService.getSwitchItemDialogConfirmation().pipe(
            filter(confirmed => confirmed != null )
          )
        );

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const dataLoading = await firstValueFrom(
          this.leafletLoadingService.showLoadingObs.pipe(
            filter((loading: boolean)=> loading !== true),
            skip(1),
            first()
          )
        );
        this.zoomForDrawnBbox();
        return;
      }
      else{
        void this.selectItem(item);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const dataLoading = await firstValueFrom(

          this.leafletLoadingService.showLoadingObs.pipe(
            filter((loading: boolean)=> loading !== true),
            skip(1),
            first()
          )
        );
        this.zoomForDrawnBbox();
      }
      return;
    }

    // -------------INIZIO REGULAR BOUNDING BOX----------------


    // if nothing expanded && clicked one is not pinned
    if(this.configurables.getSelected() === null && !this.configurables.isPinned(item.id)){
      await this.selectItem(item);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const dataLoading = await firstValueFrom(
        this.leafletLoadingService.showLoadingObs.pipe(
          filter((loading: boolean)=> loading !== true),
          skip(1),
          first()
        )
      );

      const LSitem = this.configurables.getAll().find(obj=> obj.id === item.id) ?? null;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      const LSlayerBbox = LSitem ? LSitem.getLayerBbox() : null;

      if(LSitem){
        if(LSlayerBbox && LSlayerBbox !== null){
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          this.zoom(LSlayerBbox);
        }
      }
      else{
        console.log('No LSitem or LayerBbox is NULL');
      }
      return;
    }
    // if nothing expanded AND clicked one is pinned
    else if(this.configurables.getSelected() === null && this.configurables.isPinned(item.id)){
      await this.selectItem(item);

      const LSitem = this.configurables.getAll().find(obj=> obj.id === item.id) ?? null;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      const LSlayerBbox = LSitem ? LSitem.getLayerBbox() : null;

      if(LSitem){
        if(LSlayerBbox && LSlayerBbox !== null){
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          this.zoom(LSlayerBbox);
        }
      }
      else{
        console.log('No LSitem or LayerBbox is NULL');
      }
      return;
    }

    // if same element
    if(this.configurables.getSelected()?.id === item.id){

      const LSitem = this.configurables.getAll().find(obj=> obj.id === item.id) ?? null;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      const LSlayerBbox = LSitem ? LSitem.getLayerBbox() : null;

      if(LSitem){
        if(LSlayerBbox && LSlayerBbox !== null){
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          this.zoom(LSlayerBbox);
        }
      }
      else{
        console.log('No LSitem or LayerBbox is NULL');
      }
      return;
    }
    // if switching from an item to another AND current one and target one are not pinned AND switchdialogNotShowAgain === false (dialog is going to show)
    if(this.configurables.getSelected()?.id !== item.id && (!this.configurables.isPinned(this.configurables.getSelected()!.id) && !this.configurables.isPinned(item.id)) && (notShowAgainSwitchDialog === null || notShowAgainSwitchDialog === 'false')){

      // Await for leaflet loading to be done
      let loadingStarted = false;
      const subscription = this.leafletLoadingService.showLoadingObs.subscribe(showLoading => {
        // If the loading has started, set the flag to true
        if (showLoading) {
          loadingStarted = true;
          return;
        }

        if (!showLoading && loadingStarted) {
          const LSitem = this.configurables.getAll().find(obj=> obj.id === item.id) ?? null;

          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
          const LSlayerBbox = LSitem ? LSitem.getLayerBbox() : null;

          if(LSitem){
            if(LSlayerBbox && LSlayerBbox !== null){
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
              this.zoom(LSlayerBbox);
            }
          }
          else{
            console.log('No LSitem or LayerBbox is NULL');
          }
          subscription.unsubscribe();
        }
      });


      await this.selectItem(item);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const awaitDialog = await firstValueFrom(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        this.dialogService.getSwitchItemDialogConfirmation().pipe(
          filter(confirmed => confirmed != null )
        )
      );

    }
    //  current one not pinned and new one is AND notShowAgain === false (dialog is going to show up)
    else if((!this.configurables.isPinned(this.configurables.getSelected()!.id) && this.configurables.isPinned(item.id)) && (notShowAgainSwitchDialog === null || notShowAgainSwitchDialog === 'false')){

      await this.selectItem(item);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const awaitDialog = await firstValueFrom(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        this.dialogService.getSwitchItemDialogConfirmation().pipe(
          filter(confirmed => confirmed != null )
        )
      );

      const LSitem = this.configurables.getAll().find(obj=> obj.id === item.id) ?? null;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      const LSlayerBbox = LSitem ? LSitem.getLayerBbox() : null;

      if(LSitem){
        if(LSlayerBbox && LSlayerBbox !== null){
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          this.zoom(LSlayerBbox);
        }
      }
      else{
        console.log('No LSitem or LayerBbox is NULL');
      }
    }
    // if current pinned AND new one pinned (no dialog is going to show up)
    else if((this.configurables.isPinned(this.configurables.getSelected()!.id) && this.configurables.isPinned(item.id))){
      await this.selectItem(item);

      const LSitem = this.configurables.getAll().find(obj=> obj.id === item.id) ?? null;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      const LSlayerBbox = LSitem ? LSitem.getLayerBbox() : null;

      if(LSitem){
        if(LSlayerBbox && LSlayerBbox !== null){
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          this.zoom(LSlayerBbox);
        }
      }
      else{
        console.log('No LSitem or LayerBbox is NULL');
      }
    }
    // current pinned AND new one is not (no dialog is going to show up)
    else if((this.configurables.isPinned(this.configurables.getSelected()!.id) && !this.configurables.isPinned(item.id))){

      await this.selectItem(item);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const dataLoading = await firstValueFrom(
        this.leafletLoadingService.showLoadingObs.pipe(
          filter((loading: boolean)=> loading !== true),
          skip(1),
          first()
        )
      );

      const LSitem = this.configurables.getAll().find(obj=> obj.id === item.id) ?? null;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      const LSlayerBbox = LSitem ? LSitem.getLayerBbox() : null;

      if(LSitem){
        if(LSlayerBbox && LSlayerBbox !== null){
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          this.zoom(LSlayerBbox);
        }
      }
      else{
        console.log('No LSitem or LayerBbox is NULL');
      }

    }
    // -------------FINE REGULAR BOUNDING BOX------------------

  }

  public zoom(coords: Array<number>): void{

    const bbox: number[] = this.normalizeBoundingBox(coords);
    if(Array.isArray(bbox)) {
      try {
        const maxLat = bbox[0] as unknown;
        const maxLon = bbox[1] as unknown;
        const minLat = bbox[2] as unknown;
        const minLon = bbox[3] as unknown;
        const bboxObj = new LeafletBbox(maxLat as number, maxLon as number, minLat as number, minLon as number);

        this.mapInteractionService.centerMapOnBoundingBox(bboxObj);

      } catch (error) {
        console.warn('Something went wrong(zoom)');
      }
    }
  }

  public zoomForDrawnBbox(): void{
    const bbox = this.localStoragePersister.getValue(LocalStorageVariables.LS_CONFIGURABLES, LocalStorageVariables.LS_DATA_SEARCH_BOUNDS);
    if (Array.isArray(bbox)) {
      try {
        const maxLat = bbox[0] as unknown;
        const maxLon = bbox[1] as unknown;
        const minLat = bbox[2] as unknown;
        const minLon = bbox[3] as unknown;
        const bboxObj = new LeafletBbox(maxLat as number, maxLon as number, minLat as number, minLon as number);
        this.mapInteractionService.centerMapOnBoundingBox(bboxObj);
      } catch (error) {
        console.warn(LocalStorageVariables.LS_DATA_SEARCH_BOUNDS, 'incorrect variable on local storage');
      }
    }
  }

  private normalizeBoundingBox(boundingBox: Array<number>): Array<number> {
    const north = boundingBox[0];
    const east = boundingBox[1];
    const south = boundingBox[2];
    const west = boundingBox[3];
    // zoom out the bounding box
    const eastDelta = 0.0;
    const westDelta = 0.1;
    const northDelta = 0.0;
    const southDelta = 0.0;
    const width = east - west;
    const height = north - south;

    return new Array<number>(
      north + (northDelta * height),
      east + (eastDelta * width),
      south - (southDelta * height),
      west - (westDelta * width)
    );
  }

  private selectItem(item: DistributionItem): Promise<void> {
    return Promise.resolve((() => {
      return this.panelsEvent.selectItem(item.id);
    })());
  }

}

