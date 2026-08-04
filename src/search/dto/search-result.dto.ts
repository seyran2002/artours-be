export enum SearchResultType {
    TOUR = 'tour',
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
}

export class PaginatedSearchResponse {
    page: number;
    limit: number;
    total: number;
    data: SearchResult[];
}
