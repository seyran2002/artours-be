import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class TelegramService {
    private readonly logger = new Logger(TelegramService.name);
    private readonly botToken = process.env.TELEGRAM_BOT_TOKEN;

    constructor(private readonly prisma: PrismaService) {}

    async sendMessage(chatId: string, text: string): Promise<void> {
        try {
            await axios.post(
                `https://api.telegram.org/bot${this.botToken}/sendMessage`,
                {
                    chat_id: chatId,
                    text,
                    parse_mode: 'HTML',
                },
            );
            this.logger.log(`Message sent to chatId=${chatId}`);
        } catch (error: any) {
            this.logger.error(
                `Failed to send Telegram message to chatId=${chatId}: ${error?.message}`,
                error?.stack,
            );
            // Do NOT rethrow — Telegram failures must never break booking operations
        }
    }

    async notifyAdmin(text: string): Promise<void> {
        const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
        if (!adminChatId) {
            this.logger.warn('TELEGRAM_ADMIN_CHAT_ID is not set — skipping admin notification');
            return;
        }
        await this.sendMessage(adminChatId, text);
    }

    /**
     * Called by the Telegram bot webhook after the user starts the bot.
     * Persists the user's Telegram chatId onto the matching booking.
     */
    async linkTelegram(bookingNumber: string, chatId: string): Promise<void> {
        const booking = await this.prisma.booking.findUnique({
            where: { bookingNumber },
            select: { id: true, customerName: true },
        });

        if (!booking) {
            throw new NotFoundException(
                `Booking "${bookingNumber}" not found`,
            );
        }

        await this.prisma.booking.update({
            where: { bookingNumber },
            data: { customerTelegramId: chatId },
        });

        this.logger.log(
            `Linked Telegram chatId=${chatId} to booking ${bookingNumber} (customer: ${booking.customerName})`,
        );
    }
}