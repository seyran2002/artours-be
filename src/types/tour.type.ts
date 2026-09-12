import { Tour, TourLocation, Location } from '@prisma/client';

/** TourLocation row with its related Location populated. */
export type TourLocationWithLocation = TourLocation & {
    location: Location;
};

/** Full Tour with ordered locations included. */
export type TourWithLocations = Tour & {
    locations: TourLocationWithLocation[];
};

