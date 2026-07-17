import { DialogService } from 'components/dialog/dialog.service';
import * as L from 'leaflet';
import 'leaflet-ruler';

export class MeasureDistanceControl extends L.Control {
  private static dialogShown = false;

  private measureControl: L.Control.Ruler;
  private measurePane: HTMLElement;
  private originalPathPane: string | undefined;

  constructor(
    private dialogService: DialogService,
  ) {
    super({ position: 'topright' });
  }

  public addTo(map: L.Map): this {
    this.measurePane = map.createPane('rulerMeasure');
    this.measurePane.style.zIndex = '600';
    this.measurePane.style.pointerEvents = 'none';

    const options: L.Control.RulerOptions = {
      position: 'topright',
      pane: 'rulerMeasure',
      lengthUnit: {
        factor: 1,
        display: 'km',
        decimal: 2,
        label: 'Distance',
      },
      circleMarker: {
        color: 'red',
        radius: 4,
      },
      lineStyle: {
        color: 'red',
        dashArray: '5, 5',
      },
      measureArea: false,
    };

    this.originalPathPane = L.Path.prototype.options.pane;
    L.Path.prototype.options.pane = 'rulerMeasure';

    this.measureControl = L.control.ruler(options).addTo(map);
    const container = this.measureControl.getContainer();

    if (container) {
      container.classList.add('measure-distance-button');
      const originalClick = container.onclick;

      container.onclick = async (event: MouseEvent) => {
        if (MeasureDistanceControl.dialogShown) {
          if (originalClick) {
            originalClick.call(container, event);
          }
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        (map.getContainer() as HTMLElement).blur();
        await this.showMeasureDialog();
        MeasureDistanceControl.dialogShown = true;

        if (originalClick) {
          originalClick.call(container, event);
        }
      };
    }
    return this;
  }

  /* eslint-disable no-underscore-dangle, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any */
  public stopMeasurement(): void {
    const rulerInstance = this.measureControl as any;

    if (rulerInstance && rulerInstance._map) {
      const map = rulerInstance._map;
      const container = map._container;

      if (container) {
        container.style.cursor = '';
        L.DomUtil.removeClass(container, 'leaflet-crosshair');
      }

      if (rulerInstance._mousemove) {
        L.DomEvent.off(container, 'mousemove', rulerInstance._mousemove, rulerInstance);
      }
      if (rulerInstance._mouseclick) {
        L.DomEvent.off(container, 'click', rulerInstance._mouseclick, rulerInstance);
      }
      if (rulerInstance._keydown) {
        L.DomEvent.off(document as any, 'keydown', rulerInstance._keydown, rulerInstance);
      }

      if (rulerInstance._measuring) {
        rulerInstance._measuring = false;
      }

      if (rulerInstance._currentLine) {
        map.removeLayer(rulerInstance._currentLine);
      }
      if (rulerInstance._currentPoints) {
        rulerInstance._currentPoints.forEach((marker: L.Marker) => {
          map.removeLayer(marker);
        });
      }
      rulerInstance._currentLine = null;
      rulerInstance._currentPoints = [];
    }
  }

  public remove(): this {
    this.stopMeasurement();

    if (this.measureControl) {
      this.measureControl.remove();
    }
    if (this.measurePane && this.measurePane.parentNode) {
      this.measurePane.parentNode.removeChild(this.measurePane);
    }

    L.Path.prototype.options.pane = this.originalPathPane;

    return this;
  }

  private async showMeasureDialog(): Promise<boolean> {
    const message = `
      <p><b>Measure Tool Tips:</b></p>
      <p> To finish the current line, double-click or press ESC; </p>
      <p> To clear all measurements and close the tool, click the ruler icon again. </p>
    `;

    return this.dialogService.openConfirmationDialog(
      message,
      true,
      'Got It',
      'confirm',
    );
  }
}

declare module 'leaflet' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Control {
    interface RulerOptions extends ControlOptions {
      measureArea?: boolean;
      circleMarker?: {
        color: string;
        radius: number;
      };
      lineStyle?: {
        color: string;
        dashArray: string;
      };
      polyStyle?: {
        stroke: boolean;
        fillColor: string;
        fillOpacity: number;
      };
      lengthUnit?: {
        display: string;
        decimal: number;
        factor: number;
        label?: string;
      };
      pane?: string;
    }

    interface Ruler extends Control {
      remove(): this;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace control {
    function ruler(options?: Control.RulerOptions): Control.Ruler;
  }
}
