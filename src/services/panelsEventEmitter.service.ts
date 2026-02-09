import { Injectable, EventEmitter } from '@angular/core';
import { MatExpansionPanel } from '@angular/material/expansion';
import { Subject } from 'rxjs';
import { Subscription } from 'rxjs/internal/Subscription';
import { LocalStoragePersister } from './model/persisters/localStoragePersister';
import { LocalStorageVariables } from './model/persisters/localStorageVariables.enum';
import { ViewType } from 'api/webApi/data/viewType.enum';

@Injectable()
export class PanelsEmitterService {

  invokeTablePanelToggle = new EventEmitter();
  invokeRowOnTable = new EventEmitter();
  invokeClearRowOnTable = new EventEmitter();
  invokeTablePanel = new EventEmitter();
  invokeTablePanelClose = new EventEmitter();
  invokeGraphPanelToggle = new EventEmitter();
  invokeGraphPanel = new EventEmitter();
  invokeGraphPanelOpen = new EventEmitter();
  invokeGraphPanelClose = new EventEmitter();
  invokeNewSelected = new EventEmitter();
  invokeSelectItem = new EventEmitter();
  invokeDataPanelOpen = new EventEmitter();
  invokeDataPanelToggle = new EventEmitter();
  invokeLayerControlPanel = new EventEmitter();
  invokeTableDialogClose = new EventEmitter();
  invokeGraphDialogClose = new EventEmitter();
  invokeVisibleOn = new EventEmitter();

  subscription: Subscription;
  togglePanel: MatExpansionPanel;

  private timeSeriesPopupLayerIdUrlSrc = new Subject<[string, string | null]>();
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public timeSeriesPopupLayerIdUrlObs = this.timeSeriesPopupLayerIdUrlSrc.asObservable();

  constructor(
    private readonly localStoragePersister: LocalStoragePersister,
  ) { }

  /**
   * The function `tablePanelToggle` emits events to toggle a table panel and update the selected state.
   * @param {string} id - The id parameter is a string that represents the identifier of the table panel.
   * @param {boolean} newSelected - The newSelected parameter is a boolean value that indicates whether a
   * new item has been selected or not.
   */
  tablePanelToggle(id: string, newSelected: boolean): void {
    this.invokeTablePanelToggle.emit(id);
    this.invokeNewSelected.emit(newSelected);
    this.invokeTablePanel.emit();
  }

  /**
   * The function `graphPanelToggle` emits events to toggle a graph panel and update the selected state.
   * @param {string} id - A string representing the ID of the graph panel that needs to be toggled.
   * @param {boolean} newSelected - The newSelected parameter is a boolean value that indicates whether a
   * new item has been selected or not.
   */
  graphPanelToggle(id: string, newSelected: boolean): void {
    this.invokeGraphPanelToggle.emit(id);
    this.invokeNewSelected.emit(newSelected);
  }

  /**
   * The function `graphPanelOpen` emits events to open a graph panel and update the selected state.
   * @param {string} id - The `id` parameter is a string that represents the identifier of the graph
   * panel. It is used to uniquely identify the graph panel that needs to be opened or modified.
   * @param {boolean} newSelected - The `newSelected` parameter is a boolean value that indicates whether
   * a new item has been selected.
   */
  graphPanelOpen(id: string, newSelected: boolean): void {
    this.invokeGraphPanelOpen.emit(id);
    console.log('graph Id' , id);
    this.invokeNewSelected.emit(newSelected);
  }

  /**
   * The function "selectRowOnTablePanel" emits events to toggle a table panel and select a row on the
   * table.
   * @param {string} id - The id parameter is a string that represents the identifier of the table panel.
   * @param {string} feature - The "feature" parameter is a string that represents a specific feature or
   * action related to a row in a table.
   */
  selectRowOnTablePanel(id: string, feature: string): void {
    this.invokeTablePanelToggle.emit(id);
    this.invokeRowOnTable.emit(feature);
  }

  /**
   * The function "clearRowOnTablePanel" emits an event to clear a row on a table panel.
   */
  clearRowOnTablePanel(): void {
    this.invokeClearRowOnTable.emit();
  }
  /**
   * The function "visibleOn" emits an event to pass the view type of the visible on that triggered it (just 'Map' up to now).
   */
  visibleOn(viewType: ViewType): void{
    this.invokeVisibleOn.emit(viewType);
  }

  /**
   * The selectItem function emits an event with the provided id as a parameter.
   * @param {string} id - The id parameter is a string that represents the identifier of the item that
   * needs to be selected.
   */
  selectItem(id: string): void {
    this.invokeSelectItem.emit(id);
  }

  /**
   * The dataPanelOpen function emits an event to indicate that the data panel should be opened.
   */
  dataPanelOpen(): void {
    this.invokeDataPanelOpen.emit();
  }

  /**
   * The dataPanelToggle function emits an event to toggle the data panel.
   */
  dataPanelToggle(): void {
    this.invokeDataPanelToggle.emit();
  }

  /**
   * The function sets a reference to a Material Expansion Panel.
   * @param {MatExpansionPanel} togglePanel - The togglePanel parameter is of type MatExpansionPanel. It
   * is used to reference the MatExpansionPanel component that you want to set.
   */
  setTogglePanelRef(togglePanel: MatExpansionPanel): void {
    this.togglePanel = togglePanel;
  }
  /**
   * The function "layerControlPanel" emits an event to invoke the layer control panel.
   */
  layerControlPanel(): void {
    this.invokeLayerControlPanel.emit();
  }

  /**
   * The function sets the URL for a time series popup layer and updates the local storage with the layer
   * ID.
   * @param {string} layerId - The layerId parameter is a string that represents the identifier of a time
   * series popup layer.
   * @param {string | null} url - The `url` parameter is a string that represents the URL of a time
   * series popup layer. It can be either a valid URL or `null` if there is no URL associated with the
   * layer.
   */
  public setTimeSeriesPopupLayerIdUrl(layerId: string, url: string | null): void {
    this.timeSeriesPopupLayerIdUrlSrc.next([layerId, url]);
    this.localStoragePersister.set(LocalStorageVariables.LS_CONFIGURABLES, layerId, false, LocalStorageVariables.LS_TS_POPUP_LAYER_ID);
  }
}
