/**
 * Message templates for bot responses
 */

const errorMessages = {
    PARSE_ERROR: 'Format salah. Contoh: 20k makan siang',
    AMOUNT_ZERO: 'Nominal tidak boleh 0',
    AMOUNT_TOO_LARGE: 'Nominal terlalu besar (max 1 milyar)',
    DESCRIPTION_EMPTY: 'Deskripsi tidak boleh kosong. Contoh: 20k makan siang',
    DESCRIPTION_TOO_LONG: 'Deskripsi terlalu panjang (max 200 karakter)',
    LIMIT_EXCEEDED: 'Limit bulan ini tercapai ({current}/{limit}). Upgrade ke Pro: /upgrade',
    NOT_FOUND: 'Transaksi #{id} tidak ditemukan',
    RATE_LIMIT: 'Terlalu banyak request. Tunggu sebentar.',
    SYSTEM_ERROR: 'Maaf terjadi kesalahan. Coba lagi nanti.',
    DB_ERROR: 'Gagal menyimpan data. Coba lagi.',
    UNAUTHORIZED: '⛔️ Unauthorized'
};

const welcomeMessage = `
🎉 *Selamat datang di FinBot!*

Catat pengeluaran dengan mudah:
📝 Ketik: \`20k makan siang\`
📝 Ketik: \`150000 belanja bulanan\`
📝 Ketik: \`+500k gaji\` (untuk pemasukan)

*Lihat rekap:*
/today - Rekap hari ini
/week - Rekap 7 hari terakhir
/month - Rekap bulan ini

📊 Paket Anda: *{plan}* ({used}/{limit} catatan)
💡 Upgrade: /upgrade

❓ Bantuan: /help
`;

const welcomeBackMessage = `
👋 *Selamat datang kembali!*

📊 Paket: *{plan}*
📝 Terpakai bulan ini: {used}/{limit}
{expiry}

Mulai catat: ketik nominal + deskripsi
Contoh: \`25k makan siang\`

❓ Bantuan: /help
`;

const helpMessage = `
📚 *Bantuan FinBot*

*📝 CATAT TRANSAKSI*
Ketik langsung: \`20k makan siang\`
Pemasukan: \`+50k gaji freelance\`

*📊 LIHAT REKAP*
/today - Hari ini
/week - 7 hari terakhir
/month - Bulan ini
/month 2024-11 - Bulan tertentu

*📜 KELOLA TRANSAKSI*
/history - 10 transaksi terakhir
/history 20 - 20 transaksi terakhir
/delete <id> - Hapus transaksi

*💳 LANGGANAN*
/plan - Info paket
/upgrade - Upgrade ke Pro
/status - Cek status akun

❓ Butuh bantuan lebih?
Hubungi admin bot.
`;

const planInfoMessage = `
💳 *Paket Langganan*

🆓 *FREE* {freeStatus}
• 15 catatan per bulan
• Rekap harian/mingguan/bulanan
• Edit & hapus transaksi

⭐️ *PRO* - ~Rp 25.000~ *Rp 9.000*/bulan {proStatus}
🔥 _Promo Terbatas!_
• 200 catatan per bulan
• Semua fitur Free
• Export CSV (coming soon)
• Priority support

Upgrade sekarang: /upgrade
`;

const upgradeMessage = `
💳 *Upgrade ke PRO*

💰 Harga: ~Rp 25.000~ *Rp 9.000 / bulan*
🔥 _Promo Terbatas!_
🔖 Referensi: \`{reference}\`

📱 Scan QRIS di bawah ini untuk pembayaran:

Setelah transfer, kirim *screenshot bukti pembayaran* ke chat ini.

⏰ Link pembayaran berlaku 24 jam
❓ Butuh bantuan? /help
`;

const paymentReceivedMessage = `
✅ *Bukti pembayaran diterima!*

🔖 Referensi: \`{reference}\`

Admin akan verifikasi dalam 1x24 jam. 
Anda akan dapat notifikasi jika pembayaran dikonfirmasi.

📋 Cek status: /status
`;

const paymentConfirmedMessage = `
🎉 *Pembayaran Dikonfirmasi!*

Paket *PRO* Anda aktif sampai *{expiryDate}*

✅ Limit 200 catatan/bulan
✅ Export CSV (coming soon)
✅ Priority support

Selamat menggunakan! 🚀
`;

const paymentRejectedMessage = `
❌ *Pembayaran Ditolak*

🔖 Referensi: \`{reference}\`
📝 Alasan: {reason}

Silakan kirim bukti pembayaran yang lebih jelas atau hubungi admin untuk bantuan.

🔄 Upload ulang: /upgrade
`;

const transactionConfirmMessage = `
✅ *Tercatat!*

#️⃣ #{seq} - *Rp {amount}*
📝 {description}
🗓 {date}

📊 Sisa limit: {used}/{limit} catatan bulan ini
`;

const deleteConfirmPrompt = `
⚠️ *Hapus transaksi ini?*

#️⃣ #{seq} | {date}
{emoji} Rp {amount} - {description}
`;

const deleteSuccessMessage = `
✅ Transaksi #{seq} berhasil dihapus
`;

module.exports = {
    errorMessages,
    welcomeMessage,
    welcomeBackMessage,
    helpMessage,
    planInfoMessage,
    upgradeMessage,
    paymentReceivedMessage,
    paymentConfirmedMessage,
    paymentRejectedMessage,
    transactionConfirmMessage,
    deleteConfirmPrompt,
    deleteSuccessMessage
};
