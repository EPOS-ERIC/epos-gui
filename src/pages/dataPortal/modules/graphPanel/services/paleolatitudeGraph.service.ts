import { Injectable } from '@angular/core';
import { ApiService } from 'api/api.service';
import { DataConfigurableDataSearchI } from 'utility/configurablesDataSearch/dataConfigurableDataSearchI.interface';
import { PaleolatitudePoint, PaleolatitudeResponse, PALEOLATITUDE_API_URL } from '../objects/paleolatitude.interface';
import { Trace } from '../objects/trace';

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
  ) {
  }

  public createRequest(
    lat: number,
    lon: number,
    configurables: Array<DataConfigurableDataSearchI>,
  ): null | PaleolatitudeGraphRequest {
    const filters = this.getFilters(configurables);
    if (filters == null) {
      return null;
    }

    const normalizedLon = this.normalizeLongitude(lon);
    return {
      normalizedLon,
      url: `${PALEOLATITUDE_API_URL}/${lat}/${normalizedLon}/${encodeURIComponent(filters.age)}/${encodeURIComponent(filters.minage)}/${encodeURIComponent(filters.maxAge)}/${encodeURIComponent(filters.model)}/website`,
    };
  }

  public async executeRequest(
    request: PaleolatitudeGraphRequest,
    configurableId: string,
    traceId: string,
  ): Promise<PaleolatitudeGraphData> {
    const data = await this.apiService.executeUrl(request.url);
    const response = JSON.parse(await data.text()) as PaleolatitudeResponse;

    return {
      response,
      traces: this.createTrace(response, configurableId, traceId),
    };
  }

  private getFilters(
    configurables: Array<DataConfigurableDataSearchI>,
  ): null | { age: string; minage: string; maxAge: string; model: string } {
    const configurable = configurables.find((item: DataConfigurableDataSearchI) => {
      return item.getDistributionDetails().getKeywords().some(keyword => keyword.trim().toLowerCase() === 'eposdynamic');
    });
    const parameterValues = configurable?.getNewParameterValues();
    const normalizeName = (name: string): string => name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const getValue = (name: string): string | undefined => parameterValues?.find(parameter => {
      return normalizeName(parameter.name) === normalizeName(name);
    })?.value;
    const age = getValue('age');
    const minage = getValue('minage');
    const maxAge = getValue('max_age');
    const model = getValue('model');

    if (age == null || minage == null || maxAge == null || model == null) {
      return null;
    }

    return { age, minage, maxAge, model };
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

  private normalizeLongitude(lon: number): number {
    return ((((lon + 180) % 360) + 360) % 360) - 180;
  }
}
