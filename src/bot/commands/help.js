/**
 * /help command handler
 */

const { helpMessage } = require('../../utils/messages');

async function helpCommand(ctx) {
    try {
        await ctx.reply(helpMessage, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error('Error in /help command:', error);
        await ctx.reply('Maaf terjadi kesalahan. Coba lagi nanti.');
    }
}

module.exports = helpCommand;
