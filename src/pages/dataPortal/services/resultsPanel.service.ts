import { BehaviorSubject, Subject } from 'rxjs';

/**
 * A service that exposes methods for ResultPanelComponent
 */

export class ResultsPanelService {

  private counterData = new BehaviorSubject<number>(0);
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public counterDataObs = this.counterData.asObservable();

  private counterRegistry = new BehaviorSubject<number>(0);
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public counterRegistryObs = this.counterRegistry.asObservable();

  private counterSoftware = new BehaviorSubject<number>(0);
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public counterSoftwareObs = this.counterSoftware.asObservable();

  private counterEnvironment = new BehaviorSubject<number>(0);
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public counterEnvironmentObs = this.counterEnvironment.asObservable();

  private counterTable = new BehaviorSubject<number>(0);
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public counterTableObs = this.counterTable.asObservable();

  private counterGraph = new BehaviorSubject<number>(0);
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public counterGraphObs = this.counterGraph.asObservable();

  private clearFacetSelectionSrc = new Subject<void>();
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public clearFacetSelectionObs = this.clearFacetSelectionSrc.asObservable();

  private openFacetSelectionSrc = new Subject<boolean>();
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public openFacetSelectionObs = this.openFacetSelectionSrc.asObservable();

  private triggerFacetSelectionSrc = new Subject<string>();
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public triggerFacetSelectionObs = this.triggerFacetSelectionSrc.asObservable();

  private landingPanelTopSrc = new Subject<string>();
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public landingPanelTopSrcObs = this.landingPanelTopSrc.asObservable();

  public setCounterData(value: number): void {
    this.counterData.next(value);
  }

  public setCounterRegistry(value: number): void {
    this.counterRegistry.next(value);
  }

  public setCounterSoftware(value: number): void {
    this.counterSoftware.next(value);
  }

  public setCounterEnvironment(value: number): void {
    this.counterEnvironment.next(value);
  }

  public setCounterTable(value: number): void {
    this.counterTable.next(value);
  }

  public setCounterGraph(value: number): void {
    this.counterGraph.next(value);
  }

  public clearFacetSelection(): void {
    this.clearFacetSelectionSrc.next();
  }

  public setFacetSelection(facet: string): void {
    this.triggerFacetSelectionSrc.next(facet);
  }

  public setLandingPanelTopSrc(position: string): void {
    this.landingPanelTopSrc.next(position);
  }

  public openFacetSelection(facet: boolean): void {
    this.openFacetSelectionSrc.next(facet);
  }

}
