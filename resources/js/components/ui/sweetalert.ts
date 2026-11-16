import Swal from 'sweetalert2';

/**
 * SweetAlert2 Custom Theme Helper untuk Bean & Bite
 * Konfigurasi Khusus:
 * - allowOutsideClick: false (Hanya bisa ditutup via tombol aksi / close button)
 * - allowEscapeKey: false (Tidak bisa ditutup sembarangan via tombol ESC)
 * - showCloseButton: true (Menyediakan tombol close 'X' yang eksplisit di pojok)
 */

const baseSwal = Swal.mixin({
    customClass: {
        popup: 'beanbite-swal-popup',
        confirmButton: 'beanbite-swal-confirm',
        cancelButton: 'beanbite-swal-cancel',
        closeButton: 'beanbite-swal-close-btn',
    },
    buttonsStyling: false,
    color: '#291506',
    background: '#FBF9F5',
    allowOutsideClick: false, // Tidak bisa ditutup dengan klik backdrop / area luar
    allowEscapeKey: false,   // Tidak bisa ditutup dengan tombol ESC
    showCloseButton: true,   // Menyediakan tombol 'X' resmi di pojok atas
});

// Toast Notification Ringkas, Rapi & Kompak (Otomatis hilang 1.5 detik tanpa icon berantakan)
const toastIcons = {
    success: '<span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:#DCFCE7;color:#15803D;font-weight:900;font-size:11px;flex-shrink:0;">✓</span>',
    error: '<span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:#FEE2E2;color:#B91C1C;font-weight:900;font-size:11px;flex-shrink:0;">✕</span>',
    warning: '<span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:#FEF3C7;color:#B45309;font-weight:900;font-size:11px;flex-shrink:0;">!</span>',
    info: '<span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:#EDE4D8;color:#543824;font-weight:900;font-size:11px;flex-shrink:0;">ℹ</span>',
};

export const showToast = (
    title: string,
    icon: 'success' | 'error' | 'warning' | 'info' = 'success',
    timer = 1500
) => {
    const iconHtml = toastIcons[icon] || toastIcons.success;

    return Swal.fire({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer,
        timerProgressBar: false,
        background: '#FFFFFF',
        color: '#291506',
        html: `
            <div style="display:flex;align-items:center;gap:8px;font-family:inherit;font-size:12px;font-weight:700;color:#291506;line-height:1.3;padding:1px 2px;">
                ${iconHtml}
                <span style="flex:1;text-align:left;">${title}</span>
            </div>
        `,
        customClass: {
            popup: '!py-2 !px-3.5 !rounded-2xl !shadow-lg !border !border-coffee-200/90 !w-auto !max-w-sm !m-2.5',
            htmlContainer: '!m-0 !p-0',
        },
    });
};

// Alert Sukses
export const showSuccess = (title: string, text = '', confirmButtonText = 'Oke, Mengerti') => {
    return baseSwal.fire({
        icon: 'success',
        iconColor: '#16A34A',
        title,
        text,
        confirmButtonText,
    });
};

// Alert Error
export const showError = (title: string, text = '', confirmButtonText = 'Tutup') => {
    return baseSwal.fire({
        icon: 'error',
        iconColor: '#DC2626',
        title,
        text,
        confirmButtonText,
    });
};

// Alert Peringatan
export const showWarning = (title: string, text = '', confirmButtonText = 'Lanjutkan') => {
    return baseSwal.fire({
        icon: 'warning',
        iconColor: '#D97706',
        title,
        text,
        confirmButtonText,
    });
};

// Alert Konfirmasi (Dialog Yes / No)
interface ConfirmOptions {
    title: string;
    text?: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
    isDanger?: boolean;
}

export const showConfirm = async ({
    title,
    text = '',
    confirmButtonText = 'Ya, Lanjutkan',
    cancelButtonText = 'Batal',
    isDanger = false,
}: ConfirmOptions): Promise<boolean> => {
    const result = await baseSwal.fire({
        icon: isDanger ? 'warning' : 'question',
        iconColor: isDanger ? '#DC2626' : '#A8763E',
        title,
        text,
        showCancelButton: true,
        confirmButtonText,
        cancelButtonText,
        reverseButtons: true,
        customClass: {
            popup: 'beanbite-swal-popup',
            confirmButton: isDanger
                ? 'bg-berry-600 hover:bg-berry-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm transition'
                : 'beanbite-swal-confirm',
            cancelButton: 'beanbite-swal-cancel',
            closeButton: 'beanbite-swal-close-btn',
        },
    });

    return result.isConfirmed;
};

// Alert Khusus Pembatalan / Void Order dengan Input Alasan Wajib
export const promptVoidOrder = async (orderNumber: string): Promise<string | null> => {
    const { value: reason, isConfirmed } = await baseSwal.fire({
        title: `Void Order #${orderNumber}`,
        text: 'Masukkan alasan pembatalan transaksi ini secara jelas (wajib dicatat di audit log):',
        input: 'textarea',
        inputPlaceholder: 'Contoh: Pelanggan salah pilih menu / double order / walk-out...',
        inputAttributes: {
            'aria-label': 'Tulis alasan pembatalan',
            class: 'w-full p-3 border border-coffee-200 rounded-xl focus:border-coffee-700 focus:outline-none text-sm text-coffee-900 bg-white mt-3',
        },
        showCancelButton: true,
        confirmButtonText: 'Konfirmasi Batalkan',
        cancelButtonText: 'Batal',
        reverseButtons: true,
        customClass: {
            popup: 'beanbite-swal-popup',
            confirmButton: 'bg-berry-600 hover:bg-berry-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm transition',
            cancelButton: 'beanbite-swal-cancel',
            closeButton: 'beanbite-swal-close-btn',
        },
        inputValidator: (val) => {
            if (!val || val.trim().length < 5) {
                return 'Alasan pembatalan wajib diisi minimal 5 karakter demi kepatuhan audit!';
            }
            return null;
        },
    });

    return isConfirmed ? reason : null;
};

// Alert Konfirmasi dengan Password Super Admin
export const promptPasswordConfirm = async (
    title: string,
    text = 'Masukkan kata sandi Super Admin Anda untuk mengonfirmasi tindakan ini:'
): Promise<string | null> => {
    const { value: password, isConfirmed } = await baseSwal.fire({
        title,
        text,
        input: 'password',
        inputPlaceholder: 'Kata sandi Super Admin Anda...',
        inputAttributes: {
            'aria-label': 'Password konfirmasi',
            class: 'w-full p-3 border border-coffee-200 rounded-xl focus:border-coffee-700 focus:outline-none text-sm text-coffee-900 bg-white mt-3',
            autocomplete: 'current-password',
        },
        showCancelButton: true,
        confirmButtonText: 'Konfirmasi Otorisasi',
        cancelButtonText: 'Batal',
        reverseButtons: true,
        customClass: {
            popup: 'beanbite-swal-popup',
            confirmButton: 'bg-berry-600 hover:bg-berry-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm transition',
            cancelButton: 'beanbite-swal-cancel',
            closeButton: 'beanbite-swal-close-btn',
        },
        inputValidator: (val) => {
            if (!val || val.trim().length === 0) {
                return 'Kata sandi Super Admin wajib diisi!';
            }
            return null;
        },
    });

    return isConfirmed ? password : null;
};

export default {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showConfirm,
    promptVoidOrder,
    promptPasswordConfirm,
};
