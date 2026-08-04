import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class TelegramService implements OnModuleInit {
    private readonly logger = new Logger(TelegramService.name);
    private readonly botToken = process.env.TELEGRAM_BOT_TOKEN;

    constructor(private readonly prisma: PrismaService) {}

    /**
     * Automatically registers the Telegram webhook URL with Telegram on startup.
     * Requires TELEGRAM_WEBHOOK_URL to be set in .env (e.g. https://your-domain.com/telegram/webhook).
     */
    async onModuleInit(): Promise<void> {
        const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
        if (!webhookUrl) {
            this.logger.warn(
                'TELEGRAM_WEBHOOK_URL is not set — skipping webhook registration. ' +
                'Set it to your public backend URL, e.g. https://your-domain.com/telegram/webhook',
            );
            return;
        }

        try {
            const res = await axios.post(
                `https://api.telegram.org/bot${this.botToken}/setWebhook`,
                { url: webhookUrl },
            );
            this.logger.log(`Telegram webhook registered: ${webhookUrl} — ${JSON.stringify(res.data)}`);
        } catch (error: any) {
            this.logger.error(
                `Failed to register Telegram webhook: ${error?.message}`,
                error?.stack,
            );
        }
    }

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
     * Called when the user presses Start on the Telegram bot.
     * Persists the user's Telegram chatId onto the matching booking
     * and sends them a confirmation message.
     */
    async linkTelegram(bookingNumber: string, chatId: string): Promise<void> {
        const booking = await this.prisma.booking.findUnique({
            where: { bookingNumber },
            select: { id: true, customerName: true },
        });

        if (!booking) {
            this.logger.warn(`linkTelegram: booking "${bookingNumber}" not found for chatId=${chatId}`);
            await this.sendMessage(
                chatId,
                `❌ We couldn't find a booking with reference <b>${bookingNumber}</b>.\n\nPlease double-check the link or contact our support team.`,
            );
            return;
        }

        await this.prisma.booking.update({
            where: { bookingNumber },
            data: { customerTelegramId: chatId },
        });

        this.logger.log(
            `Linked Telegram chatId=${chatId} to booking ${bookingNumber} (customer: ${booking.customerName})`,
        );

        await this.sendMessage(
            chatId,
            `✅ Hello, <b>${booking.customerName}</b>!\n\nYou are now connected. We will send you updates for your booking <b>${bookingNumber}</b> here. 🎉`,
        );
    }

    /**
     * Handles a raw Telegram webhook update.
     * Supports the /start <bookingNumber> command sent when the user clicks
     * the deep-link button in the booking confirmation email.
     */
    async handleWebhook(body: any): Promise<void> {
        const message = body?.message;
        if (!message) return;

        const chatId = String(message.chat?.id);
        const text: string = message.text ?? '';

        // Deep-link: /start BK-XXXXX  (Telegram replaces the URL param with a space-separated arg)
        if (text.startsWith('/start')) {
            const parts = text.trim().split(/\s+/);
            const bookingNumber = parts[1]; // e.g. "BK-12345"

            if (!bookingNumber) {
                await this.sendMessage(
                    chatId,
                    '👋 Welcome to ArTours!\n\nPlease use the link from your booking confirmation email to connect your Telegram account.',
                );
                return;
            }

            await this.linkTelegram(bookingNumber, chatId);
        }
    }
}