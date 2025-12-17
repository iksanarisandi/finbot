/**
 * /delete command handler - Delete a transaction
 */

const { Markup } = require('telegraf');
const { getUserByTelegramId } = require('../../services/userService');
const { getTransactionBySeq, deleteTransaction } = require('../../services/transactionService');
const { formatDateShort, formatNumber } = require('../../utils/formatter');
const { deleteConfirmPrompt, deleteSuccessMessage } = require('../../utils/messages');

async function deleteCommand(ctx) {
    try {
        const user = await getUserByTelegramId(ctx.from.id);

        if (!user) {
            await ctx.reply('Kirim /start terlebih dahulu untuk mendaftar.');
            return;
        }

        // Parse seq from args
        const args = ctx.message.text.split(' ').slice(1);

        if (args.length === 0) {
            await ctx.reply('Format salah. Contoh: /delete 15');
            return;
        }

        const seq = parseInt(args[0], 10);

        if (isNaN(seq) || seq <= 0) {
            await ctx.reply('Format salah. Contoh: /delete 15');
            return;
        }

        const transaction = await getTransactionBySeq(user.id, seq);

        if (!transaction) {
            await ctx.reply(`Transaksi #${seq} tidak ditemukan`);
            return;
        }

        const emoji = transaction.type === 'expense' ? '💸' : '💰';
        const date = formatDateShort(transaction.date, user.timezone);

        const message = deleteConfirmPrompt
            .replace('{seq}', seq.toString())
            .replace('{date}', date)
            .replace('{emoji}', emoji)
            .replace('{amount}', formatNumber(Number(transaction.amount)))
            .replace('{description}', transaction.description);

        await ctx.reply(message, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                Markup.button.callback('✅ Ya, Hapus', `delete_confirm:${seq}`),
                Markup.button.callback('❌ Batal', 'delete_cancel')
            ])
        });
    } catch (error) {
        console.error('Error in /delete command:', error);
        await ctx.reply('Gagal menghapus. Coba lagi.');
    }
}

/**
 * Handle delete confirmation callback
 */
async function handleDeleteConfirm(ctx) {
    try {
        const data = ctx.callbackQuery.data;
        const seq = parseInt(data.split(':')[1], 10);

        const user = await getUserByTelegramId(ctx.from.id);

        if (!user) {
            await ctx.answerCbQuery('Error: User tidak ditemukan');
            return;
        }

        const deleted = await deleteTransaction(user.id, seq);

        if (!deleted) {
            await ctx.answerCbQuery('Transaksi tidak ditemukan');
            await ctx.editMessageText('Transaksi tidak ditemukan atau sudah dihapus.');
            return;
        }

        const message = deleteSuccessMessage.replace('{seq}', seq.toString());
        await ctx.editMessageText(message);
        await ctx.answerCbQuery('Berhasil dihapus');
    } catch (error) {
        console.error('Error in delete confirm:', error);
        await ctx.answerCbQuery('Gagal menghapus');
    }
}

/**
 * Handle delete cancel callback
 */
async function handleDeleteCancel(ctx) {
    try {
        await ctx.editMessageText('❌ Penghapusan dibatalkan');
        await ctx.answerCbQuery('Dibatalkan');
    } catch (error) {
        console.error('Error in delete cancel:', error);
        await ctx.answerCbQuery('Error');
    }
}

module.exports = {
    deleteCommand,
    handleDeleteConfirm,
    handleDeleteCancel
};
