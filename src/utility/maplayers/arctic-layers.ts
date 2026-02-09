import { Injector } from '@angular/core';
import { MapLayer } from 'utility/eposLeaflet/eposLeaflet';
import { BehaviorSubject } from 'rxjs';
import { Style } from 'utility/styler/style';
import { Stylable } from 'utility/styler/stylable.interface';
import * as L from 'leaflet';
import * as esri from 'esri-leaflet';

/**
 * Layer for Arctic bathymetric contours (Tiled Service)
 */
export class ArcticContoursLayer extends MapLayer {
    public supportedCRS: string[] = ['EPSG:3995'];

    constructor(injector: Injector) {
        // Calls the base class constructor with ID and name
        super('arctic-contours', 'Contours');
        this.visibleOnLayerControl.set(true);
        this.options.pane.set('arcticOverlays');

        // Creates a default style with enable = true
        const defaultStyle = new Style('#FFFFFF'); // The color is not important here
        defaultStyle.setEnable(true);
        defaultStyle.setOpacityColor1(0.8);

        // Creates a Stylable object and sets the style
        const stylable = new SimpleStylable();
        stylable.setStyle(defaultStyle);

        // Assigns the Stylable to the layer options
        this.options.customLayerOptionStylable.set(stylable);
    }

    /**
     * Implements the abstract method required by the MapLayer class.
     * Its task is to create and return the actual L.TileLayer object.
     */
    protected getLeafletLayer(): Promise<null | L.Layer> {
        const leafletLayer = L.tileLayer(
            'https://tiles.arcgis.com/tiles/C8EMgrsFcRFL6LrL/arcgis/rest/services/arctic_bathymetry_contours/MapServer/tile/{z}/{y}/{x}', {
            attribution: '© Esri, GEBCO, NOAA',
            maxNativeZoom: 9,
            minNativeZoom: 1,
            pane: 'arcticOverlays',
        }
        );
        // The base class expects a Promise, so we wrap the result.
        return Promise.resolve(leafletLayer);
    }
}

/**
 * Layer for Arctic geographic references (Dynamic Service)
 */
export class ArcticReferenceLayer extends MapLayer {
    public supportedCRS: string[] = ['EPSG:3995'];

    constructor(injector: Injector) {
        super('arctic-reference', 'Reference');
        this.visibleOnLayerControl.set(true);
        this.options.pane.set('arcticOverlays');

        // Creates a default style with enable = true
        const defaultStyle = new Style('#FFFFFF'); // The color is not important here
        defaultStyle.setEnable(true);
        defaultStyle.setOpacityColor1(0.8);

        // Creates a Stylable object and sets the style
        const stylable = new SimpleStylable();
        stylable.setStyle(defaultStyle);

        // Assigns the Stylable to the layer options
        this.options.customLayerOptionStylable.set(stylable);
    }

    protected getLeafletLayer(): Promise<null | L.Layer> {
        const leafletLayer = esri.dynamicMapLayer({
            url: 'https://gis.ngdc.noaa.gov/arcgis/rest/services/arctic_ps/reference/MapServer',
            useCors: false,
            pane: 'arcticOverlays'
        });
        return Promise.resolve(leafletLayer);
    }
}

// --- Classes for the Multi-Resolution Graticule ---

// in file: utility/maplayers/arctic-layers.ts

// ... (le altre classi e importazioni rimangono invariate) ...

export class SmartGraticuleLayer extends MapLayer {
    public supportedCRS: string[] = ['EPSG:3995'];

    constructor(injector: Injector) {
        // Il nome e l'ID rimangono gli stessi per l'utente
        super('smart-graticule', 'Graticule');
        this.visibleOnLayerControl.set(true);
        this.options.pane.set('arcticOverlays');

        // Creates a default style with enable = true
        const defaultStyle = new Style('#FFFFFF'); // The color is not important here
        defaultStyle.setEnable(true);
        defaultStyle.setOpacityColor1(0.6);

        // Creates a Stylable object and sets the style
        const stylable = new SimpleStylable();
        stylable.setStyle(defaultStyle);

        // Assigns the Stylable to the layer options
        this.options.customLayerOptionStylable.set(stylable);
    }

    /**
     * Questo metodo ora crea un singolo layer dinamico invece del gruppo.
     */
    protected getLeafletLayer(): Promise<null | L.Layer> {
        const leafletLayer = esri.dynamicMapLayer({
            url: 'https://gis.ngdc.noaa.gov/arcgis/rest/services/arctic_ps/graticule/MapServer',
            useCors: false,
        });

        leafletLayer.options.pane = 'arcticOverlays';

        return Promise.resolve(leafletLayer);
    }
}

class SimpleStylable implements Stylable {
    private readonly styleSrc = new BehaviorSubject<null | Style>(null);
    // eslint-disable-next-line @typescript-eslint/member-ordering
    public readonly styleObs = this.styleSrc.asObservable();

    public setStyle(style: null | Style): void {
        this.styleSrc.next(style);
    }
    public getStyle(): null | Style {
        return this.styleSrc.value;
    }
}
