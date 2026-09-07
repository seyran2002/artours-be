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

    describe('Review Flow', () => {
        it('should handle review:en callback query and prompt for rating in English', async () => {
            prisma.booking.findFirst.mockResolvedValue({
                bookingNumber: 'ART-100',
                tour: { enTitle: 'Garni & Geghard' },
            });

            const callbackQuery = {
                id: 'cb_123',
                data: 'review:en',
                message: { chat: { id: 987654 } },
            };

            await service.handleWebhook({ callback_query: callbackQuery });

            // 1. Acknowledges callback query
            expect(mockedAxios.post).toHaveBeenCalledWith(
                'https://api.telegram.org/botmock-token/answerCallbackQuery',
                { callback_query_id: 'cb_123', text: undefined },
            );

            // 2. Sends English rating prompt with inline keyboard
            expect(mockedAxios.post).toHaveBeenCalledWith(
                'https://api.telegram.org/botmock-token/sendMessage',
                expect.objectContaining({
                    chat_id: '987654',
                    text: '⭐ Please rate your trip from 1 to 5:',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: '⭐ 1', callback_data: 'rating:1' },
                                { text: '⭐ 2', callback_data: 'rating:2' },
                                { text: '⭐ 3', callback_data: 'rating:3' },
                                { text: '⭐ 4', callback_data: 'rating:4' },
                                { text: '⭐ 5', callback_data: 'rating:5' },
                            ],
                        ],
                    },
                }),
            );
        });

        it('should handle rating:5 callback query and prompt for comment in English', async () => {
            // First initiate review in English
            prisma.booking.findFirst.mockResolvedValue({
                bookingNumber: 'ART-100',
                tour: { enTitle: 'Garni & Geghard' },
            });

            await service.handleWebhook({
                callback_query: {
                    id: 'cb_1',
                    data: 'review:en',
                    message: { chat: { id: 987654 } },
                },
            });

            mockedAxios.post.mockClear();

            // Next customer clicks rating:5
            await service.handleWebhook({
                callback_query: {
                    id: 'cb_2',
                    data: 'rating:5',
                    message: { chat: { id: 987654 } },
                },
            });

            // Acknowledges callback query
            expect(mockedAxios.post).toHaveBeenCalledWith(
                'https://api.telegram.org/botmock-token/answerCallbackQuery',
                { callback_query_id: 'cb_2', text: undefined },
            );

            // Sends English comment prompt
            expect(mockedAxios.post).toHaveBeenCalledWith(
                'https://api.telegram.org/botmock-token/sendMessage',
                expect.objectContaining({
                    chat_id: '987654',
                    text: '💬 Please write your review:',
                }),
            );
        });

        it('should handle comment submission, forward review to admin, and send confirmation', async () => {
            prisma.booking.findFirst.mockResolvedValue({
                bookingNumber: 'ART-12345',
                tour: { enTitle: 'Garni & Geghard' },
            });

            // 1. Language selection
            await service.handleWebhook({
                callback_query: {
                    id: 'cb_1',
                    data: 'review:en',
                    message: { chat: { id: 987654 } },
                },
            });

            // 2. Rating selection
            await service.handleWebhook({
                callback_query: {
                    id: 'cb_2',
                    data: 'rating:5',
                    message: { chat: { id: 987654 } },
                },
            });

            mockedAxios.post.mockClear();

            // 3. User sends text message
            await service.handleWebhook({
                message: {
                    chat: { id: 987654 },
                    text: 'Everything was excellent. Our guide was very friendly.',
                },
            });

            // Notification sent to Admin chat
            expect(mockedAxios.post).toHaveBeenCalledWith(
                'https://api.telegram.org/botmock-token/sendMessage',
                expect.objectContaining({
                    chat_id: '123456789',
                    text: expect.stringContaining('NEW CUSTOMER REVIEW'),
                }),
            );

            const adminCall = mockedAxios.post.mock.calls.find(
                (call: any[]) => call[1]?.chat_id === '123456789',
            );
            expect(adminCall?.[1]?.text).toContain('ART-12345');
            expect(adminCall?.[1]?.text).toContain('Garni &amp; Geghard');
            expect(adminCall?.[1]?.text).toContain('5/5');
            expect(adminCall?.[1]?.text).toContain('English');
            expect(adminCall?.[1]?.text).toContain('Everything was excellent. Our guide was very friendly.');

            // Confirmation sent to user
            expect(mockedAxios.post).toHaveBeenCalledWith(
                'https://api.telegram.org/botmock-token/sendMessage',
                expect.objectContaining({
                    chat_id: '987654',
                    text: 'Thank you so much for your review! We truly appreciate your feedback. 🙏',
                }),
            );
        });

        it('should handle review flow in Russian (RU)', async () => {
            prisma.booking.findFirst.mockResolvedValue({
                bookingNumber: 'ART-RU-1',
                tour: { ruTitle: 'Гарни и Гегард', enTitle: 'Garni' },
            });

            // 1. review:ru
            await service.handleWebhook({
                callback_query: {
                    id: 'cb_ru1',
                    data: 'review:ru',
                    message: { chat: { id: 111222 } },
                },
            });

            expect(mockedAxios.post).toHaveBeenCalledWith(
                'https://api.telegram.org/botmock-token/sendMessage',
                expect.objectContaining({
                    chat_id: '111222',
                    text: '⭐ Оцените вашу поездку от 1 до 5:',
                }),
            );

            // 2. rating:4
            await service.handleWebhook({
                callback_query: {
                    id: 'cb_ru2',
                    data: 'rating:4',
                    message: { chat: { id: 111222 } },
                },
            });

            expect(mockedAxios.post).toHaveBeenCalledWith(
                'https://api.telegram.org/botmock-token/sendMessage',
                expect.objectContaining({
                    chat_id: '111222',
                    text: '💬 Пожалуйста, напишите ваш отзыв:',
                }),
            );

            mockedAxios.post.mockClear();

            // 3. Comment
            await service.handleWebhook({
                message: {
                    chat: { id: 111222 },
                    text: 'Все прошло отлично!',
                },
            });

            // Admin notification
            expect(mockedAxios.post).toHaveBeenCalledWith(
                'https://api.telegram.org/botmock-token/sendMessage',
                expect.objectContaining({
                    chat_id: '123456789',
                    text: expect.stringContaining('Гарни и Гегард'),
                }),
            );

            // Russian Confirmation to customer
            expect(mockedAxios.post).toHaveBeenCalledWith(
                'https://api.telegram.org/botmock-token/sendMessage',
                expect.objectContaining({
                    chat_id: '111222',
                    text: 'Спасибо большое за ваш отзыв! Мы очень ценим ваше мнение. 🙏',
                }),
            );
        });

        it('should send error message to customer if admin delivery fails', async () => {
            prisma.booking.findFirst.mockResolvedValue({
                bookingNumber: 'ART-FAIL',
                tour: { enTitle: 'Lake Sevan' },
            });

            await service.handleWebhook({
                callback_query: {
                    id: 'cb_1',
                    data: 'review:en',
                    message: { chat: { id: 333444 } },
                },
            });

            await service.handleWebhook({
                callback_query: {
                    id: 'cb_2',
                    data: 'rating:5',
                    message: { chat: { id: 333444 } },
                },
            });

            // Mock admin notification failure
            mockedAxios.post.mockImplementation(async (url: string, payload: any) => {
                if (payload?.chat_id === '123456789') {
                    throw new Error('Telegram network error');
                }
                return { data: { ok: true } } as any;
            });

            await service.handleWebhook({
                message: {
                    chat: { id: 333444 },
                    text: 'Great tour!',
                },
            });

            // Customer receives error message instead of false success
            expect(mockedAxios.post).toHaveBeenCalledWith(
                'https://api.telegram.org/botmock-token/sendMessage',
                expect.objectContaining({
                    chat_id: '333444',
                    text: '❌ An error occurred while sending your review. Please try again later.',
                }),
            );
        });
    });
});
