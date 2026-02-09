// the structure of a TileJSON response
export interface WmtsTileJSON {
  tilejson: string;
  name: string;
  scheme: string;
  tiles: [string];
  bounds: [number];
}
