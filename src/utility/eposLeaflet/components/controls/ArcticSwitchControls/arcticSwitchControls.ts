import * as L from 'leaflet';
import { AbstractControl } from '../abstractControl/abstractControl';

/**
 * ArcticSwitchControls is a custom Leaflet control that toggles
 * between a standard Web Mercator view (EPSG:3857) and an Arctic polar projection (EPSG:3995).
 *
 * Button behavior:
 *  - If currently in Web Mercator (3857) -> shows ❄️ (snowflake), tooltip "Switch projection to Arctic (EPSG:3857 → EPSG:3995)"
 *  - If currently in Arctic (3995)       -> shows 🗺️ (map),       tooltip "Switch projection to Web Mercator (EPSG:3995 → EPSG:3857)"
 */
export class ArcticSwitchControls extends AbstractControl {
  private iconElement: HTMLElement | null = null;

  constructor(
    private isArctic: boolean, // true => EPSG:3995; false => EPSG:3857
    private onSwitchProjection: (useArctic: boolean) => void
  ) {
    super({ position: 'topright' });
  }

  public onAdd(map: L.Map): HTMLElement {
    const controlContainer = this.getControlContainer(
      'arctic-switch-control',
      '', // icon injected manually
      '', // tooltip injected manually
      document.createElement('div')
    );

    const title = this.isArctic
      ? 'Switch projection to Web Mercator (EPSG:3857)'
      : 'Switch projection to Arctic (EPSG:3995)';

    // Initialize the full HTML content of the button
    controlContainer.innerHTML = `
      <div class="icon-wrapper" title="${title}" aria-label="${title}" role="button" tabindex="0">
        <i class="${this.isArctic ? 'fa fa-map' : 'fa fa-snowflake'}" aria-hidden="true"></i>
      </div>
    `;

    this.iconElement = controlContainer.querySelector('.icon-wrapper i');

    const switchButton = controlContainer.querySelector('.icon-wrapper');

    const activate = () => {
      // Toggle state: false (3857) -> true (3995) and vice versa
      this.isArctic = !this.isArctic;
      this.onSwitchProjection(this.isArctic);

      // Update icon (map when Arctic, snowflake when Web Mercator)
      if (this.iconElement) {
        this.iconElement.className = this.isArctic ? 'fa fa-map' : 'fa fa-snowflake';
      }

      // Update tooltip/aria-label with the correct direction
      const nextTitle = this.isArctic
        ? 'Switch projection to Web Mercator (EPSG:3857)'
        : 'Switch projection to Arctic (EPSG:3995)';

      switchButton?.setAttribute('title', nextTitle);
      switchButton?.setAttribute('aria-label', nextTitle);
    };

    // Click and keyboard activation
    switchButton?.addEventListener('click', activate);
    switchButton?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activate();
      }
    });

    return controlContainer;
  }
}
