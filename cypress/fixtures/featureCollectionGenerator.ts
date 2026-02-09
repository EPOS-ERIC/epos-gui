
export class FeatureCollectionGenerator {
  protected readonly featureTemplate = {
    type: 'Feature',
    properties: {
      'name': '',
      '@epos_type': 'episode',
      '@epos_label_key': 'name',
      '@epos_map_keys': ['@epos_type', 'name'],
      '@epos_data_keys': ['@epos_type', 'name'],
    },
    'geometry': {
      'type': 'Point',
      'coordinates': [0, 0],
    }
  };

  public create(featureCount = 10): {} {
    const startLat = 37;
    const startLon = -9;
    const latIncrement = 0.05;
    const lonIncrement = 0.05;


    const features = new Array<Record<string, unknown>>();
    const countStringLength = (featureCount - 1).toString().length;
    for (let i = 0; i < featureCount; i++) {
      const feature = JSON.parse(JSON.stringify(this.featureTemplate));
      feature.properties.name = 'Feature ' + i.toString().padStart(countStringLength, '0');
      feature.geometry.coordinates = [
        startLon + (lonIncrement * i),
        startLat + (latIncrement * i),
      ];
      features.push(feature);

    }

    return {
      'type': 'FeatureCollection',
      '@epos_style': {
        'episode': {
          'label': 'episode',
          'marker': {
            'pin': false,
            'clustering': false,
            'fontawesome_class': 'fa fa-star',
          }
        }
      },

      'features': features,
    };
  }
}
