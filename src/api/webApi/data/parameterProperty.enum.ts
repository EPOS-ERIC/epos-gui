export enum ParameterProperty {
  NONE = 'none',
  START_DATE = 'schema:startDate',
  END_DATE = 'schema:endDate',
  EASTERN_LONGITUDE = 'epos:easternmostLongitude',
  WESTERN_LONGITUDE = 'epos:westernmostLongitude',
  NORTHERN_LATITUDE = 'epos:northernmostLatitude',
  SOUTHERN_LATITUDE = 'epos:southernmostLatitude',
  OUTPUT_FORMAT = 'schema:encodingFormat',
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ParameterProperty {
  export const fromProperty = (name: string): ParameterProperty => {
    const key = Object.keys(ParameterProperty).find((thisKey: string) => ParameterProperty[thisKey] === name);
    return (key != null) ? ParameterProperty[key] as ParameterProperty : ParameterProperty.NONE;
  };
}
