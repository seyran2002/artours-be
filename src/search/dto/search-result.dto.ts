export enum SearchResultType {
    TOUR = 'tour',
    LOCATION = 'location',
    TRANSFER = 'transfer',
}

export class SearchResult {
    id: string;
    type: SearchResultType;
    slug: string;
    enTitle: string;
    ruTitle: string;
    hyTitle: string;
    image: string;
    features?: any;
}

export class PaginatedSearchResponse {
    page: number;
    limit: number;
    total: number;
    data: SearchResult[];
}
