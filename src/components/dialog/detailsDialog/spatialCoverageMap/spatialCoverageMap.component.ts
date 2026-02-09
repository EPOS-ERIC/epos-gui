/* eslint-disable @typescript-eslint/dot-notation */
import { AfterViewInit, Component, Input } from '@angular/core';
import { SpatialRange } from 'api/webApi/data/spatialRange.interface';
import * as L from 'leaflet';

@Component({
  selector: 'app-spatial-coverage-map',
  templateUrl: './spatialCoverageMap.component.html',
  styleUrls: ['./spatialCoverageMap.component.scss']
})
export class SpatialCoverageMapComponent implements AfterViewInit {
  @Input() spatialRange: SpatialRange;

  private map: L.Map;

  ngAfterViewInit(): void {
    this.initMap();
  }

  private initMap(): void {

    const shape = this.spatialRange;
    const esriLink = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
    const tiles = L.tileLayer('https://tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: `| Powered by ${esriLink}`,
    });
    this.map = L.map('map', {
      center: [45, 3],
      zoom: 3,
      zoomControl: false,
      touchZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      dragging: false,
    });
    tiles.addTo(this.map);

    const pollutedPane = L.Path.prototype.options.pane;
    L.Path.prototype.options.pane = 'overlayPane';

    try {
      if (shape.isBounded()) {
        const geometryType = shape.getFeatures()[0].geometry['type'] as string;

        if (geometryType === SpatialRangeGeometaryType.POLYGON as string) {

          const spatialBbox =
            new L.Polyline(this.convertToLatLongExp(shape.getFeatures()[0].geometry['coordinates'] as number[][][]));

          spatialBbox.addTo(this.map);
          this.map.fitBounds(spatialBbox.getBounds());

        } else if (geometryType === SpatialRangeGeometaryType.POINT as string) {
          const pointArr = shape.getFeatures()[0].geometry['coordinates'] as Array<number>;
          const reversedPointArr = this.reverseArray(pointArr);
          const icon = new L.Icon.Default();
          icon.options.shadowSize = [0, 0];
          icon.options.imagePath = 'assets/img/leaflet/';
          icon.options.iconUrl = 'marker-icon.png';
          icon.options.iconRetinaUrl = 'marker-icon.png';
          icon.options.shadowUrl = 'marker-shadow.png';
          const spatialPoint = new L.Marker(reversedPointArr as L.LatLngExpression, { icon: icon });
          spatialPoint.addTo(this.map);
          this.map.flyTo(reversedPointArr as L.LatLngExpression);
        }
      } else if (shape != null && shape.isUnbounded()) {
        const globalBbox = new L.Polygon([[70, 180], [70, -180], [-70, -180], [-70, 180]]);
        globalBbox.addTo(this.map);
        this.map.fitBounds(globalBbox.getBounds());
      }
    } finally {
      L.Path.prototype.options.pane = pollutedPane;
    }
  }

  private convertToLatLongExp(coords: Array<Array<Array<number>>>): Array<L.LatLngTuple> {
    const reversedArrays: Array<L.LatLngTuple> = [];
    coords[0].map((arr: Array<number>) => {
      reversedArrays.push(this.reverseArray(arr) as L.LatLngTuple);
    });
    return reversedArrays;
  }

  private reverseArray(arr: Array<number>): Array<number> {
    const output: Array<number> = [];
    const reversed = arr.reduce((ary, ele) => { output.unshift(ele); return output; }, []) as Array<number>;
    return reversed;
  }
}

enum SpatialRangeGeometaryType {
  POLYGON = 'Polygon',
  POINT = 'Point',
}

