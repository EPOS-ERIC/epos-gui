import { MapLayer } from './mapLayer.abstract';

// currently abstract but could be real
export abstract class ImageOverlayLayer extends MapLayer {

  constructor(id: string, name?: string) {
    super(id, name);
    // Default options
    this.options.setOptions({
      pane: id,
      paneType: 'overlayPane'
    });

  }

}
