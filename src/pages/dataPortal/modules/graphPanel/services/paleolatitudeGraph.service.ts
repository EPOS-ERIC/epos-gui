import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from 'api/api.service';
import { DistributionFormatType } from 'api/webApi/data/distributionFormatType';
import { ParameterValue } from 'api/webApi/data/parameterValue.interface';
import { NotificationService } from 'components/notification/notification.service';
import { InteractiveVisualisationService } from 'pages/dataPortal/services/interactiveVisualisation.service';
import { DataConfigurableI } from 'utility/configurables/dataConfigurableI.interface';
import { DataConfigurableDataSearchI } from 'utility/configurablesDataSearch/dataConfigurableDataSearchI.interface';
import { DataSearchConfigurablesServiceResource } from '../../dataPanel/services/dataSearchConfigurables.service';
import { PALEOLATITUDE_CONFIG_ID } from '../objects/paleolatitude.interface';
import { CovJsonData } from '../objects/data/covJsonData';
import { Trace } from '../objects/trace';
import { YAxisDisplayType } from '../objects/yAxisDisplayType.enum';

export interface PaleolatitudeGraphRequest {
  normalizedLon: number;
  url: string;
  serviceId: string;
  serviceName: string;
}

export interface PaleolatitudeGraphData {
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
    private readonly http: HttpClient,
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

    const resultName = `${request.serviceName} (${request.normalizedLon.toFixed(4)}, ${lat.toFixed(4)})`;
    const resultDetails = {
      id,
      name: resultName,
      serviceId: request.serviceId,
      serviceName: request.serviceName,
      selectedLat: lat,
      selectedLon: request.normalizedLon,
    };
    this.interactiveVisualisations.setSource({
      kind: 'interactive',
      id,
      name: resultName,
      groupId: PALEOLATITUDE_CONFIG_ID,
      traces: null,
      metadata: resultDetails,
    });
    this.interactiveVisualisations.viewSourceOnGraph(id);

    try {
      const result = await this.executeRequest(request, id);
      if (this.interactiveVisualisations.getSource(id) == null) {
        return;
      }
      if (result.traces.length === 0) {
        this.interactiveVisualisations.removeSource(id);
        this.sendWarning(id);
        return;
      }

      result.traces.forEach((trace: Trace) => {
        trace.axisGroup = JSON.stringify([request.serviceId, trace.name, trace.yUnit]);
        trace.persistSelection = false;
      });
      this.interactiveVisualisations.setSource({
        kind: 'interactive',
        id,
        name: resultName,
        groupId: PALEOLATITUDE_CONFIG_ID,
        traces: result.traces,
        table: {
          groupId: PALEOLATITUDE_CONFIG_ID,
          groupName: request.serviceName,
          rows: result.traces.flatMap((trace: Trace) => trace.yValues.map((value, index) => ({
            ...resultDetails,
            parameter: trace.name,
            t: trace.xValues[index],
            value,
            unit: trace.yUnit,
          }))),
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
      serviceId: configurable.id,
      serviceName: configurable.name,
    };
  }

  public async executeRequest(
    request: PaleolatitudeGraphRequest,
    configurableId: string,
  ): Promise<PaleolatitudeGraphData> {
    const data = await firstValueFrom(this.http.get(request.url, { responseType: 'blob' }));
    const response: unknown = JSON.parse(await data.text());
    if (!this.isRecord(response) || (response.type != null && response.type !== 'Coverage')
      || response.error != null || response.message != null
      || !this.isRecord(response.parameters) || !this.isRecord(response.ranges)
      || !this.isRecord(response.domain) || !this.isRecord(response.domain.axes)
      || !this.isRecord(response.domain.axes.t)) {
      return { traces: [] };
    }

    const parameters = Object.fromEntries(Object.entries(response.parameters).filter(([key]) => {
      return key !== 'lowerbound' && key !== 'upperbound';
    }).map(([key, parameter]) => {
      if (!this.isRecord(parameter)) {
        return [key, parameter];
      }
      if (parameter.type === 'ParameterGroup' && Array.isArray(parameter.members)
        && parameter.members.some(member => member === 'lowerbound' || member === 'upperbound')) {
        return [key, { ...parameter, members: [] }];
      }
      const observedProperty = this.isRecord(parameter.observedProperty) ? parameter.observedProperty : {};
      const label = this.isRecord(observedProperty.label) ? observedProperty.label : {};
      const description = this.isRecord(parameter.description) ? parameter.description : {};
      return [key, {
        ...parameter,
        description: { en: typeof description.en === 'string' ? description.en : '' },
        observedProperty: {
          ...observedProperty,
          label: { en: typeof label.en === 'string' ? label.en : key },
        },
      }];
    }));

    const parser = new CovJsonData(configurableId);
    const traces = parser.createTraces({ ...response, parameters }).filter(trace => {
      return trace.xValues.length > 0 && trace.xValues.length === trace.yValues.length;
    });
    const lowerBounds = this.isRecord(response.ranges.lowerbound)
      ? parser.getAxisValues(response.ranges.lowerbound).map(value => value.trim() === '' ? Number.NaN : Number(value)) : [];
    const upperBounds = this.isRecord(response.ranges.upperbound)
      ? parser.getAxisValues(response.ranges.upperbound).map(value => value.trim() === '' ? Number.NaN : Number(value)) : [];

    return {
      traces: traces.map(trace => {
        const result = new Trace(
          trace.originatingConfigurableId,
          trace.id,
          trace.type,
          trace.name,
          trace.description,
          trace.yUnit,
          trace.yUnitLabel,
          trace.yValues,
          trace.xValues,
          'lines+markers',
          trace.xAxisTitle,
        );
        result.yErrorMinValues = trace.yErrorMinValues;
        result.yErrorMaxValues = trace.yErrorMaxValues;
        if (traces.length === 1 && lowerBounds.length === trace.yValues.length && upperBounds.length === trace.yValues.length
          && lowerBounds.every(Number.isFinite) && upperBounds.every(Number.isFinite)
          && trace.yValues.every(value => value.trim() !== '' && Number.isFinite(Number(value)))) {
          result.yErrorMinValues = trace.yValues.map((value, index) => String(Math.max(Number(value) - lowerBounds[index], 0)));
          result.yErrorMaxValues = trace.yValues.map((value, index) => String(Math.max(upperBounds[index] - Number(value), 0)));
        }
        return result;
      }),
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
