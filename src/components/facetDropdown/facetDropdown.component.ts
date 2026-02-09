import { SelectionModel } from '@angular/cdk/collections';
import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { DistributionLevel } from 'api/webApi/data/distributionLevel.interface';
import { DistributionSummary } from 'api/webApi/data/distributionSummary.interface';
import { Facet } from 'api/webApi/data/facet.interface';
import { FacetModel } from 'api/webApi/data/facetModel.interface';
import { Subscription } from 'rxjs';
import { ResultsPanelService } from 'pages/dataPortal/services/resultsPanel.service';
import { FacetSelectionPersistorService } from './facetSelectionPersistor.service';
import { Unsubscriber } from 'decorators/unsubscriber.decorator';
import { Domain } from 'api/webApi/data/domain.interface';
import { Tracker } from 'utility/tracker/tracker.service';
import { TrackerAction, TrackerCategory } from 'utility/tracker/tracker.enum';

@Unsubscriber('subscriptions')
@Component({
  selector: 'app-facet-dropdown',
  templateUrl: './facetDropdown.component.html',
  styleUrls: ['./facetDropdown.component.scss']
})
export class FacetDropdownComponent {

  private rawFacetModel: FacetModel<DistributionSummary>;
  public activeDomain: Domain;
  @Input()
  set rawTreeData(distFacetModelSource: FacetModel<DistributionSummary> | null) {
    if (null != distFacetModelSource) {
      this.rawFacetModel = distFacetModelSource;
    }
    if (null != this.activeDomain) {
      this.checklistSelection.clear();
      this.createNestedTreeObjectArray(this.rawFacetModel);
    }
  }

  @Input()
  set activeDomainData(active: Domain | null) {
    if (null != active) {
      this.activeDomain = active;
    }
    if (null != this.rawFacetModel) {
      this.createNestedTreeObjectArray(this.rawFacetModel);
    }
  }

  @Input() public facetExpansionHidden: boolean;
  @Output() setSelectedFacets = new EventEmitter<Array<FacetFlatNode>>();

  public hasChild = (_: number, node: FacetFlatNode): boolean => node.expandable;

  private getLevel = (node: FacetFlatNode): number => node.level;

  private isExpandable = (node: FacetFlatNode): boolean => node.expandable;

  private getChildren = (node: DistributionLevel): DistributionLevel[] => node.children!;

  public checklistSelection = new SelectionModel<FacetFlatNode>(true);

  /** Map from flat node to nested node. This helps us finding the nested node to be modified */
  private flatNodeMap = new Map<FacetFlatNode, DistributionLevel>();

  /** Map from nested node to flattened node. This helps us to keep the same object for selection */
  private nestedNodeMap = new Map<DistributionLevel, FacetFlatNode>();

  private transformer = (node: DistributionLevel): FacetFlatNode => {
    const existingNode = this.nestedNodeMap.get(node);
    const flatNode: FacetFlatNode =
      existingNode && existingNode.name === node.value ? existingNode : new FacetFlatNode();
    flatNode.name = node.value;
    flatNode.level = node.level!;
    flatNode.expandable = !!node.children?.length;
    flatNode.count = node.count!;
    flatNode.distId = node.distId!;
    flatNode.parentName = node.parentName!;
    this.flatNodeMap.set(flatNode, node);
    this.nestedNodeMap.set(node, flatNode);
    return flatNode;
  };

  public treeControl: FlatTreeControl<FacetFlatNode>;

  private treeFlattener: MatTreeFlattener<DistributionLevel, FacetFlatNode>;

  public dataSource: MatTreeFlatDataSource<DistributionLevel, FacetFlatNode>;

  private subscriptions: Array<Subscription> = [];

  constructor(
    private readonly resultPanelService: ResultsPanelService,
    private readonly facetSelectionPersistor: FacetSelectionPersistorService,
    private readonly tracker: Tracker,
  ) {
    this.treeFlattener = new MatTreeFlattener(
      this.transformer,
      this.getLevel,
      this.isExpandable,
      this.getChildren,
    );
    this.treeControl = new FlatTreeControl<FacetFlatNode>(this.getLevel, this.isExpandable);
    this.subscriptions.push(
      this.checklistSelection.changed.subscribe(() => {
        this.storeDomainSpecificFacetSelection(this.activeDomain);
        this.setSelectedFacets.emit(this.checklistSelection.selected);
      }),
      this.resultPanelService.clearFacetSelectionObs.subscribe(() => {
        this.checklistSelection.clear();
      }),
      this.resultPanelService.triggerFacetSelectionObs.subscribe((facet: string) => {
        const facetFlatNodeArr = this.treeControl.dataNodes;
        const selectedfacetFlatNode = facetFlatNodeArr.find((node: FacetFlatNode) => node.name === facet);
        if (null != selectedfacetFlatNode) {
          this.facetItemSelectionSelect(selectedfacetFlatNode);
        }
      }),
    );
  }

  /* Filters Data for correct domain then creates tree object array to display */
  private createNestedTreeObjectArray(distFacetModelSource: FacetModel<DistributionSummary> | null): void {
    const treeData = new Array<DistributionLevel>();
    if (distFacetModelSource != null) {
      distFacetModelSource.roots().forEach((root: Facet<DistributionSummary>) => {
        root.getChildren().filter((rootDomain) => rootDomain.getName() === this.activeDomain.title).forEach((rootChild) => {
          const distributionLevel = this.recursiveNestedTreeObjectArray(rootChild, 0);
          treeData.push(distributionLevel);
        });
      });
    }
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
    this.dataSource.data = treeData;
    this.retrieveDomainSpecificFacetSelection();
  }


  private recursiveNestedTreeObjectArray(facet: Facet<DistributionSummary>, levelNum: number): DistributionLevel {

    const newlevel: DistributionLevel = {
      id: levelNum,
      value: facet.getName(),
      level: levelNum,
      count: facet.getFlatData().length,
      children: [],
      distId: facet.getIdentifier(),
      parentName: facet.getName(),
    };

    levelNum++;

    let count = 0;
    facet.getChildren().forEach((levelItem: Facet<DistributionSummary>) => {

      count += levelItem.getFlatData().length;
      const child = this.recursiveNestedTreeObjectArray(levelItem, levelNum);
      if (child !== null && newlevel.children !== undefined) {
        newlevel.children.push(child);
      }

    });

    if (count < facet.getFlatData().length && newlevel.children!.length > 0) {
      const levelNo: DistributionLevel = {
        id: levelNum,
        value: '',
        level: levelNum,
        count: facet.getFlatData().length - count,
        children: [],
        distId: facet.getIdentifier(),
        parentName: facet.getName(),
      };
      if (newlevel.children !== undefined) {
        newlevel.children.unshift(levelNo);
      }
    }
    return newlevel;
  }

  /* Checks all the parents when a leaf node is selected/unselected */
  private checkAllParentsSelection(node: FacetFlatNode): void {
    let parent: FacetFlatNode | null = this.getParentNode(node);
    while (parent) {
      this.checkRootNodeSelection(parent);
      parent = this.getParentNode(parent);
    }
  }

  /** Stores facets to retrieve when respective domain is selected again.
   * Needs timeout to allow for output to emit changes and facet selection to clear when changing domain.
   */
  private storeDomainSpecificFacetSelection(domain: Domain): void {
    setTimeout(() => {
      if (this.activeDomain === domain) {
        this.facetSelectionPersistor.setFacets(domain.title ?? '', this.checklistSelection.selected);
      }
    });
  }

  /** Retrives facets accosociated to active domain out of storage and applies them */
  private retrieveDomainSpecificFacetSelection(): void {
    const persistedNodes = this.facetSelectionPersistor.getFacets(this.activeDomain.title ?? '');
    if (null != persistedNodes) {
      const facetFlatNodeArr = this.treeControl.dataNodes;
      const selectedfacetFlatNode = facetFlatNodeArr.filter((initialNode) =>
        persistedNodes.some((persistedNode) => persistedNode.name === initialNode.name && initialNode.parentName === persistedNode.parentName));
      if (null != selectedfacetFlatNode) {
        this.checklistSelection.select(...selectedfacetFlatNode);
        if (selectedfacetFlatNode.length === 0) {
          this.setSelectedFacets.emit(this.checklistSelection.selected);
        }
      }
    }
  }

  /** Check root node checked state and change it accordingly */
  private checkRootNodeSelection(node: FacetFlatNode): void {
    const nodeSelected = this.checklistSelection.isSelected(node);
    const descendants = this.treeControl.getDescendants(node);
    const descAllSelected =
      descendants.length > 0 &&
      descendants.every(child => {
        return this.checklistSelection.isSelected(child);
      });
    if (nodeSelected && !descAllSelected) {
      this.checklistSelection.deselect(node);
    } else if (!nodeSelected && descAllSelected) {
      this.checklistSelection.select(node);
    }
  }

  /* Get the parent node of a node */
  private getParentNode(node: FacetFlatNode): FacetFlatNode | null {
    const currentLevel = this.getLevel(node);

    if (currentLevel < 1) {
      return null;
    }

    const startIndex = this.treeControl.dataNodes.indexOf(node) - 1;

    for (let i = startIndex; i >= 0; i--) {
      const currentNode = this.treeControl.dataNodes[i];

      if (this.getLevel(currentNode) < currentLevel) {
        return currentNode;
      }
    }
    return null;
  }


  /**
   * The function facetItemSelectionToggle toggles the selection of a facet item and updates the
   * selection status of its descendants and parent nodes.
   * @param {FacetFlatNode} node - The `node` parameter in the `facetItemSelectionToggle` function
   * represents a `FacetFlatNode` object, which is used to toggle the selection state of a node in a
   * facet tree.
   */
  public facetItemSelectionToggle(node: FacetFlatNode): void {
    this.checklistSelection.toggle(node);
    const descendants = this.treeControl.getDescendants(node);
    this.checklistSelection.isSelected(node)
      ? this.checklistSelection.select(...descendants)
      : this.checklistSelection.deselect(...descendants);

    // Force update for the parent
    descendants.forEach(child => this.checklistSelection.isSelected(child));
    this.checkAllParentsSelection(node);

    this.tracker.trackEvent(TrackerCategory.FILTER, this.checklistSelection.isSelected(node) ? TrackerAction.ADD_CATEGORY : TrackerAction.REMOVE_CATEGORY, this.activeDomain.code + Tracker.TARCKER_DATA_SEPARATION + node.name);
  }

  /**
   * The function `facetItemSelectionSelect` clears the checklist selection, selects a node, selects or
   * deselects its descendants based on the node's selection status, updates the parent selection, and
   * checks all parent selections.
   * @param {FacetFlatNode} node - The `node` parameter in the `facetItemSelectionSelect` function
   * represents a single node in a tree structure. It is of type `FacetFlatNode`.
   */
  public facetItemSelectionSelect(node: FacetFlatNode): void {

    this.checklistSelection.clear();

    this.checklistSelection.select(node);
    const descendants = this.treeControl.getDescendants(node);
    this.checklistSelection.isSelected(node)
      ? this.checklistSelection.select(...descendants)
      : this.checklistSelection.deselect(...descendants);

    // Force update for the parent
    descendants.forEach(child => this.checklistSelection.isSelected(child));
    this.checkAllParentsSelection(node);
  }

  /**
   * The function `descendantsAllSelected` checks if all descendants of a given node are selected in a
   * tree control.
   * @param {FacetFlatNode} node - The `node` parameter in the `descendantsAllSelected` function
   * represents a single node in a tree structure. This function is checking if all the descendants of
   * the given node are selected based on the selection status maintained by `checklistSelection` and
   * the tree control.
   * @returns The function `descendantsAllSelected` returns a boolean value indicating whether all
   * descendants of the given `node` are selected.
   */
  public descendantsAllSelected(node: FacetFlatNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const numSelected = descendants.filter(d => this.checklistSelection.isSelected(d)).length;
    return numSelected === descendants.length;
  }

  /**
   * The function `descendantsPartiallySelected` checks if some but not all descendants of a given node
   * are selected.
   * @param {FacetFlatNode} node - The `node` parameter in the `descendantsPartiallySelected` function
   * represents a node in a tree structure. This function is checking if any of the descendants of the
   * given node are partially selected, meaning some but not all of its descendants are selected.
   * @returns The function `descendantsPartiallySelected` returns a boolean value.
   */
  public descendantsPartiallySelected(node: FacetFlatNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const numSelected = descendants.filter(d => this.checklistSelection.isSelected(d)).length;

    return numSelected > 0
      && numSelected !== descendants.length;
  }

}
export class FacetFlatNode {
  name: string;
  level: number;
  expandable = false;
  count: number;
  distId: string;
  parentName: string;
}
