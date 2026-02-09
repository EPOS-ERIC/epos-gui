export interface BoundingBox {
  getId(): string;
  getMaxLat(): number;
  getMaxLon(): number;
  getMinLat(): number;
  getMinLon(): number;
  asArray(): [number, number, number, number];
  asArrayFormat(format: string): [number, number, number, number];
  isBounded(): boolean;
  setId(id: string): BoundingBox;
}
