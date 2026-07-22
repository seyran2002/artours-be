import { Tour, TourTransfer, Transfer } from '@prisma/client';

/** TourTransfer row with its related Transfer populated. */
export type TourTransferWithTransfer = TourTransfer & {
    transfer: Transfer;
};

/** Full Tour with ordered transfers included. */
export type TourWithTransfers = Tour & {
    transfers: TourTransferWithTransfer[];
};
