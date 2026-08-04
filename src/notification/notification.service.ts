import { Injectable, Logger } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { TelegramService } from 'src/telegram/telegram.service';
import { NotificationContext } from './notification.types';
import {
    buildAdminNewBookingTemplate,
    buildCancelledTemplate,
    buildConfirmedTemplate,
    buildCompletedTemplate,
    buildNewBookingTemplate,
    buildReminderTemplate,
} from './notification.templates';

@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);

    constructor(private readonly telegramService: TelegramService) {}

    /**
     * Converts a raw Prisma booking object into a normalized NotificationContext.
     */
    private toContext(booking: any): NotificationContext {
        const ruTitle =
            booking.tour?.ruTitle ?? booking.transfer?.ruTitle ?? 'Тур / Трансфер';
        const enTitle =
            booking.tour?.enTitle ?? booking.transfer?.enTitle ?? 'Tour / Transfer';
        const hyTitle =
            booking.tour?.hyTitle ?? booking.transfer?.hyTitle ?? 'Տուր / Տրանսֆեր';

        return {
            bookingNumber: booking.bookingNumber,
            type: booking.type,
            status: booking.status,
            ruTitle,
            enTitle,
            hyTitle,
            customerName: booking.customerName,
            customerEmail: booking.customerEmail,
            customerPhone: booking.customerPhone,
            customerTelegramId: booking.customerTelegramId ?? null,
            peopleCount: booking.peopleCount,
            travelDate: booking.travelDate,
            totalPrice: booking.totalPrice,
            notes: booking.notes,
        };
    }

    /**
     * Sends customer notification (if telegramId present) and admin notification for a new booking.
     */
    async notifyNewBooking(booking: any): Promise<void> {
        try {
            const ctx = this.toContext(booking);

            // 1. Notify Admin
            const adminMsg = buildAdminNewBookingTemplate(ctx);
            await this.telegramService.notifyAdmin(adminMsg);

            // 2. Notify Customer (if connected to Telegram)
            if (ctx.customerTelegramId) {
                const customerMsg = buildNewBookingTemplate(ctx);
                await this.telegramService.sendMessage(ctx.customerTelegramId, customerMsg);
            }
        } catch (error: any) {
            this.logger.error(
                `Failed to send new booking notification for ${booking?.bookingNumber}: ${error?.message}`,
                error?.stack,
            );
        }
    }

    /**
     * Sends status change notification to customer when status is updated by admin.
     */
    async notifyStatusChanged(booking: any): Promise<void> {
        try {
            const ctx = this.toContext(booking);
            if (!ctx.customerTelegramId) return;

            let message: string | null = null;
            if (ctx.status === BookingStatus.CONFIRMED) {
                message = buildConfirmedTemplate(ctx);
            } else if (ctx.status === BookingStatus.CANCELLED) {
                message = buildCancelledTemplate(ctx);
            } else if (ctx.status === BookingStatus.COMPLETED) {
                message = buildCompletedTemplate(ctx);
            }

            if (message) {
                await this.telegramService.sendMessage(ctx.customerTelegramId, message);
            }
        } catch (error: any) {
            this.logger.error(
                `Failed to send status update notification for ${booking?.bookingNumber}: ${error?.message}`,
                error?.stack,
            );
        }
    }

    /**
     * Sends cancellation message to customer.
     */
    async notifyCancelled(booking: any): Promise<void> {
        try {
            const ctx = this.toContext(booking);
            if (!ctx.customerTelegramId) return;

            const message = buildCancelledTemplate(ctx);
            await this.telegramService.sendMessage(ctx.customerTelegramId, message);
        } catch (error: any) {
            this.logger.error(
                `Failed to send cancellation notification for ${booking?.bookingNumber}: ${error?.message}`,
                error?.stack,
            );
        }
    }

    /**
     * Sends trip reminder message to customer.
     */
    async notifyReminder(booking: any): Promise<void> {
        try {
            const ctx = this.toContext(booking);
            if (!ctx.customerTelegramId) return;

            const message = buildReminderTemplate(ctx);
            await this.telegramService.sendMessage(ctx.customerTelegramId, message);
        } catch (error: any) {
            this.logger.error(
                `Failed to send reminder notification for ${booking?.bookingNumber}: ${error?.message}`,
                error?.stack,
            );
        }
    }
}
