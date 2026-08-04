import { BookingStatus, BookingType, Prisma } from '@prisma/client';

/**
 * All data a notification template builder needs.
 * Resolved once in NotificationService and passed to every builder.
 * Intentionally decoupled from Prisma model types so templates stay pure.
 */
export interface NotificationContext {
    bookingNumber: string;
    type: BookingType;
    status: BookingStatus;

    /** Tour or transfer name in Russian */
    ruTitle: string;
    /** Tour or transfer name in English */
    enTitle: string;
    hyTitle: string;

    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerTelegramId: string | null;

    peopleCount: number;
    travelDate: Date;
    totalPrice: Prisma.Decimal | number | string;

    notes?: string | null;
}
