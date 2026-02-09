import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';

@Injectable({ providedIn: 'root' })
export class MenuService {

  dataMap = new Map<string, MenuItem[]>([]);

  rootLevelNodes: MenuItem[] = environment.mainMenu;

  getChildren(node: MenuItem): Array<MenuItem> {
    return node.children ?? [];
  }

  isExpandable(node: MenuItem): boolean {
    return this.getChildren(node).length > 0;
  }
}

export interface MenuItem {
  name: string;
  url?: string;
  action?: string;
  children?: Array<MenuItem>;
  icon?: string;
}
