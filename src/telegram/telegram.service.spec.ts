import { Test, TestingModule } from '@nestjs/testing';
import { TelegramService } from './telegram.service';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('TelegramService', () => {
    let service: TelegramService;
    let prisma: any;

    beforeEach(async () => {
        jest.clearAllMocks();
        mockedAxios.post.mockResolvedValue({ data: { ok: true } } as any);

        prisma = {
            booking: {
                findUnique: jest.fn(),
                findFirst: jest.fn(),
                update: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TelegramService,
                { provide: PrismaService, useValue: prisma },
            ],
        }).compile();

        service = module.get<TelegramService>(TelegramService);
        process.env.TELEGRAM_ADMIN_CHAT_ID = '123456789';
        process.env.TELEGRAM_BOT_TOKEN = 'mock-token';
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('linkTelegram', () => {
        it('should link telegram chat ID to booking when valid booking is found', async () => {
            prisma.booking.findUnique.mockResolvedValue({
                id: 'booking-id-1',
                customerName: 'John Doe',
            });

            await service.linkTelegram('BK-12345', '987654');

            expect(prisma.booking.update).toHaveBeenCalledWith({
                where: { bookingNumber: 'BK-12345' },
                data: { customerTelegramId: '987654' },
            });

            expect(mockedAxios.post).toHaveBeenCalledWith(
                'https://api.telegram.org/botmock-token/sendMessage',
                expect.objectContaining({
                    chat_id: '987654',
                    text: expect.stringContaining('John Doe'),
                }),
            );
        });

        it('should send error message when booking is not found', async () => {
            prisma.booking.findUnique.mockResolvedValue(null);

            await service.linkTelegram('BK-INVALID', '987654');

            expect(prisma.booking.update).not.toHaveBeenCalled();
            expect(mockedAxios.post).toHaveBeenCalledWith(
                'https://api.telegram.org/botmock-token/sendMessage',
                expect.objectContaining({
                    chat_id: '987654',
                    text: expect.stringContaining('BK-INVALID'),
                }),
            );
        });
    });

    describe('handleWebhook', () => {
        it('should handle /start with valid bookingNumber and link telegram', async () => {
            prisma.booking.findUnique.mockResolvedValue({
                id: 'booking-id-1',
                customerName: 'Alice',
            });

            await service.handleWebhook({
                message: {
                    chat: { id: 12345 },
                    text: '/start BK-12345',
                },
            });

            expect(prisma.booking.update).toHaveBeenCalledWith({
                where: { bookingNumber: 'BK-12345' },
                data: { customerTelegramId: '12345' },
            });
        });

        it('should handle /start without bookingNumber and send welcome instructions', async () => {
            await service.handleWebhook({
                message: {
                    chat: { id: 12345 },
                    text: '/start',
                },
            });

            expect(mockedAxios.post).toHaveBeenCalledWith(
                'https://api.telegram.org/botmock-token/sendMessage',
                expect.objectContaining({
                    chat_id: '12345',
                    text: expect.stringContaining('ArTours'),
                }),
            );
        });

        it('should acknowledge callback_query if received', async () => {
            await service.handleWebhook({
                callback_query: {
                    id: 'cb_query_1',
                    data: 'anything',
                },
            });

            expect(mockedAxios.post).toHaveBeenCalledWith(
                'https://api.telegram.org/botmock-token/answerCallbackQuery',
                { callback_query_id: 'cb_query_1', text: undefined },
            );
        });
    });

    describe('sendMessage and notifyAdmin', () => {
        it('should send message to given chat id', async () => {
            const result = await service.sendMessage('987654', 'Hello world');
            expect(result).toBe(true);
            expect(mockedAxios.post).toHaveBeenCalledWith(
                'https://api.telegram.org/botmock-token/sendMessage',
                expect.objectContaining({
                    chat_id: '987654',
                    text: 'Hello world',
                    parse_mode: 'HTML',
                }),
            );
        });

        it('should notify admin using TELEGRAM_ADMIN_CHAT_ID', async () => {
            const result = await service.notifyAdmin('Admin notification');
            expect(result).toBe(true);
            expect(mockedAxios.post).toHaveBeenCalledWith(
                'https://api.telegram.org/botmock-token/sendMessage',
                expect.objectContaining({
                    chat_id: '123456789',
                    text: 'Admin notification',
                }),
            );
        });
    });
});
