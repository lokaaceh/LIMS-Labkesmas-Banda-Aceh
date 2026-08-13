// src/utils/ageHelper.js

export const getDetailedAge = (tglLahir, tglDaftar) => {
    if (!tglLahir) return null;

    const birth = new Date(tglLahir);
    // Jika tidak ada tgl_daftar, gunakan hari ini sebagai patokan
    const ref = tglDaftar ? new Date(tglDaftar) : new Date();

    let years = ref.getFullYear() - birth.getFullYear();
    let months = ref.getMonth() - birth.getMonth();
    let days = ref.getDate() - birth.getDate();

    // Kalkulasi peminjaman hari/bulan ke belakang
    if (days < 0) {
        months -= 1;
        const prevMonth = new Date(ref.getFullYear(), ref.getMonth(), 0).getDate();
        days += prevMonth;
    }
    if (months < 0) {
        years -= 1;
        months += 12;
    }

    if (years < 0) return "-"; // Fallback jika data tidak valid

    let result = [];
    if (years > 0) result.push(`${years} Thn`);
    if (months > 0) result.push(`${months} Bln`);
    if (days > 0 || result.length === 0) result.push(`${days} Hr`);

    return result.join(" ");
};