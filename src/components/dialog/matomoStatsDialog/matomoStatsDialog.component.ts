import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environmentProd } from 'environments/environment.prod';

@Component({
  selector: 'app-matomo-widget-test',
  templateUrl: './matomoStatsDialog.component.html',
  styleUrls: ['./matomoStatsDialog.component.scss']
})
export class MatomoStatsDialogComponent implements OnInit {

  public visitorMapSrc: SafeResourceUrl | null = null;

  public siteId = environmentProd.matomoSiteId;
  public endpoint = environmentProd.matomoEndpoint;
  public tokenAuth = environmentProd.matomoTokenAuth;
  public isSidebarOpen = true;

  // form (temporary inputs)
  public startDate = '';
  public endDate = '';

  // active range (displayed in the widget)
  public activeStartDate = '';
  public activeEndDate = '';

  // default
  public today: string = new Date().toISOString().split('T')[0];
  public defaultStartDate = '2020-01-01';

  public dataChange = false;
  public dateError: string | null = null;

  constructor(private sanitizer: DomSanitizer) { }

  // “safe” getters for inputs: return defaults if empty
  get safeStart(): string {
    return (this.startDate?.trim()) || this.defaultStartDate;
  }
  get safeEnd(): string {
    return (this.endDate?.trim()) || this.today;
  }

  ngOnInit(): void {
    // on init use defaults and load widget
    this.applyRange(this.defaultStartDate, this.today);
    // clear any input values
    this.resetForm();
  }

    // Toggle sidebar state
  public toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  /** Form submit: use safe getters (default if empty) and apply */
  public onDateChange(): void {
    this.applyRange(this.safeStart, this.safeEnd);
    // optional: clear inputs after applying
    this.resetForm();
  }

  /** Reset ONLY inputs (not active range) */
  public resetForm(): void {
    this.startDate = '';
    this.endDate = '';
  }

  /** Reset to defaults (active range = default), clear inputs and reload widget */
  public clearDateRange(): void {
    this.applyRange(this.defaultStartDate, this.today);
    this.resetForm();
  }

  // Widget URL
  public getVisitorMapSrc(): string {
    return this.buildWidgetUrl('UserCountryMap', 'visitorMap');
  }

  /** Apply an active range (with validation) and reload iframe */
  private applyRange(start: string, end: string): void {
    // normalize to Date
    const startD = new Date(start);
    const endD = new Date(end);

    if (Number.isNaN(+startD) || Number.isNaN(+endD)) {
      this.dateError = 'Invalid date range.';
      return;
    }
    if (endD < startD) {
      this.dateError = 'End date cannot be earlier than start date.';
      return;
    }

    this.dateError = null;

    this.activeStartDate = start;
    this.activeEndDate = end;

    // dataChange flag: active range different from defaults?
    this.dataChange = !(this.activeStartDate === this.defaultStartDate && this.activeEndDate === this.today);

    this.visitorMapSrc = this.sanitizer.bypassSecurityTrustResourceUrl(this.getVisitorMapSrc());
  }

  private buildWidgetUrl(moduleToWidgetize: string, actionToWidgetize: string, extraParams = ''): string {
    const base = this.endpoint + (this.endpoint.endsWith('/') ? '' : '/');
    return `${base}index.php?module=Widgetize&action=iframe&disableLink=1&widget=1` +
      `&moduleToWidgetize=${moduleToWidgetize}&actionToWidgetize=${actionToWidgetize}` +
      `&idSite=${this.siteId}&period=range&date=${this.activeStartDate},${this.activeEndDate}` +
      `&token_auth=${this.tokenAuth}&language=en&enableDatePicker=1${extraParams}`;
  }
}
