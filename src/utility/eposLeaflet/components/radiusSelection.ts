import * as turf from '@turf/turf';
import { Feature, MultiPolygon, Polygon, Position } from 'geojson';
import { BoundingBox } from 'api/webApi/data/boundingBox.interface';
import { SimpleBoundingBox } from 'api/webApi/data/impl/simpleBoundingBox';

export type SpatialSelectionMode = 'bbox' | 'radius';

export class RadiusSelection {
  private constructor(
    public readonly context: string,
    public readonly latitude: number,
    public readonly longitude: number,
    public readonly radiusKm: number,
    public readonly bbox: BoundingBox,
    public readonly geometry: Feature<Polygon | MultiPolygon>,
  ) {
  }

  public static make(context: string, latitude: number, longitude: number, radiusKm: number): RadiusSelection | null {
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90
      || !Number.isFinite(longitude) || longitude < -180 || longitude > 180
      || !Number.isFinite(radiusKm) || radiusKm <= 0) {
      return null;
    }

    const normalizeLongitude = (value: number): number => ((((value + 180) % 360) + 360) % 360) - 180;
    const round = (value: number, precision = 5): number => Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision);
    const normalizedLatitude = round(latitude);
    const normalizedLongitude = round(normalizeLongitude(longitude));
    const normalizedRadiusKm = round(radiusKm, 3);
    const circle = turf.circle(
      [normalizedLongitude, normalizedLatitude],
      normalizedRadiusKm,
      { steps: 64, units: 'kilometers' }
    );
    const northPoleDistance = turf.distance(
      [normalizedLongitude, normalizedLatitude],
      [normalizedLongitude, 90],
      { units: 'kilometers' }
    );
    const southPoleDistance = turf.distance(
      [normalizedLongitude, normalizedLatitude],
      [normalizedLongitude, -90],
      { units: 'kilometers' }
    );
    const poleLatitude = normalizedRadiusKm >= northPoleDistance
      ? 90
      : normalizedRadiusKm >= southPoleDistance
        ? -90
        : null;
    const geometry = poleLatitude === null
      ? circle
      : RadiusSelection.makePolarCapGeometry(circle, poleLatitude);
    const bounds = turf.bbox(circle);
    const bbox = new SimpleBoundingBox(
      round(Math.min(bounds[3], 90)),
      round(normalizeLongitude(bounds[2])),
      round(Math.max(bounds[1], -90)),
      round(normalizeLongitude(bounds[0])),
    );
    bbox.setId(context);

    return new RadiusSelection(context, normalizedLatitude, normalizedLongitude, normalizedRadiusKm, bbox, geometry);
  }

  private static makePolarCapGeometry(circle: Feature<Polygon>, poleLatitude: 90 | -90): Feature<MultiPolygon> {
    const mercatorLimit = 85.05112878;
    let previousLongitude: number | null = null;
    let ring = circle.geometry.coordinates[0].map(([rawLongitude, latitude]): Position => {
      let longitude = rawLongitude;
      if (previousLongitude !== null) {
        while (longitude - previousLongitude > 180) {
          longitude -= 360;
        }
        while (longitude - previousLongitude < -180) {
          longitude += 360;
        }
      }
      previousLongitude = longitude;
      return [longitude, latitude];
    });

    if (ring[ring.length - 1][0] < ring[0][0]) {
      ring = ring.reverse();
    }

    const poleRing: Array<Position> = [
      ...ring,
      [ring[ring.length - 1][0], poleLatitude],
      [ring[0][0], poleLatitude],
      ring[0],
    ];
    const polygons: Array<Array<Array<Position>>> = [];

    [-360, 0, 360].forEach((longitudeOffset: number) => {
      const shiftedRing = poleRing.map(([longitude, latitude]): Position => [longitude + longitudeOffset, latitude]);
      const clipped = turf.bboxClip(
        turf.polygon([shiftedRing]),
        [-180, -mercatorLimit, 180, mercatorLimit],
      );
      if (turf.area(clipped) > 0) {
        if (clipped.geometry.type === 'Polygon') {
          polygons.push(clipped.geometry.coordinates);
        } else if (clipped.geometry.type === 'MultiPolygon') {
          polygons.push(...clipped.geometry.coordinates);
        }
      }
    });

    return turf.multiPolygon(polygons);
  }

  public matchesBounds(bbox: BoundingBox): boolean {
    return !SimpleBoundingBox.isDifferent(this.bbox, bbox);
  }

  public isDifferent(other: RadiusSelection | null): boolean {
    return other === null
      || this.latitude !== other.latitude
      || this.longitude !== other.longitude
      || this.radiusKm !== other.radiusKm;
  }
}
