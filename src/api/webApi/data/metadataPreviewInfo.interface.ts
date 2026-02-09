export interface metadataPreviewInfo{
    active: boolean;
    selectedStatuses: {
        published: boolean;
        draft: boolean;
        submitted: boolean;
        archived: boolean;
    };
}
