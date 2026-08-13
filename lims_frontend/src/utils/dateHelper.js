// src/utils/dateHelper.js

/**
 * Format tanggal ke standar Indonesia (contoh: 28 April 2026)
 */
export const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
        const dateObj = new Date(dateString);
        if (isNaN(dateObj.getTime())) return "-";

        return dateObj.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    } catch (e) {
        return "-";
    }
};

/**
 * Format waktu menjadi HH:mm secara aman dari ISO String atau raw string
 */
export const formatTime = (timeData) => {
    if (!timeData) return "00:00";

    // 1. Jika backend mengirim format jam murni (contoh: "14:30:00" atau "14:30")
    if (typeof timeData === "string" && /^\d{2}:\d{2}/.test(timeData)) {
        return timeData.substring(0, 5);
    }

    // 2. Jika backend mengirim ISO Date String (contoh: "1970-01-01T02:41:00.000Z")
    if (typeof timeData === "string" && timeData.includes("T")) {
        const dateObj = new Date(timeData);
        if (!isNaN(dateObj.getTime())) {
            const h = String(dateObj.getHours()).padStart(2, "0");
            const m = String(dateObj.getMinutes()).padStart(2, "0");
            return `${h}:${m}`;
        } else {
            // Fallback regex jika Date parsing gagal untuk ISO string
            const match = timeData.match(/T(\d{2}:\d{2})/);
            if (match) return match[1];
        }
    }

    // 3. Fallback terakhir jika dikirim sebagai objek Date murni
    try {
        const dateObj = new Date(timeData);
        if (!isNaN(dateObj.getTime())) {
            const h = String(dateObj.getHours()).padStart(2, "0");
            const m = String(dateObj.getMinutes()).padStart(2, "0");
            return `${h}:${m}`;
        }
    } catch (e) {
        // Abaikan error, kembalikan default
    }

    return "00:00";
};

/**
 * Format angka menjadi Rupiah (Opsional, sekalian kita rapikan)
 */
export const formatRupiah = (num) => {
    if (num === null || num === undefined) return "Rp 0";
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(num);
};