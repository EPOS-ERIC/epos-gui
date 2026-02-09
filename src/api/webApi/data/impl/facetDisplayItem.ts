/**
 * Display element representing a {@link Facet} item.
 */
export abstract class FacetDisplayItem {
    /** Whether it is hidden or not. */
    public isHidden = false;
    /** Reference to the item's parent. */
    private parent: FacetDisplayItem;

    /** Constructor. */
    constructor(
        /** Whether it is a leaf or not. */
        public readonly isLeaf: boolean,
        /** Identifier */
        public readonly id: string,
        /** Display label. */
        public readonly label: string,
        /** How deep in the facet tree it sits. */
        public readonly depth: number,
    ) { }

    /**
     * Sets its hidden status
     */
    public setHidden(hidden: boolean): void {
        this.isHidden = hidden;
    }

    /** Sets its parent object. */
    public setParent(parent: FacetDisplayItem): void {
        this.parent = parent;
    }
    /** Retrieves its parent object. */
    public getParent(): FacetDisplayItem {
        return this.parent;
    }
}
