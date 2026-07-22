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

    constructor(private readonly telegramService: TelegramService) {}

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
