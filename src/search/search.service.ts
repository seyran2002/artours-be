import { Injectable } from '@nestjs/common';
import { TourService } from 'src/tour/tour.service';
import { TransferService } from 'src/transfer/transfer.service';
import {
    PaginatedSearchResponse,
    SearchResult,
    SearchResultType,
} from './dto/search-result.dto';

interface CountCacheEntry {
    tourTotal: number;
    transferTotal: number;
    cachedAt: number; // Date.now()
}

/** Count results are cached per unique query string for this many milliseconds. */
const COUNT_TTL_MS = 60_000; // 60 seconds

@Injectable()
export class SearchService {
    private readonly countCache = new Map<string, CountCacheEntry>();

    constructor(
        private readonly tourService: TourService,
        private readonly transferService: TransferService,
    ) { }

    async search(
        q: string,
        page: number = 1,
        limit: number = 10,
    ): Promise<PaginatedSearchResponse> {
        const safePage = Math.max(1, page);
        const safeLimit = Math.max(1, limit);

        // Each dataset gets half the limit (rounded up for odd numbers)
        const perType = Math.max(1, Math.ceil(safeLimit / 2));
        const skip = (safePage - 1) * perType;

        // Normalise the cache key (trim + lowercase so "Yerevan" and "yerevan" share a slot)
        const cacheKey = q.trim().toLowerCase();

        const cached = this.countCache.get(cacheKey);
        const isFresh =
            cached !== undefined &&
            Date.now() - cached.cachedAt < COUNT_TTL_MS;

        // Run data queries always; run count queries only when cache is stale/missing
        const [tours, transfers, counts] = await Promise.all([
            this.tourService.search(q, perType, skip),
            this.transferService.search(q, perType, skip),
            isFresh
                ? Promise.resolve({ tourTotal: cached.tourTotal, transferTotal: cached.transferTotal })
                : Promise.all([
                    this.tourService.searchCount(q),
                    this.transferService.searchCount(q),
                  ]).then(([tourTotal, transferTotal]) => {
                    // Store fresh counts in cache
                    this.countCache.set(cacheKey, {
                        tourTotal,
                        transferTotal,
                        cachedAt: Date.now(),
                    });
                    return { tourTotal, transferTotal };
                  }),
        ]);

        const tourResults: SearchResult[] = tours.map((t) => ({
            id: t.id,
            type: SearchResultType.TOUR,
            slug: t.slug,
            enTitle: t.enTitle,
            ruTitle: t.ruTitle,
            image: t.mainImage,
        }));

        const transferResults: SearchResult[] = transfers.map((t) => ({
            id: t.id,
            type: SearchResultType.TRANSFER,
            slug: t.slug,
            enTitle: t.enTitle,
            ruTitle: t.ruTitle,
            image: t.mainImage,
        }));

        return {
            page: safePage,
            limit: safeLimit,
            total: counts.tourTotal + counts.transferTotal,
            data: [...tourResults, ...transferResults],
        };
    }
}
