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
🗺 <b>Tour/Location:</b> ${ctx.enTitle}
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
🗺 <b>Tour/Location:</b> ${ctx.enTitle}
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
🗺 <b>Tour/Location:</b> ${ctx.enTitle}
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
 * Sent when the booking is marked COMPLETED.
 */
export function buildCompletedTemplate(_ctx?: NotificationContext): string {
    const ru = `Спасибо, что путешествовали с ArTours! ❤️
Надеемся, что Вы прекрасно провели время и получили незабываемые впечатления!
Нам очень важно Ваше мнение. Будем рады, если Вы поделитесь своими впечатлениями и оставите отзыв на сайте <a href="https://artours.am">ArTours.am</a>.
Ваши отзывы помогают нам становиться лучше и делать каждое путешествие ещё приятнее.
Спасибо, что выбрали ArTours! Будем рады снова отправиться с Вами в новое путешествие. 🌍`;

    const en = `Thank you for traveling with ArTours! ❤️
We hope you had a wonderful time and created unforgettable memories with us!
Your opinion means a lot to us. We'd love to hear about your experience, so please take a moment to share your thoughts and leave a review on <a href="https://artours.am">ArTours.am</a>.
Your feedback helps us improve and make every journey even better.
Thank you for choosing ArTours. We hope to see you again on your next adventure! 🌍`;

    const hy = `Շնորհակալություն ArTours-ի հետ ճանապարհորդելու համար։ ❤️
Հուսով ենք՝ հրաշալի ժամանակ եք անցկացրել և մեզ հետ անմոռանալի հիշողություններ ստեղծել։
Ձեր կարծիքը շատ կարևոր է մեզ համար։ Ուրախ կլինենք, եթե կիսվեք Ձեր տպավորություններով և կարծիք թողնեք <a href="https://artours.am">ArTours.am</a> կայքում։
Ձեր արձագանքներն օգնում են մեզ բարելավել մեր ծառայությունները և յուրաքանչյուր ճանապարհորդություն դարձնել ավելի հաճելի։
Շնորհակալություն ArTours-ն ընտրելու համար։ Սիրով կսպասենք Ձեզ մեր հաջորդ արկածների ընթացքում։ 🌍`;

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
🗺 <b>Tour/Location:</b> ${ctx.enTitle}
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



// ─── Comment moderation templates ────────────────────────────────────────────

function fmtDateTime(date: Date | string): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
}

/**
 * Sent to the admin Telegram account when a new comment is submitted and awaiting approval.
 */
export function buildAdminNewCommentTemplate(comment: {
    id: string;
    name: string;
    surname: string;
    rating?: number;
    originalText?: string;
    createdAt: Date | string;
}): string {
    const link = `https://artours.am/admin/comments?search=${comment.id}`;
    return `🔔 <b>Новый комментарий на модерацию</b>

👤 <b>Автор:</b> ${escapeHtml(comment.name)}, ${escapeHtml(comment.surname)}${comment.rating ? `\n⭐ <b>Оценка:</b> ${comment.rating}/5` : ''}
🕒 <b>Дата:</b> ${fmtDateTime(comment.createdAt)}${comment.originalText ? `\n\n💬 <b>Отзыв:</b>\n${escapeHtml(comment.originalText)}` : ''}

🔗 <a href="${link}">${link}</a>`;
}

/**
 * Inline keyboard button linking directly to the comment moderation page.
 */
export function buildAdminNewCommentKeyboard(commentId: string) {
    const link = `https://artours.am/admin/comments?search=${commentId}`;
    return {
        inline_keyboard: [
            [
                {
                    text: '🔎 Открыть комментарий',
                    url: link,
                },
            ],
        ],
    };
}


