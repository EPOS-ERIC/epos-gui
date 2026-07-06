export interface PaleolatitudePoint {
  age: number;
  lat: number;
  lowerbound?: number;
  upperbound?: number;
}

export interface PaleolatitudeResponse {
  plate?: {
    id: string;
    name: string;
  };
  paleolatitude?: Array<PaleolatitudePoint>;
  error?: string;
  message?: string;
}

export const PALEOLATITUDE_CONFIG_ID = 'paleolatitude-map-tool';
export const PALEOLATITUDE_TRACE_ID = 'paleolatitude-map-tool-trace';
export const PALEOLATITUDE_API_URL = 'https://paleolatitude.org/api/paleolatitude';
