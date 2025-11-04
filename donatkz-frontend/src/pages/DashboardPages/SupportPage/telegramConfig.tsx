export const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '';
export const TELEGRAM_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID || '';
export const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

export const isTelegramConfigured = () => {
  return !!(TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID);
};

if (!isTelegramConfigured()) {
  console.warn(
    '⚠️ Telegram не настроена!\n' +
    'Добавьте в .env.local:\n' +
    'VITE_TELEGRAM_BOT_TOKEN=your_bot_token_here\n' +
    'VITE_TELEGRAM_CHAT_ID=your_chat_id_here'
  );
}
