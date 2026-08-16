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
💰 <b>Сумма:</b> ${ctx.totalPrice} AMD

⏳ Ваша заявка обрабатывается. Мы свяжемся с вами в ближайшее время для подтверждения.

Спасибо, что выбрали ArTours! 🙏`;

    const en = `🌍 <b>ArTours — Your request has been received!</b>

📋 <b>Booking number:</b> <code>${ctx.bookingNumber}</code>
🗺 <b>Tour/Transfer:</b> ${ctx.enTitle}
👤 <b>Name:</b> ${ctx.customerName}
👥 <b>People:</b> ${ctx.peopleCount}
📅 <b>Travel date:</b> ${fmtDate(ctx.travelDate)}
💰 <b>Total:</b> ${ctx.totalPrice} AMD

⏳ Your request is being processed. We will contact you shortly to confirm.

Thank you for choosing ArTours! 🙏`;

    const hy = `🌍 <b>ArTours — Ձեր հայտը ընդունված է:</b>

📋 <b>Ամրագրման համարը:</b> <code>${ctx.bookingNumber}</code>
🗺 <b>Տուր/Տրանսֆեր:</b> ${ctx.hyTitle}
👤 <b>Անուն:</b> ${ctx.customerName}
👥 <b>Մարդկանց քանակը:</b> ${ctx.peopleCount}
📅 <b>Ուղևորության ամսաթիվը:</b> ${fmtDate(ctx.travelDate)}
💰 <b>Գումարը:</b> ${ctx.totalPrice} AMD

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
💰 <b>Сумма:</b> ${ctx.totalPrice} AMD

🎉 Ваше бронирование подтверждено! Ждём вас в путешествие!`;

    const en = `✅ <b>ArTours — Booking Confirmed!</b>

📋 <b>Booking number:</b> <code>${ctx.bookingNumber}</code>
🗺 <b>Tour/Transfer:</b> ${ctx.enTitle}
👤 <b>Name:</b> ${ctx.customerName}
👥 <b>People:</b> ${ctx.peopleCount}
📅 <b>Travel date:</b> ${fmtDate(ctx.travelDate)}
💰 <b>Total:</b> ${ctx.totalPrice} AMD

🎉 Your booking is confirmed! We look forward to your trip!`;

    const hy = `✅ <b>ArTours — Ամրագրումը հաստատված է:</b>

📋 <b>Ամրագրման համարը:</b> <code>${ctx.bookingNumber}</code>
🗺 <b>Տուր/Տրանսֆեր:</b> ${ctx.hyTitle}
👤 <b>Անուն:</b> ${ctx.customerName}
👥 <b>Մարդկանց քանակը:</b> ${ctx.peopleCount}
📅 <b>Ուղևորության ամսաթիվը:</b> ${fmtDate(ctx.travelDate)}
💰 <b>Գումարը:</b> ${ctx.totalPrice} AMD

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
 * Sent to the admin Telegram account on every new booking.
 * Single language (Russian) — concise operational summary.
 */
export function buildAdminNewBookingTemplate(ctx: NotificationContext): string {
    return `🆕 <b>Новое бронирование — ArTours</b>

📋 <b>Номер:</b> <code>${ctx.bookingNumber}</code>
🗺 <b>Тур/Трансфер:</b> ${ctx.ruTitle}
👤 <b>Клиент:</b> ${ctx.customerName}
📧 <b>Email:</b> ${ctx.customerEmail}
📞 <b>Телефон:</b> ${ctx.customerPhone}
👥 <b>Количество человек:</b> ${ctx.peopleCount}
📅 <b>Дата поездки:</b> ${fmtDate(ctx.travelDate)}
💰 <b>Сумма:</b> ${ctx.totalPrice} AMD${ctx.notes ? `\n📝 <b>Примечания:</b> ${ctx.notes}` : ''}`;
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
📞 <b>Телефон:</b> ${ctx.customerPhone}
👥 <b>Количество человек:</b> ${ctx.peopleCount}
📅 <b>Дата поездки:</b> ${fmtDate(ctx.travelDate)}
💰 <b>Сумма:</b> ${ctx.totalPrice} AMD`;
}
