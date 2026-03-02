import { Environment } from 'api/webApi/data/environments/environment.interface';
import { BehaviorSubject } from 'rxjs';

export class AnalysisConfigurablesService {

  private triggerEnvironmentSelectionSrc = new BehaviorSubject<Environment | null>(null);
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public triggerEnvironmentSelectionObs = this.triggerEnvironmentSelectionSrc.asObservable();

  private analysisPanelOpenSrc = new BehaviorSubject<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public analysisPanelOpenObs = this.analysisPanelOpenSrc.asObservable();

  public setEnvironmentSelection(environment: Environment | null): void {
    this.triggerEnvironmentSelectionSrc.next(environment);
  }

  public setAnalysisPanelOpen(isOpen: boolean): void {
    this.analysisPanelOpenSrc.next(isOpen);
  }
}
