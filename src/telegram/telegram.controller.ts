import {
    Body,
    Controller,
    ForbiddenException,
    Headers,
    HttpCode,
    HttpStatus,
    Logger,
    Post,
} from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { LinkTelegramDto } from './dto/link-telegram.dto';

@Controller('telegram')
export class TelegramController {
    private readonly logger = new Logger(TelegramController.name);

    constructor(private readonly telegramService: TelegramService) { }

    /**
     * POST /telegram/webhook
     *
     * Telegram calls this endpoint for every bot update (message, callback, etc.).
     * When a user clicks the Start button (deep-link), Telegram sends a
     * message with text "/start <bookingNumber>". This handler parses that,
     * saves the chatId to the booking, and replies to the user.
     *
     * Register this URL with Telegram via:
     *   POST https://api.telegram.org/bot<TOKEN>/setWebhook
     *   { "url": "https://your-domain.com/telegram/webhook" }
     *
     * (The service does this automatically on startup via TELEGRAM_WEBHOOK_URL.)
     */
    @Post('webhook')
    @HttpCode(HttpStatus.OK)
    async handleWebhook(@Body() body: any) {
        await this.telegramService.handleWebhook(body);
        return { ok: true };
    }

    /**
     * POST /telegram/link
     *
     * Called by the Telegram bot after a user sends /start <bookingNumber>.
     * The bot must include the shared secret in the X-Bot-Secret header.
     *
     * Body: { bookingNumber: string, chatId: string }
     */
    @Post('link')
    @HttpCode(HttpStatus.OK)
    async linkTelegram(
        @Headers('x-bot-secret') secret: string,
        @Body() dto: LinkTelegramDto,
    ) {
        const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
        if (!expectedSecret || secret !== expectedSecret) {
            this.logger.warn(
                `Unauthorized /telegram/link attempt for booking ${dto.bookingNumber}`,
            );
            throw new ForbiddenException('Invalid bot secret');
        }

        await this.telegramService.linkTelegram(dto.bookingNumber, dto.chatId);

        return { success: true, message: `chatId linked to ${dto.bookingNumber}` };
    }
}
