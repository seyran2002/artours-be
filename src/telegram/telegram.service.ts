import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';
import {
    buildAdminReviewTemplate,
    buildCommentPrompt,
    buildRatingKeyboard,
    buildRatingPrompt,
    buildReviewConfirmationMessage,
    buildReviewErrorMessage,
} from '../notification/notification.templates';

export interface ReviewSession {
    lang: 'ru' | 'en' | 'hy';
    step: 'AWAITING_RATING' | 'AWAITING_COMMENT';
    bookingNumber: string;
    tourOrLocationTitle: string;
    rating?: number;
    updatedAt: number;
}

const LANGUAGE_NAMES: Record<'ru' | 'en' | 'hy', string> = {
    ru: 'Russian',
    en: 'English',
    hy: 'Armenian',
};

@Injectable()
export class TelegramService implements OnModuleInit {
    private readonly logger = new Logger(TelegramService.name);
    private readonly botToken = process.env.TELEGRAM_BOT_TOKEN;
    private readonly reviewSessions = new Map<string, ReviewSession>();

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Automatically registers the Telegram webhook URL with Telegram on startup.
     *
     * Priority:
     *  1. TELEGRAM_WEBHOOK_URL env var (production / any explicit override)
     *  2. Auto-detected from the local ngrok tunnel at http://localhost:4040 (local dev)
     */
    async onModuleInit(): Promise<void> {
        const webhookUrl = await this.resolveWebhookUrl();
        if (!webhookUrl) {
            this.logger.warn(
                'Could not determine webhook URL — skipping webhook registration. ' +
                'Either set TELEGRAM_WEBHOOK_URL in .env, or start ngrok (ngrok http 3000).',
            );
            return;
        }

        try {
            const res = await axios.post(
                `https://api.telegram.org/bot${this.botToken}/setWebhook`,
                { url: webhookUrl, drop_pending_updates: true },
            );
            this.logger.log(`Telegram webhook registered: ${webhookUrl} — ${JSON.stringify(res.data)}`);
        } catch (error: any) {
            const body = error?.response?.data;
            this.logger.error(
                `Failed to register Telegram webhook: ${error?.message} — Telegram says: ${JSON.stringify(body)}`,
                error?.stack,
            );
        }
    }

    /**
     * Resolves the public HTTPS URL to use as the Telegram webhook.
     * Uses TELEGRAM_WEBHOOK_URL if set, otherwise auto-detects from ngrok.
     */
    private async resolveWebhookUrl(): Promise<string | null> {
        const envUrl = process.env.TELEGRAM_WEBHOOK_URL?.trim();
        if (envUrl) {
            this.logger.log(`Using webhook URL from env: ${envUrl}`);
            return envUrl;
        }

        // Auto-detect from running ngrok instance
        try {
            this.logger.log('TELEGRAM_WEBHOOK_URL not set — auto-detecting ngrok tunnel...');
            const ngrok = await axios.get('http://localhost:4040/api/tunnels', { timeout: 3000 });
            const https = ngrok.data?.tunnels?.find((t: any) => t.proto === 'https');
            if (https?.public_url) {
                const url = `${https.public_url}/telegram/webhook`;
                this.logger.log(`Auto-detected ngrok URL: ${url}`);
                return url;
            }
            this.logger.warn('ngrok is running but no HTTPS tunnel found at localhost:4040');
            return null;
        } catch {
            this.logger.warn('Could not reach ngrok at localhost:4040 — is ngrok running? (ngrok http 3000)');
            return null;
        }
    }

    async sendMessage(chatId: string, text: string, replyMarkup?: any): Promise<boolean> {
        try {
            const payload: any = {
                chat_id: chatId,
                text,
                parse_mode: 'HTML',
            };
            if (replyMarkup) {
                payload.reply_markup = replyMarkup;
            }

            await axios.post(
                `https://api.telegram.org/bot${this.botToken}/sendMessage`,
                payload,
            );
            this.logger.log(`Message sent to chatId=${chatId}`);
            return true;
        } catch (error: any) {
            this.logger.error(
                `Failed to send Telegram message to chatId=${chatId}: ${error?.message}`,
                error?.stack,
            );
            return false;
        }
    }

    async answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void> {
        try {
            await axios.post(
                `https://api.telegram.org/bot${this.botToken}/answerCallbackQuery`,
                {
                    callback_query_id: callbackQueryId,
                    text,
                },
            );
        } catch (error: any) {
            this.logger.error(
                `Failed to answer callback query ${callbackQueryId}: ${error?.message}`,
                error?.stack,
            );
        }
    }

    async notifyAdmin(text: string): Promise<boolean> {
        const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
        if (!adminChatId) {
            this.logger.warn('TELEGRAM_ADMIN_CHAT_ID is not set — skipping admin notification');
            return false;
        }
        return await this.sendMessage(adminChatId, text);
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

        const divider = '\n\n──────────────\n\n';

        if (!booking) {
            this.logger.warn(`linkTelegram: booking "${bookingNumber}" not found for chatId=${chatId}`);
            
            const ruError = `❌ Мы не смогли найти бронирование с номером <b>${bookingNumber}</b>.\n\nПожалуйста, перепроверьте ссылку или свяжитесь с нашей службой поддержки.`;
            const enError = `❌ We couldn't find a booking with reference <b>${bookingNumber}</b>.\n\nPlease double-check the link or contact our support team.`;
            const hyError = `❌ Մենք չկարողացանք գտնել <b>${bookingNumber}</b> համարով ամրագրումը:\n\nԽնդրում ենք կրկին ստուգել հղումը կամ կապվել մեր աջակցման թիմի հետ:`;

            await this.sendMessage(
                chatId,
                [ruError, enError, hyError].join(divider),
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

        const ruSuccess = `👋 Здравствуйте, <b>${booking.customerName}</b>!\n\nВы успешно подключились к нашему Telegram-каналу. Мы будем отправлять вам обновления по вашему бронированию <b>${bookingNumber}</b> здесь. 🎉`;
        const enSuccess = `👋 Hello, <b>${booking.customerName}</b>!\n\nYou are now connected to our Telegram channel. We will send you updates for your booking <b>${bookingNumber}</b> here. 🎉`;
        const hySuccess = `👋 Ողջույն, <b>${booking.customerName}</b>՛\n\nԴուք հաջողությամբ միացել եք մեր telegram ալիքին։ Մենք կուղարկենք ձեր <b>${bookingNumber}</b> ամրագրման թարմացումները այստեղ: 🎉`;

        await this.sendMessage(
            chatId,
            [ruSuccess, enSuccess, hySuccess].join(divider),
        );
    }

    /**
     * Handles a raw Telegram webhook update.
     * Supports:
     * 1. /start <bookingNumber> deep-linking
     * 2. callback_query events for the review flow (language selection & rating)
     * 3. text messages for submitting the review comment
     */
    async handleWebhook(body: any): Promise<void> {
        // 1. Handle callback query (inline button clicks)
        if (body?.callback_query) {
            await this.handleCallbackQuery(body.callback_query);
            return;
        }

        // 2. Handle message
        const message = body?.message;
        if (!message) return;

        const chatId = String(message.chat?.id);
        const text: string = message.text ?? '';

        // Deep-link: /start BK-XXXXX  (Telegram replaces the URL param with a space-separated arg)
        if (text.startsWith('/start')) {
            const parts = text.trim().split(/\s+/);
            const bookingNumber = parts[1]; // e.g. "BK-12345"

            if (!bookingNumber) {
                const divider = '\n\n──────────────\n\n';

                const ruWelcome = '👋 Добро пожаловать в ArTours!\n\nПожалуйста, используйте ссылку из письма с подтверждением бронирования, чтобы привязать свой Telegram-аккаунт.';
                const enWelcome = '👋 Welcome to ArTours!\n\nPlease use the link from your booking confirmation email to connect your Telegram account.';
                const hyWelcome = '👋 Բարի գալուստ ArTours:\n\nԽնդրում ենք օգտագործել ամրագրման հաստատման էլեկտրոնային նամակի հղումը՝ ձեր Telegram հաշիվը կապելու համար:';

                await this.sendMessage(
                    chatId,
                    [ruWelcome, enWelcome, hyWelcome].join(divider),
                );
                return;
            }

            await this.linkTelegram(bookingNumber, chatId);
            return;
        }

        // Check if user is actively writing a review comment
        const session = this.reviewSessions.get(chatId);
        if (session && session.step === 'AWAITING_COMMENT' && text.trim()) {
            await this.handleReviewComment(chatId, session, text.trim());
        }
    }

    private async handleCallbackQuery(callbackQuery: any): Promise<void> {
        const callbackQueryId = callbackQuery.id;
        const data: string = callbackQuery.data ?? '';
        const chatId = String(callbackQuery.message?.chat?.id ?? callbackQuery.from?.id);

        if (!chatId) return;

        // Step 1: Handle Review Language Button click (review:ru | review:en | review:hy)
        const reviewMatch = data.match(/^review:(ru|en|hy)$/);
        if (reviewMatch) {
            const lang = reviewMatch[1] as 'ru' | 'en' | 'hy';
            await this.answerCallbackQuery(callbackQueryId);

            const booking = await this.prisma.booking.findFirst({
                where: { customerTelegramId: chatId },
                orderBy: [{ updatedAt: 'desc' }],
                include: { tour: true, location: true },
            });

            let title = 'Tour / Location';
            if (booking) {
                if (lang === 'ru') {
                    title =
                        booking.tour?.ruTitle ??
                        booking.location?.ruTitle ??
                        booking.tour?.enTitle ??
                        booking.location?.enTitle ??
                        'Тур / Локация';
                } else if (lang === 'hy') {
                    title =
                        booking.tour?.hyTitle ??
                        booking.location?.hyTitle ??
                        booking.tour?.enTitle ??
                        booking.location?.enTitle ??
                        'Տուր / Լոկացիա';
                } else {
                    title =
                        booking.tour?.enTitle ??
                        booking.location?.enTitle ??
                        'Tour / Location';
                }
            }

            this.reviewSessions.set(chatId, {
                lang,
                step: 'AWAITING_RATING',
                bookingNumber: booking?.bookingNumber ?? 'N/A',
                tourOrLocationTitle: title,
                updatedAt: Date.now(),
            });

            await this.sendMessage(
                chatId,
                buildRatingPrompt(lang),
                buildRatingKeyboard(),
            );
            return;
        }

        // Step 2: Handle Rating Button click (rating:1 .. rating:5)
        const ratingMatch = data.match(/^rating:([1-5])$/);
        if (ratingMatch) {
            const rating = parseInt(ratingMatch[1], 10);
            await this.answerCallbackQuery(callbackQueryId);

            let session = this.reviewSessions.get(chatId);
            if (session) {
                session.rating = rating;
                session.step = 'AWAITING_COMMENT';
                session.updatedAt = Date.now();
            } else {
                session = {
                    lang: 'en',
                    step: 'AWAITING_COMMENT',
                    bookingNumber: 'N/A',
                    tourOrLocationTitle: 'Tour / Location',
                    rating,
                    updatedAt: Date.now(),
                };
                this.reviewSessions.set(chatId, session);
            }

            await this.sendMessage(
                chatId,
                buildCommentPrompt(session.lang),
            );
            return;
        }
    }

    private async handleReviewComment(
        chatId: string,
        session: ReviewSession,
        comment: string,
    ): Promise<void> {
        const languageName = LANGUAGE_NAMES[session.lang] ?? 'English';
        const adminMsg = buildAdminReviewTemplate({
            bookingNumber: session.bookingNumber,
            tourOrLocationTitle: session.tourOrLocationTitle,
            rating: session.rating ?? 5,
            language: languageName,
            comment,
        });

        const success = await this.notifyAdmin(adminMsg);
        if (success) {
            this.reviewSessions.delete(chatId);
            await this.sendMessage(
                chatId,
                buildReviewConfirmationMessage(session.lang),
            );
        } else {
            this.logger.error(
                `Failed to deliver review for booking ${session.bookingNumber} to admin Telegram chat`,
            );
            await this.sendMessage(
                chatId,
                buildReviewErrorMessage(session.lang),
            );
        }
    }
}