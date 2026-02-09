/* eslint-disable @typescript-eslint/dot-notation */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as L from 'leaflet';

// types in the geocoder seem very messed up at the moment.
// this might be becasue of our angular 12 switch
import * as ELG from 'esri-leaflet-geocoder';
import { FaMarker } from '../../marker/faMarker/faMarker';
import { AbstractControl } from '../abstractControl/abstractControl';
import { MarkerLayer } from '../../layers/markerLayer';
import { environment } from 'environments/environment';


export class SearchControl extends AbstractControl {

  constructor(protected showSearchResultsLayer = true) {
    super();
  }

  public addTo(
    leafletMapObj: L.Map,
  ): this {
    // add the clear button
    const control = document.createElement('div');
    control.classList.add('search-clear');
    control.classList.add('leaflet-control');
    control.classList.add('hidden');
    control.insertAdjacentHTML('beforeend', '<i class="fas fa-times"></i>');
    control.addEventListener('click', () => {
      this.eposLeaflet.removeLayerById('geosearch');
      control.classList.add('hidden');
    });
    setTimeout(() => {
      this.eposLeaflet.getElement()
        .getElementsByClassName('geocoder-control')[0]
        .insertAdjacentElement('afterend', control);
    }, 500);

    const searchControl: L.esri.Geocoding.Geosearch = ELG['geosearch']({
      providers: [
        ELG['arcgisOnlineProvider']({
          // ELG['GeocodeServiceProvider']({
          url: 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/',
          // API Key to be passed to the ArcGIS Online Geocoding Service
          token: environment.esriApiKey,
        })]
    } as L.esri.Geocoding.GeosearchObject);

    const searchResultsMarkers = new MarkerLayer('geosearch', 'Search Results');
    L.layerGroup().addTo(leafletMapObj);
    const markerIcon = new FaMarker()
      .configure(null, '#00a1ff')
      .configureIcon(['fas', 'fa-search'], '#ffffff');

    // have to cast due to dodgy esri leaflet types
    searchControl.on('results', ((data: L.esri.Geocoding.Results) => {
      if (data.results != null) {
        if (this.showSearchResultsLayer) {
          searchResultsMarkers.clearMarkers();
          data['results'].forEach((itemData: L.esri.Geocoding.ResultObject, index: number) => {
            searchResultsMarkers.addMarker(
              index.toString(),
              (itemData.latlng as L.LatLng).lat,
              (itemData.latlng as L.LatLng).lng,
              markerIcon,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              itemData.properties['LongLabel'] as string | HTMLElement,
            );
          });
          this.eposLeaflet.addLayer(searchResultsMarkers);
          // show clear icon
          this.eposLeaflet.getElement()
            .getElementsByClassName('search-clear')[0]
            .classList.remove('hidden');
        } else {
          // just go to the first
          if (data['results'].length > 0) {
            // needs a delay to avoid default functionality of fit bounds all results
            setTimeout(() => {
              // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
              const bounds = data.results[0].bounds!;
              this.eposLeaflet.fitBounds(bounds);
            }, 500);
          }
        }
      }
    }) as unknown as L.LeafletEventHandlerFn);
    searchControl.setPosition(this.getPosition());
    searchControl.addTo(leafletMapObj);
    return this;
  }
}
