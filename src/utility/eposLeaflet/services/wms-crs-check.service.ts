/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/member-ordering */
// wms-crs-check.service.ts
import { Injectable } from '@angular/core';
import { MapLayer } from 'utility/eposLeaflet/eposLeaflet';

export type WmsCrsCheckRow = {
    layerId?: string;
    layerName: string;
    subLayer: string;
    crs: string;
    status: boolean;
};

@Injectable({ providedIn: 'root' })
export class WmsCrsCheckService {

    // piccola utility, lint-friendly
    private async waitForWmsInvoker(
        layer: MapLayer,
        timeoutMs = 60000,
        intervalMs = 120
    ): Promise<((crs: string) => Promise<WmsCrsCheckRow[]>) | null> {
        const start = Date.now();

        const ready = (layer as any)?.crsCheckReady as Promise<void> | undefined;
        if (ready) {
            try {
                await ready;
                // eslint-disable-next-line no-empty
            } catch { }
        }

        return new Promise(resolve => {
            const tick = () => {
                const fn = (layer as any)?.checkCrsCompatibility as
                    | ((crs: string) => Promise<WmsCrsCheckRow[]>)
                    | undefined;

                if (typeof fn === 'function') {
                    resolve(fn);
                    return;
                }
                if (Date.now() - start >= timeoutMs) {
                    resolve(null);
                    return;
                }
                setTimeout(tick, intervalMs);
            };
            tick();
        });
    }

    public async runForLayers(
        layers: MapLayer[],
        crsCode: string
    ): Promise<WmsCrsCheckRow[]> {
        const checks: Promise<WmsCrsCheckRow[]>[] = [];
        for (const l of layers) {
            const invoker = await this.waitForWmsInvoker(l);
            if (invoker) {
                checks.push(invoker(crsCode));
            }
        }
        if (checks.length === 0) { return []; }
        const resultsArrays = await Promise.all(checks);
        return resultsArrays.flat();
    }
}
