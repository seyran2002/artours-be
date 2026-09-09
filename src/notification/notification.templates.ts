import { NotificationContext } from './notification.types';

// ─── Shared helpers ────────────────────────────────────────────────────────────

/** e.g. 2026-08-15 */
function fmtDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

/** Divider between RU and EN blocks */
const DIVIDER = '\n\n──────────────\n\n';

// ─── Customer templates ────────────────────────────────────────────────────────

/**
 * Sent to the customer right after they create a booking (status: PENDING).
 * Always bilingual: RU block + EN block in one message.
 */
export function buildNewBookingTemplate(ctx: NotificationContext): string {
    const ru = `🌍 <b>ArTours — Ваша заявка принята!</b>

📋 <b>Номер бронирования:</b> <code>${ctx.bookingNumber}</code>
🗺 <b>Тур/Трансфер:</b> ${ctx.ruTitle}
👤 <b>Имя:</b> ${ctx.customerName}
👥 <b>Количество человек:</b> ${ctx.peopleCount}
📅 <b>Дата поездки:</b> ${fmtDate(ctx.travelDate)}
💰 <b>Сумма:</b> ${ctx.totalPrice} EUR

⏳ Ваша заявка обрабатывается. Мы свяжемся с вами в ближайшее время для подтверждения.

Спасибо, что выбрали ArTours! 🙏`;

    const en = `🌍 <b>ArTours — Your request has been received!</b>

📋 <b>Booking number:</b> <code>${ctx.bookingNumber}</code>
🗺 <b>Tour/Transfer:</b> ${ctx.enTitle}
👤 <b>Name:</b> ${ctx.customerName}
👥 <b>People:</b> ${ctx.peopleCount}
📅 <b>Travel date:</b> ${fmtDate(ctx.travelDate)}
💰 <b>Total:</b> ${ctx.totalPrice} EUR

⏳ Your request is being processed. We will contact you shortly to confirm.

Thank you for choosing ArTours! 🙏`;

    const hy = `🌍 <b>ArTours — Ձեր հայտը ընդունված է:</b>

📋 <b>Ամրագրման համարը:</b> <code>${ctx.bookingNumber}</code>
🗺 <b>Տուր/Տրանսֆեր:</b> ${ctx.hyTitle}
👤 <b>Անուն:</b> ${ctx.customerName}
👥 <b>Մարդկանց քանակը:</b> ${ctx.peopleCount}
📅 <b>Ուղևորության ամսաթիվը:</b> ${fmtDate(ctx.travelDate)}
💰 <b>Գումարը:</b> ${ctx.totalPrice} EUR

⏳ Ձեր հայտը մշակվում է: Հաստատման համար մենք կապ կհաստատենք ձեզ հետ մոտակա ժամանակներս:

Շնորհակալություն ArTours-ն ընտրելու համար: 🙏`;

    return ru + DIVIDER + en + DIVIDER + hy;
}

/**
 * Sent when an admin changes the booking status to CONFIRMED.
 */
export function buildConfirmedTemplate(ctx: NotificationContext): string {
    const ru = `✅ <b>ArTours — Бронирование подтверждено!</b>

📋 <b>Номер бронирования:</b> <code>${ctx.bookingNumber}</code>
🗺 <b>Тур/Трансфер:</b> ${ctx.ruTitle}
👤 <b>Имя:</b> ${ctx.customerName}
👥 <b>Количество человек:</b> ${ctx.peopleCount}
📅 <b>Дата поездки:</b> ${fmtDate(ctx.travelDate)}
💰 <b>Сумма:</b> ${ctx.totalPrice} EUR

🎉 Ваше бронирование подтверждено! Ждём вас в путешествие!`;

    const en = `✅ <b>ArTours — Booking Confirmed!</b>

📋 <b>Booking number:</b> <code>${ctx.bookingNumber}</code>
🗺 <b>Tour/Transfer:</b> ${ctx.enTitle}
👤 <b>Name:</b> ${ctx.customerName}
👥 <b>People:</b> ${ctx.peopleCount}
📅 <b>Travel date:</b> ${fmtDate(ctx.travelDate)}
💰 <b>Total:</b> ${ctx.totalPrice} EUR

🎉 Your booking is confirmed! We look forward to your trip!`;

    const hy = `✅ <b>ArTours — Ամրագրումը հաստատված է:</b>

📋 <b>Ամրագրման համարը:</b> <code>${ctx.bookingNumber}</code>
🗺 <b>Տուր/Տրանսֆեր:</b> ${ctx.hyTitle}
👤 <b>Անուն:</b> ${ctx.customerName}
👥 <b>Մարդկանց քանակը:</b> ${ctx.peopleCount}
📅 <b>Ուղևորության ամսաթիվը:</b> ${fmtDate(ctx.travelDate)}
💰 <b>Գումարը:</b> ${ctx.totalPrice} EUR

🎉 Ձեր ամրագրումը հաստատված է: Սպասում ենք ձեզ ճանապարհորդության:`;

    return ru + DIVIDER + en + DIVIDER + hy;
}

/**
 * Sent when a booking is cancelled (by admin or by the customer themselves).
 */
export function buildCancelledTemplate(ctx: NotificationContext): string {
    const ru = `❌ <b>ArTours — Бронирование отменено</b>

📋 <b>Номер бронирования:</b> <code>${ctx.bookingNumber}</code>
🗺 <b>Тур/Трансфер:</b> ${ctx.ruTitle}
📅 <b>Дата поездки:</b> ${fmtDate(ctx.travelDate)}

Ваше бронирование было отменено. Если у вас возникли вопросы — свяжитесь с нами.

Надеемся увидеть вас снова! 🌟`;

    const en = `❌ <b>ArTours — Booking Cancelled</b>

📋 <b>Booking number:</b> <code>${ctx.bookingNumber}</code>
🗺 <b>Tour/Transfer:</b> ${ctx.enTitle}
📅 <b>Travel date:</b> ${fmtDate(ctx.travelDate)}

Your booking has been cancelled. If you have any questions, please contact us.

We hope to see you again! 🌟`;

    const hy = `❌ <b>ArTours — Ամրագրումը չեղարկված է</b>

📋 <b>Ամրագրման համարը:</b> <code>${ctx.bookingNumber}</code>
🗺 <b>Տուր/Տրանսֆեր:</b> ${ctx.hyTitle}
📅 <b>Ուղևորության ամսաթիվը:</b> ${fmtDate(ctx.travelDate)}

Ձեր ամրագրումը չեղարկվել է: Հարցերի դեպքում խնդրում ենք կապվել մեզ հետ:

Հուսով ենք ձեզ նորից տեսնել: 🌟`;

    return ru + DIVIDER + en + DIVIDER + hy;
}

/**
 * Sent when the booking is automatically marked COMPLETED after the travel date.
 */
export function buildCompletedTemplate(ctx: NotificationContext): string {
    const ru = `🏁 <b>ArTours — Поездка завершена!</b>

📋 <b>Номер бронирования:</b> <code>${ctx.bookingNumber}</code>
🗺 <b>Тур/Трансфер:</b> ${ctx.ruTitle}

Надеемся, вам понравилось путешествие! Будем рады видеть вас снова. 🌿

Оставьте отзыв — это поможет нам стать ещё лучше. 🙏`;

    const en = `🏁 <b>ArTours — Trip Completed!</b>

📋 <b>Booking number:</b> <code>${ctx.bookingNumber}</code>
🗺 <b>Tour/Transfer:</b> ${ctx.enTitle}

We hope you enjoyed your trip! We would love to see you again. 🌿

Feel free to leave a review — it helps us improve. 🙏`;

    const hy = `🏁 <b>ArTours — Ուղևորությունն ավարտված է:</b>

📋 <b>Ամրագրման համարը:</b> <code>${ctx.bookingNumber}</code>
🗺 <b>Տուր/Տրանսֆեր:</b> ${ctx.hyTitle}

Հուսով ենք՝ ձեզ դուր եկավ ճանապարհորդությունը: Ուրախ կլինենք ձեզ նորից տեսնել: 🌿

Խնդրում ենք թողնել կարծիք, դա կօգնի մեզ դառնալ էլ ավելի լավը: 🙏`;

    return ru + DIVIDER + en + DIVIDER + hy;
}

/**
 * Sent ~24 hours before the travel date as a reminder.
 */
export function buildReminderTemplate(ctx: NotificationContext): string {
    const ru = `⏰ <b>ArTours — Напоминание о поездке</b>

Уже завтра! 🎒

📋 <b>Номер бронирования:</b> <code>${ctx.bookingNumber}</code>
🗺 <b>Тур/Трансфер:</b> ${ctx.ruTitle}
👥 <b>Количество человек:</b> ${ctx.peopleCount}
📅 <b>Дата поездки:</b> ${fmtDate(ctx.travelDate)}

Если у вас есть вопросы перед поездкой — мы всегда на связи. Удачного путешествия! 🌍`;

    const en = `⏰ <b>ArTours — Trip Reminder</b>

Tomorrow is the day! 🎒

📋 <b>Booking number:</b> <code>${ctx.bookingNumber}</code>
🗺 <b>Tour/Transfer:</b> ${ctx.enTitle}
👥 <b>People:</b> ${ctx.peopleCount}
📅 <b>Travel date:</b> ${fmtDate(ctx.travelDate)}

If you have any questions before your trip — we are here. Have a wonderful journey! 🌍`;

    const hy = `⏰ <b>ArTours — Հիշեցում ուղևորության մասին</b>

Արդեն վաղը: 🎒

📋 <b>Ամրագրման համարը:</b> <code>${ctx.bookingNumber}</code>
🗺 <b>Տուր/Տրանսֆեր:</b> ${ctx.hyTitle}
👥 <b>Մարդկանց քանակը:</b> ${ctx.peopleCount}
📅 <b>Ուղևորության ամսաթիվը:</b> ${fmtDate(ctx.travelDate)}

Եթե ուղևորությունից առաջ ունեք հարցեր, մենք միշտ կապի մեջ ենք: Բարի ճանապարհորդություն: 🌍`;

    return ru + DIVIDER + en + DIVIDER + hy;
}

// ─── Admin template ────────────────────────────────────────────────────────────

/**
 * Helper to build Telegram and WhatsApp contact links from customer phone number.
 */
function getContactLinks(phone: string): string {
    const cleanPhone = phone.replace(/\D/g, '');
    return ` (<a href="https://t.me/+${cleanPhone}">Telegram</a> | <a href="https://wa.me/${cleanPhone}">WhatsApp</a>)`;
}

/**
 * Sent to the admin Telegram account on every new booking.
 * Single language (Russian) — concise operational summary.
 */
export function buildAdminNewBookingTemplate(ctx: NotificationContext): string {
    return `🆕 <b>Новое бронирование — ArTours</b>

📋 <b>Номер:</b> <code>${ctx.bookingNumber}</code>
🗺 <b>Тур/Трансфер:</b> ${ctx.ruTitle}
👤 <b>Клиент:</b> ${ctx.customerName}
📧 <b>Email:</b> ${ctx.customerEmail}
📞 <b>Телефон:</b> ${ctx.customerPhone} ${getContactLinks(ctx.customerPhone)}
👥 <b>Количество человек:</b> ${ctx.peopleCount}
📅 <b>Дата поездки:</b> ${fmtDate(ctx.travelDate)}
💰 <b>Сумма:</b> ${ctx.totalPrice} EUR${ctx.notes ? `\n📝 <b>Примечания:</b> ${ctx.notes}` : ''}`;
}

/**
 * Sent to the admin Telegram account when a booking is cancelled.
 * Single language (Russian) — concise operational summary.
 */
export function buildAdminCancelledTemplate(ctx: NotificationContext): string {
    return `❌ <b>Бронирование ОТМЕНЕНО — ArTours</b>

📋 <b>Номер:</b> <code>${ctx.bookingNumber}</code>
🗺 <b>Тур/Трансфер:</b> ${ctx.ruTitle}
👤 <b>Клиент:</b> ${ctx.customerName}
📧 <b>Email:</b> ${ctx.customerEmail}
📞 <b>Телефон:</b> ${ctx.customerPhone} ${getContactLinks(ctx.customerPhone)}
👥 <b>Количество человек:</b> ${ctx.peopleCount}
📅 <b>Дата поездки:</b> ${fmtDate(ctx.travelDate)}
💰 <b>Сумма:</b> ${ctx.totalPrice} EUR`;
}

// ─── Review flow templates ───────────────────────────────────────────────────

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/**
 * Returns inline keyboard attached to the completed booking message.
 */
export function buildCompletedReviewKeyboard() {
    return {
        inline_keyboard: [
            [{ text: '⭐ Оставить отзыв', callback_data: 'review:ru' }],
            [{ text: '⭐ Leave a review', callback_data: 'review:en' }],
            [{ text: '⭐ Թողնել կարծիք', callback_data: 'review:hy' }],
        ],
    };
}

/**
 * Prompt asking customer to rate their trip.
 */
export function buildRatingPrompt(lang: 'ru' | 'en' | 'hy'): string {
    switch (lang) {
        case 'ru':
            return '⭐ Оцените вашу поездку от 1 до 5:';
        case 'hy':
            return '⭐ Գնահատեք ձեր ուղևորությունը 1-ից 5:';
        case 'en':
        default:
            return '⭐ Please rate your trip from 1 to 5:';
    }
}

/**
 * Inline keyboard with 1-5 star rating buttons.
 */
export function buildRatingKeyboard() {
    return {
        inline_keyboard: [
            [
                { text: '⭐ 1', callback_data: 'rating:1' },
                { text: '⭐ 2', callback_data: 'rating:2' },
                { text: '⭐ 3', callback_data: 'rating:3' },
                { text: '⭐ 4', callback_data: 'rating:4' },
                { text: '⭐ 5', callback_data: 'rating:5' },
            ],
        ],
    };
}

/**
 * Prompt asking customer to write their review comment.
 */
export function buildCommentPrompt(lang: 'ru' | 'en' | 'hy'): string {
    switch (lang) {
        case 'ru':
            return '💬 Пожалуйста, напишите ваш отзыв:';
        case 'hy':
            return '💬 Խնդրում ենք գրել ձեր կարծիքը:';
        case 'en':
        default:
            return '💬 Please write your review:';
    }
}

/**
 * Template sent to the Admin Telegram chat when a customer submits a review.
 */
export function buildAdminReviewTemplate(data: {
    bookingNumber: string;
    tourOrTransferTitle: string;
    rating: number;
    language: string;
    comment: string;
}): string {
    return `📝 <b>NEW CUSTOMER REVIEW</b>

📋 <b>Booking:</b> <code>${escapeHtml(data.bookingNumber)}</code>
🗺 <b>Tour/Transfer:</b> ${escapeHtml(data.tourOrTransferTitle)}
⭐ <b>Rating:</b> ${data.rating}/5
🌐 <b>Language:</b> ${escapeHtml(data.language)}

💬 <b>Customer review:</b>
${escapeHtml(data.comment)}`;
}

/**
 * Localized confirmation sent to the customer after review is delivered to Admin.
 */
export function buildReviewConfirmationMessage(lang: 'ru' | 'en' | 'hy'): string {
    switch (lang) {
        case 'ru':
            return 'Спасибо большое за ваш отзыв! Мы очень ценим ваше мнение. 🙏';
        case 'hy':
            return 'Շատ շնորհակալ ենք ձեր կարծիքի համար։ Մենք իսկապես գնահատում ենք ձեր կարծիքը։ 🙏';
        case 'en':
        default:
            return 'Thank you so much for your review! We truly appreciate your feedback. 🙏';
    }
}

/**
 * Localized error message sent to customer if admin notification fails.
 */
export function buildReviewErrorMessage(lang: 'ru' | 'en' | 'hy'): string {
    switch (lang) {
        case 'ru':
            return '❌ Произошла ошибка при отправке отзыва. Пожалуйста, попробуйте позже.';
        case 'hy':
            return '❌ Տեղի ունեցավ սխալ կարծիքն ուղարկելիս: Խնդրում ենք փորձել ավելի ուշ:';
        case 'en':
        default:
            return '❌ An error occurred while sending your review. Please try again later.';
    }
}

