/* eslint-disable @typescript-eslint/no-loss-of-precision */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// projections/custom-crs.ts
import * as L from 'leaflet';
import proj4 from 'proj4';
import * as proj4leaflet from 'proj4leaflet';

const projDef3995 =
  '+proj=stere +lat_0=90 +lat_ts=71 +lon_0=0 +datum=WGS84 +units=m +no_defs';
proj4.defs('EPSG:3995', projDef3995);

export const RES_3995 = [
  67733.46880027094, 33866.73440013547, 16933.367200067736,
  8466.683600033868, 4233.341800016934, 2116.670900008467,
  1058.3354500042335, 529.1677250021168, 264.5838625010584,
  132.2919312505292, 66.1459656252646, // <-- Zoom 10 (last zoom level)
  33.0729828126323,   // <-- Zoom 11 (overzoom)
  16.53649140631615,  // <-- Zoom 12 (overzoom)
  8.268245703158075    // <-- Zoom 13 (overzoom)
];


// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
export const EPSG_3995 = new proj4leaflet.CRS('EPSG:3995', projDef3995, {
  origin: [-30636100, 30636100],
  bounds: L.bounds(
    [-6304504.982643295, -4981451.9642706085],
    [6304503.568707142, 4981453.378206745]
  ),
  resolutions: RES_3995,
  infinite: false,
});
