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

    // 1. Save the original value before modifying it
    this.originalPathPane = L.Path.prototype.options.pane;

    // 2. Apply the patch (required by the leaflet-ruler plugin)
    L.Path.prototype.options.pane = 'rulerMeasure';

    this.measureControl = L.control.ruler(options).addTo(map);
    const container = this.measureControl.getContainer();

    if (container) {
      container.classList.add('measure-distance-button');
      const originalClick = container.onclick; // Save the plugin's original click event

      // Override the click to show the dialog
      container.onclick = async (event: MouseEvent) => {
        // Check the static flag
        if (MeasureDistanceControl.dialogShown) {
          // Dialog already shown, execute the original click
          if (originalClick) {
            originalClick.call(container, event);
          }
          return;
        }

        // If it's the first time, prevent default activation
        event.preventDefault();
        event.stopPropagation();

        (map.getContainer() as HTMLElement).blur();

        // Show the dialog
        await this.showMeasureDialog();

        // Set the static flag
        MeasureDistanceControl.dialogShown = true;

        // Now manually trigger the tool
        if (originalClick) {
          originalClick.call(container, event);
        }
      };
    }
    return this;
  }

  /**
     * Forcibly stops an active measurement and manually cleans up
     * all listeners, states, and styles (like 'leaflet-crosshair')
     * left behind by the leaflet-ruler plugin.
     *
     * This is a "hard reset" necessary to prevent state leaks (e.g., a stuck
     * crosshair cursor) when the map is destroyed or re-initialized
     * (e.g., switching projections).
     */
  /* eslint-disable no-underscore-dangle, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any */
  public stopMeasurement(): void {
    // Get the internal leaflet-ruler control instance.
    // We must use 'as any' to access its private, underscored properties.
    const rulerInstance = this.measureControl as any;

    // Safety check: Only proceed if the ruler instance and its associated map still exist.
    if (rulerInstance && rulerInstance._map) {
      // Get the L.Map instance
      const map = rulerInstance._map;
      // Get the main map <div> container element
      const container = map._container;

      // Check if the map container element exists
      if (container) {
        // KEY FIX: Reset the inline cursor style to default.
        // The plugin often sets 'cursor: crosshair' directly on the element's style.
        container.style.cursor = '';

        // Also remove the CSS class, just in case the plugin uses both methods.
        L.DomUtil.removeClass(container, 'leaflet-crosshair');
      }

      // --- Manually remove event listeners ---
      // We must check if the listener property (e.g., ._mousemove) exists before
      // trying to remove it, as the plugin only defines them *after* a measurement
      // has been started at least once.
      if (rulerInstance._mousemove) {
        L.DomEvent.off(container, 'mousemove', rulerInstance._mousemove, rulerInstance);
      }
      if (rulerInstance._mouseclick) {
        L.DomEvent.off(container, 'click', rulerInstance._mouseclick, rulerInstance);
      }
      if (rulerInstance._keydown) {
        // The keydown listener (for ESC) is attached to the document.
        L.DomEvent.off(document as any, 'keydown', rulerInstance._keydown, rulerInstance);
      }

      // Forcefully reset the plugin's internal state to 'not measuring'.
      if (rulerInstance._measuring) {
        rulerInstance._measuring = false;
      }

      // --- Clean up any leftover map layers ---
      // Remove any partially drawn measurement lines from the map.
      if (rulerInstance._currentLine) {
        map.removeLayer(rulerInstance._currentLine);
      }
      // Remove any measurement markers (points) from the map.
      if (rulerInstance._currentPoints) {
        rulerInstance._currentPoints.forEach((marker: L.Marker) => {
          map.removeLayer(marker);
        });
      }
      // Clear the plugin's internal references to the removed layers.
      rulerInstance._currentLine = null;
      rulerInstance._currentPoints = [];
    }
  }

  public remove(): this {
    this.stopMeasurement();

    if (this.measureControl) {
      this.measureControl.remove();
    }
    // Remove the custom pane
    if (this.measurePane && this.measurePane.parentNode) {
      this.measurePane.parentNode.removeChild(this.measurePane);
    }

    // Restore the original prototype value
    L.Path.prototype.options.pane = this.originalPathPane;

    return this;
  }

  /**
   * Displays the confirmation dialog with improved instructions.
   */
  private async showMeasureDialog(): Promise<boolean> {
    const message = `
      <p><b>Measure Tool Tips:</b></p>
      <p> To finish the current line, double-click or press ESC; </p>
      <p> To clear all measurements and close the tool, click the ruler icon again. </p>
    `;

    return this.dialogService.openConfirmationDialog(
      message,      // messageHtml
      true,        // closable
      'Got It',     // confirmButtonHtml
      'confirm',    // confirmButtonCssClass (valore di default)
    );
  }
}


// Type declarations for leaflet-ruler (unchanged)
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
