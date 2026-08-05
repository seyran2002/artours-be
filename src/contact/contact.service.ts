import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { TelegramService } from 'src/telegram/telegram.service';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactService {
    private readonly logger = new Logger(ContactService.name);

    constructor(private readonly telegramService: TelegramService) {}

    async handleContactSubmission(dto: CreateContactDto): Promise<{ success: boolean }> {
        const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
        if (!adminChatId) {
            this.logger.error('TELEGRAM_ADMIN_CHAT_ID environment variable is not set');
            throw new InternalServerErrorException('Telegram admin configuration is missing.');
        }

        const messageText = 
            `📬 <b>Новое сообщение с сайта / New Contact Message</b>\n\n` +
            `👤 <b>Имя / Name:</b> ${this.escapeHtml(dto.name)}\n` +
            `📞 <b>Телефон / Phone:</b> ${this.escapeHtml(dto.phone)}\n\n` +
            `💬 <b>Сообщение / Message:</b>\n${this.escapeHtml(dto.message)}`;

        try {
            await this.telegramService.sendMessage(adminChatId, messageText);
            this.logger.log(`Contact message from ${dto.name} (${dto.phone}) sent to admin Telegram chat.`);
            return { success: true };
        } catch (error: any) {
            this.logger.error(`Failed to send contact notification: ${error?.message}`, error?.stack);
            throw new InternalServerErrorException('Failed to send contact notification via Telegram.');
        }
    }

    private escapeHtml(str: string): string {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
}
