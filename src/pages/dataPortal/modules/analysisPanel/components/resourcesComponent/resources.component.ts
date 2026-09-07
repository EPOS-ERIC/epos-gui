import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { EnvironmentResource } from 'api/webApi/data/environments/environmentResource.interface';
import { EnvironmentStatus } from 'api/webApi/data/environments/environmentStatus.enum';
import { EnvironmentObject } from '../../analysisPanel.component';
import { EnvironmentResourceStatus } from 'api/webApi/data/environments/environmentResourceStatus.enum';
import { DistributionFormatType } from 'api/webApi/data/distributionFormatType';

@Component({
  selector: 'app-analysis-resources',
  templateUrl: './resources.component.html',
  styleUrls: ['./resources.component.scss'],
})
export class ResourcesComponent implements OnInit {

  @Input() resources: Array<EnvironmentResource>;
  @Input() environment: EnvironmentObject;
  @Output() deleteResourceCall = new EventEmitter<EnvironmentResource>();
  @Output() openParametersDialogCall = new EventEmitter<EnvironmentResource>();
  @Output() cloneResourceCall = new EventEmitter<EnvironmentResource>();

  public displayedColumns: string[] = ['resource', 'format', 'status', 'actions'];
  public dataSource = new MatTableDataSource<EnvironmentResource>([]);

  /* The above code is declaring a public variable called "environmentStatus" and assigning it the
value of "EnvironmentStatus". */
  public environmentStatus = EnvironmentStatus;
  public environmentResourceStatus = EnvironmentResourceStatus;

  ngOnInit(): void {
    this.dataSource.data = this.resources;
  }

  public deleteResource(element: EnvironmentResource): void {
    this.deleteResourceCall.emit(element);
  }

  public openParametersDialog(element: EnvironmentResource): void {
    this.openParametersDialogCall.emit(element);
  }

  /**
   * The function "openInBrowser" opens a given URL in a new browser tab.
   * @param {string} url - The `url` parameter is a string that represents the URL of the webpage you
   * want to open in a new browser window.
   */
  public openInBrowser(url: string) {
    window.open(url, '_blank');
  }

  public cloneResource(element: EnvironmentResource): void {
    this.cloneResourceCall.emit(element);
  }

  /**
   * Returns the appropriate Material icon name for a given format string.
   * @param format - The format string (e.g., 'application/geo+json', 'IPYNB', 'ZIP')
   * @returns The Material icon name
   */
  public getFormatIcon(format: string): string {
    if (!format) {
      return 'insert_drive_file';
    }

    const formatLower = format.toLowerCase();

    // GeoJSON and map-related formats
    if (DistributionFormatType.isMappable(format)) {
      return 'map';
    }

    // Graph/chart formats
    if (DistributionFormatType.isGraphable(format)) {
      return 'show_chart';
    }

    // Tabular formats
    if (DistributionFormatType.isTabularable(format)) {
      return 'table_chart';
    }

    // Software/code formats
    if (formatLower === 'ipynb' || formatLower === 'py' || formatLower === 'python' ||
        formatLower === 'r' || formatLower === 'm' || formatLower === 'dockerfile') {
      return 'code';
    }

    // Archive formats
    if (formatLower === 'zip' || formatLower.includes('zip') || formatLower.includes('tar')) {
      return 'folder_zip';
    }

    // Markdown/documentation
    if (formatLower === 'md' || formatLower.includes('markdown')) {
      return 'description';
    }

    // JSON formats (non-geo)
    if (formatLower.includes('json')) {
      return 'data_object';
    }

    // XML formats
    if (formatLower.includes('xml')) {
      return 'code';
    }

    // Image formats
    if (formatLower.includes('image') || formatLower.includes('png') ||
        formatLower.includes('jpg') || formatLower.includes('jpeg') ||
        formatLower.includes('gif') || formatLower.includes('svg')) {
      return 'image';
    }

    // CSV/text data
    if (formatLower.includes('csv') || formatLower.includes('text/plain')) {
      return 'table_rows';
    }

    // Default icon for unknown formats
    return 'insert_drive_file';
  }
}
