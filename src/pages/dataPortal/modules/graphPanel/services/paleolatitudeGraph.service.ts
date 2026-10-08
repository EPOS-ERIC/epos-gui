import { Injectable } from '@angular/core';
import { ApiService } from 'api/api.service';
import { DistributionFormatType } from 'api/webApi/data/distributionFormatType';
import { ParameterValue } from 'api/webApi/data/parameterValue.interface';
import { NotificationService } from 'components/notification/notification.service';
import { InteractiveVisualisationService } from 'pages/dataPortal/services/interactiveVisualisation.service';
import { DataConfigurableI } from 'utility/configurables/dataConfigurableI.interface';
import { DataConfigurableDataSearchI } from 'utility/configurablesDataSearch/dataConfigurableDataSearchI.interface';
import { DataSearchConfigurablesServiceResource } from '../../dataPanel/services/dataSearchConfigurables.service';
import { PaleolatitudePoint, PaleolatitudeResponse, PALEOLATITUDE_CONFIG_ID, PALEOLATITUDE_TRACE_ID } from '../objects/paleolatitude.interface';
import { Trace } from '../objects/trace';
import { YAxisDisplayType } from '../objects/yAxisDisplayType.enum';

export interface PaleolatitudeGraphRequest {
  normalizedLon: number;
  url: string;
}

export interface PaleolatitudeGraphData {
  response: PaleolatitudeResponse;
  traces: Array<Trace>;
}

@Injectable({
  providedIn: 'root',
})
export class PaleolatitudeGraphService {

  constructor(
    private readonly apiService: ApiService,
    private readonly configurables: DataSearchConfigurablesServiceResource,
    private readonly interactiveVisualisations: InteractiveVisualisationService,
    private readonly notificationService: NotificationService,
  ) {
  }

  public supports(configurables: Array<DataConfigurableI>): boolean {
    return this.getConfigurable(configurables) != null;
  }

  public async request(id: string, lat: number, lon: number): Promise<void> {
    const request = this.createRequest(lat, lon, this.configurables.getAll());
    if (request == null) {
      this.interactiveVisualisations.removeSource(id);
      this.sendWarning(id);
      return;
    }

    const serviceName = this.getConfigurable(this.configurables.getAll())?.name ?? 'Paleolatitude';
    const pendingName = `Paleolatitude (${request.normalizedLon.toFixed(4)}, ${lat.toFixed(4)})`;
    this.interactiveVisualisations.setSource({
      kind: 'interactive',
      id,
      name: pendingName,
      groupId: PALEOLATITUDE_CONFIG_ID,
      traces: null,
    });
    this.interactiveVisualisations.viewSourceOnGraph(id);

    try {
      const result = await this.executeRequest(request, id, `${PALEOLATITUDE_TRACE_ID}-${id}`);
      if (this.interactiveVisualisations.getSource(id) == null) {
        return;
      }
      if (result.traces.length === 0) {
        this.interactiveVisualisations.removeSource(id);
        this.sendWarning(id);
        return;
      }

      const plateLabel = result.response.plate?.name != null ? ` - ${result.response.plate.name}` : '';
      const resultName = `Paleolatitude${plateLabel} (${request.normalizedLon.toFixed(4)}, ${lat.toFixed(4)})`;
      result.traces.forEach((trace: Trace) => {
        trace.axisGroup = PALEOLATITUDE_CONFIG_ID;
        trace.persistSelection = false;
      });
      const resultDetails = {
        id,
        name: resultName,
        selectedLat: lat,
        selectedLon: request.normalizedLon,
        plateId: result.response.plate?.id,
        plateName: result.response.plate?.name,
      };
      this.interactiveVisualisations.setSource({
        kind: 'interactive',
        id,
        name: resultName,
        groupId: PALEOLATITUDE_CONFIG_ID,
        traces: result.traces,
        table: {
          groupId: PALEOLATITUDE_CONFIG_ID,
          groupName: serviceName,
          rows: (result.response.paleolatitude ?? []).map((point: PaleolatitudePoint) => ({
            ...resultDetails,
            ...point,
          })),
          isMappable: true,
        },
        autoSelect: true,
        preferredDisplayType: YAxisDisplayType.OVERLAY,
        metadata: resultDetails,
      });
    } catch {
      if (this.interactiveVisualisations.getSource(id) != null) {
        this.interactiveVisualisations.removeSource(id);
        this.sendWarning(id);
      }
    }
  }

  public remove(id: string): void {
    this.interactiveVisualisations.removeSource(id);
  }

  public clear(): void {
    this.interactiveVisualisations.clearSources(PALEOLATITUDE_CONFIG_ID);
  }

  public createRequest(
    lat: number,
    lon: number,
    configurables: Array<DataConfigurableDataSearchI>,
  ): null | PaleolatitudeGraphRequest {
    const configurable = this.getConfigurable(configurables);
    if (configurable == null) {
      return null;
    }

    const normalizedLon = this.normalizeLongitude(lon);
    const url = this.createUrl(configurable, lat, normalizedLon);
    if (url == null) {
      return null;
    }

    return {
      normalizedLon,
      url,
    };
  }

  public async executeRequest(
    request: PaleolatitudeGraphRequest,
    configurableId: string,
    traceId: string,
  ): Promise<PaleolatitudeGraphData> {
    const data = await this.apiService.executeUrl(request.url);
    const response = this.toPaleolatitudeResponse(JSON.parse(await data.text()) as unknown);

    return {
      response,
      traces: this.createTrace(response, configurableId, traceId),
    };
  }

  private createUrl(configurable: DataConfigurableI, lat: number, lon: number): null | string {
    const format = configurable.getDistributionDetails().getFormats().find(item => {
      return item.getFormat() === DistributionFormatType.APP_EPOS_GRAPH_COV_JSON;
    });
    if (format == null) {
      return null;
    }

    const parameterValues: Array<ParameterValue> = configurable.getNewParameterValues().filter(parameter => {
      const name = this.normalizeParameterName(parameter.name);
      return name !== 'lat' && name !== 'lon';
    });
    parameterValues.push(
      { name: 'lat', value: String(lat) },
      { name: 'lon', value: String(lon) },
    );

    return this.apiService.getExecuteUrl(format, parameterValues);
  }

  private createTrace(response: PaleolatitudeResponse, configurableId: string, traceId: string): Array<Trace> {
    const points = response.paleolatitude ?? [];
    if (points.length === 0 || response.error != null || response.message != null) {
      return [];
    }

    const trace = new Trace(
      configurableId,
      traceId,
      'scatter',
      'Paleolatitude',
      'Paleolatitude from selected map point',
      'deg',
      'Paleolatitude',
      points.map((point: PaleolatitudePoint) => String(point.lat)),
      points.map((point: PaleolatitudePoint) => String(point.age)),
      'lines+markers',
    );

    if (points.every((point: PaleolatitudePoint) => typeof point.lowerbound === 'number' && typeof point.upperbound === 'number')) {
      trace.yErrorMinValues = points.map((point: PaleolatitudePoint) => String(Math.max(point.lat - point.lowerbound!, 0)));
      trace.yErrorMaxValues = points.map((point: PaleolatitudePoint) => String(Math.max(point.upperbound! - point.lat, 0)));
    }

    return [trace];
  }

  private toPaleolatitudeResponse(data: unknown): PaleolatitudeResponse {
    if (!this.isRecord(data)) {
      return {};
    }

    const ages = this.getNumberArray(data, ['domain', 'axes', 't', 'values']);
    const latitudes = this.getNumberArray(data, ['ranges', 'lat', 'values']);
    if (ages == null || latitudes == null) {
      return data as PaleolatitudeResponse;
    }

    const lowerBounds = this.getNumberArray(data, ['ranges', 'lowerbound', 'values']);
    const upperBounds = this.getNumberArray(data, ['ranges', 'upperbound', 'values']);
    const paleolatitude = ages.map((age, index): null | PaleolatitudePoint => {
      const lat = latitudes[index];
      if (age == null || lat == null) {
        return null;
      }

      const lowerbound = lowerBounds?.[index];
      const upperbound = upperBounds?.[index];
      return {
        age,
        lat,
        ...(lowerbound == null || upperbound == null ? {} : { lowerbound, upperbound }),
      };
    }).filter((point): point is PaleolatitudePoint => point != null);

    return { paleolatitude };
  }

  private getNumberArray(data: Record<string, unknown>, path: Array<string>): null | Array<null | number> {
    let value: unknown = data;
    for (const key of path) {
      if (!this.isRecord(value)) {
        return null;
      }
      value = value[key];
    }

    if (!Array.isArray(value)) {
      return null;
    }
    return value.map(item => typeof item === 'number' && Number.isFinite(item) ? item : null);
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value != null && !Array.isArray(value);
  }

  private normalizeLongitude(lon: number): number {
    return ((((lon + 180) % 360) + 360) % 360) - 180;
  }

  private normalizeParameterName(name: string): string {
    return name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  private getConfigurable(configurables: Array<DataConfigurableI>): DataConfigurableI | undefined {
    return configurables.find((item: DataConfigurableI) => {
      return item.getDistributionDetails().getKeywords().some(keyword => keyword.trim().toLowerCase() === 'pointclick');
    });
  }

  private sendWarning(id: string): void {
    this.notificationService.sendDistributionNotification({
      id,
      title: 'Warning',
      message: NotificationService.MESSAGE_NO_DATA,
      type: NotificationService.TYPE_WARNING as string,
      showAgain: false,
    });
  }
}
