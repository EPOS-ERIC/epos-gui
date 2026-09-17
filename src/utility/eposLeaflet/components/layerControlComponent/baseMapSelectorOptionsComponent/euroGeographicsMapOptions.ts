export type EuroGeographicsMapOption = {
    id: string;
    name: string;
    wmsUrl: string;
    datasetUrl: string;
    thumbnailSource?: string;
    supportedCRS: string[];
  };

  const DEFAULT_BBOX = '10.1919994354248,-49.8610000610352,75.8440017700195,41.7430000305176';
  const COMMON_WMS_PREFIX = `https://gateway-service:5000/api/v1/layers/eurogeographics/maps?service=WMS&version=1.3.0&request=GetMap&crs=EPSG%3A3857&format=image%2Fpng&styles=default&width=800&height=600&bbox=${DEFAULT_BBOX}`;

  export const euroGeographicsMapOptions: EuroGeographicsMapOption[] = [
    {
      id: 'euro-dem',
      name: 'Euro Dem',
      wmsUrl: `${COMMON_WMS_PREFIX}&layers=eurodem`,
      datasetUrl: 'https://www.mapsforeurope.org/datasets/euro-dem',
      thumbnailSource: 'assets/img/baseLayerEuroGeographics/EuroDEM.png',
      supportedCRS: ['EPSG:3857'],
    },
    {
      id: 'euro-global-map',
      name: 'Euro Global Map',
      wmsUrl: `${COMMON_WMS_PREFIX}&layers=egm`,
      datasetUrl: 'https://www.mapsforeurope.org/datasets/euro-global-map',
      thumbnailSource: 'assets/img/baseLayerEuroGeographics/EuroGlobalMap.png',
      supportedCRS: ['EPSG:3857'],
    },
    {
      id: 'euro-regional-map',
      name: 'Euro Regional Map',
      wmsUrl: `${COMMON_WMS_PREFIX}&layers=erm`,
      datasetUrl: 'https://www.mapsforeurope.org/datasets/euro-regional-map',
      thumbnailSource: 'assets/img/baseLayerEuroGeographics/EuroRegionalMap.png',
      supportedCRS: ['EPSG:3857'],
    },
    {
      id: 'hvlsp-all',
      name: 'High-value large-scale pan European prototype',
      wmsUrl: `${COMMON_WMS_PREFIX}&layers=hvlsp_all`,
      datasetUrl: 'https://www.mapsforeurope.org/datasets/hvlsp',
      thumbnailSource: 'assets/img/baseLayerEuroGeographics/EuroHVLSP.png',
      supportedCRS: ['EPSG:3857'],
    },
    {
      id: 'cadastral-all',
      name: 'Open Cadastral Map',
      wmsUrl: `${COMMON_WMS_PREFIX}&layers=cadastral_all`,
      datasetUrl: 'https://www.mapsforeurope.org/datasets/cadastral-all',
      thumbnailSource: 'assets/img/baseLayerEuroGeographics/EuroOpenCadastralMap.png',
      supportedCRS: ['EPSG:3857'],
    },
    {
      id: 'open-gazetteer',
      name: 'Open Gazetteer',
      wmsUrl: `${COMMON_WMS_PREFIX}&layers=open_gazetteer`,
      datasetUrl: 'https://www.mapsforeurope.org/datasets/open-gazetteer',
      thumbnailSource: 'assets/img/baseLayerEuroGeographics/EuroOpenGazetteer.png',
      supportedCRS: ['EPSG:3857'],
    },
    {
      id: 'pan-european-imagery',
      name: 'Pan European Imagery',
      wmsUrl: `https://gateway-service:5000/api/v1/layers/eurogeographics/pan-european-imagery?service=WMS&version=1.3.0&request=GetMap&layers=meta&styles=default&crs=EPSG%3A3857&width=800&height=600&format=image%2Fpng&bbox=${DEFAULT_BBOX}`,
      datasetUrl: 'https://www.mapsforeurope.org/datasets/pan-european-imagery',
      thumbnailSource: 'assets/img/baseLayerEuroGeographics/EuroPanEuropeanImagery.png',
      supportedCRS: ['EPSG:3857'],
    },
  ];
