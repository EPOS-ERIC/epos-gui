import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import type { Trace } from '../modules/graphPanel/objects/trace';
import type { YAxisDisplayType } from '../modules/graphPanel/objects/yAxisDisplayType.enum';

export interface InteractiveVisualisationTable {
  groupId: string;
  groupName: string;
  rows: Array<Record<string, unknown>>;
  isMappable?: boolean;
}

export interface InteractiveVisualisationSource {
  kind: 'interactive';
  id: string;
  name: string;
  groupId: string;
  traces: null | Array<Trace>;
  table?: InteractiveVisualisationTable;
  autoSelect?: boolean;
  preferredDisplayType?: YAxisDisplayType;
  metadata?: Record<string, unknown>;
}

export interface InteractiveVisualisationTableGroup {
  id: string;
  name: string;
  sources: Array<InteractiveVisualisationSource>;
}

@Injectable({
  providedIn: 'root',
})
export class InteractiveVisualisationService {
  public readonly sourcesObs: Observable<Map<string, InteractiveVisualisationSource>>;
  public readonly highlightedSourceObs: Observable<null | string>;
  public readonly sourceStyleObs: Observable<{ id: string; color: null | string }>;
  public readonly sourceRemovedObs: Observable<string>;
  public readonly viewSourceOnGraphObs: Observable<string>;
  public readonly viewSourceOnMapObs: Observable<string>;

  private readonly sourcesSrc = new BehaviorSubject<Map<string, InteractiveVisualisationSource>>(new Map());
  private readonly highlightedSourceSrc = new BehaviorSubject<null | string>(null);
  private readonly sourceStyleSrc = new Subject<{ id: string; color: null | string }>();
  private readonly sourceRemovedSrc = new Subject<string>();
  private readonly viewSourceOnGraphSrc = new Subject<string>();
  private readonly viewSourceOnMapSrc = new Subject<string>();

  constructor() {
    this.sourcesObs = this.sourcesSrc.asObservable();
    this.highlightedSourceObs = this.highlightedSourceSrc.asObservable();
    this.sourceStyleObs = this.sourceStyleSrc.asObservable();
    this.sourceRemovedObs = this.sourceRemovedSrc.asObservable();
    this.viewSourceOnGraphObs = this.viewSourceOnGraphSrc.asObservable();
    this.viewSourceOnMapObs = this.viewSourceOnMapSrc.asObservable();
  }

  public setSource(source: InteractiveVisualisationSource): void {
    const sources = new Map(this.sourcesSrc.value);
    sources.set(source.id, source);
    this.sourcesSrc.next(sources);
  }

  public getSource(id: string): InteractiveVisualisationSource | undefined {
    return this.sourcesSrc.value.get(id);
  }

  public getSources(): Array<InteractiveVisualisationSource> {
    return Array.from(this.sourcesSrc.value.values());
  }

  public removeSource(id: string): void {
    const sources = new Map(this.sourcesSrc.value);
    if (!sources.delete(id)) {
      this.sourceRemovedSrc.next(id);
      return;
    }
    if (this.highlightedSourceSrc.value === id) {
      this.highlightedSourceSrc.next(null);
    }
    this.sourcesSrc.next(sources);
    this.sourceRemovedSrc.next(id);
  }

  public clearSources(groupId?: string): void {
    const ids = Array.from(this.sourcesSrc.value.values())
      .filter(source => groupId == null || source.groupId === groupId)
      .map(source => source.id);
    if (ids.length === 0) {
      return;
    }
    const sources = new Map(this.sourcesSrc.value);
    ids.forEach(id => sources.delete(id));
    if (this.highlightedSourceSrc.value != null && ids.includes(this.highlightedSourceSrc.value)) {
      this.highlightedSourceSrc.next(null);
    }
    this.sourcesSrc.next(sources);
    ids.forEach(id => this.sourceRemovedSrc.next(id));
  }

  public setHighlightedSource(id: null | string): void {
    this.highlightedSourceSrc.next(id);
  }

  public setSourceStyle(id: string, color: null | string): void {
    this.sourceStyleSrc.next({ id, color });
  }

  public viewSourceOnGraph(id: string): void {
    this.viewSourceOnGraphSrc.next(id);
  }

  public viewSourceOnMap(id: string): void {
    this.viewSourceOnMapSrc.next(id);
  }
}
