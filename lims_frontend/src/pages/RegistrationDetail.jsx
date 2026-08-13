import React, { useState, useEffect } from "react";
import api from "../api/axios";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { getDetailedAge } from "../utils/ageHelper";
import kopMailImg from "../assets/kop_mail.png";
import QRCode from "react-qr-code";

import {
  ArrowLeft,
  Printer,
  User,
  Activity,
  CreditCard,
  Save,
  FlaskConical,
  AlertCircle,
  Settings2,
  X,
  Loader2,
} from "lucide-react";

export default function RegistrationDetail({ data, onBack }) {
  const { user: currentUser } = useAuth();

  // --- STATE INVOICE UX (BEST PRACTICE) ---
  const [isEditingNo, setIsEditingNo] = useState(false);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceBaseSeq, setInvoiceBaseSeq] = useState("");
  const [lastInvoice, setLastInvoice] = useState("");
  const [isInvoiceSaved, setIsInvoiceSaved] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [signatureMode, setSignatureMode] = useState("qr");

  useEffect(() => {
    const fetchSignatureMode = async () => {
      try {
        const res = await api.get("/settings");
        if (res.data.success && res.data.data.signature_mode) {
          setSignatureMode(res.data.data.signature_mode);
        }
      } catch (error) {
        console.error("Gagal mengambil pengaturan signature", error);
      }
    };
    fetchSignatureMode();
  }, []);

  // Fetch riwayat invoice terakhir khusus untuk Kasir / Admin
  useEffect(() => {
    const fetchLastInvoice = async () => {
      try {
        const res = await api.get("/registrations/last-invoice");
        if (res.data.success && res.data.data) {
          setLastInvoice(res.data.data);
        }
      } catch (error) {
        console.error("Gagal mengambil history invoice", error);
      }
    };

    if (["admin", "kasir"].includes(currentUser?.role?.toLowerCase())) {
      fetchLastInvoice();
    }
  }, [currentUser]);

  // Set default template, preview auto-increment, & status save
  useEffect(() => {
    if (data) {
      setIsInvoiceSaved(!!data.no_invoice);
      const year = new Date().getFullYear();

      if (data.no_invoice) {
        // Jika data sudah punya invoice, ekstrak urutannya
        setInvoiceNo(data.no_invoice);
        const match = data.no_invoice.match(/^(\d+)/);
        setInvoiceBaseSeq(match ? match[1] : "");
      } else if (lastInvoice) {
        // Auto-increment cerdas berdasarkan nomor invoice sebelumnya
        const match = lastInvoice.match(/^(\d+)/);
        if (match) {
          const nextSeq = String(parseInt(match[1], 10) + 1);
          setInvoiceBaseSeq(nextSeq);
          setInvoiceNo(`${nextSeq}/690798/PNBP/${year}`);
        } else {
          setInvoiceBaseSeq("1"); //
          setInvoiceNo(`1/690798/PNBP/${year}`); //
        }
      } else {
        setInvoiceBaseSeq("1");
        setInvoiceNo(`1/690798/PNBP/${year}`);
      }
    }
  }, [data, lastInvoice]);

  if (!data) return null;

  const handleSaveInvoice = async () => {
    setLoadingSave(true);
    try {
      await api.put(`/registrations/${data.id}`, { no_invoice: invoiceNo });
      toast.success("Nomor Invoice sukses diperbarui");
      setIsEditingNo(false);
      setIsInvoiceSaved(true);
      data.no_invoice = invoiceNo; // Sinkronisasi state lokal
    } catch (error) {
      console.error("Gagal memperbarui nomor:", error);
      toast.error("Gagal menyimpan nomor");
    } finally {
      setLoadingSave(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatRupiah = (num) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num || 0);
  };

  const formatTime = (timeData) => {
    if (!timeData) return "00:00";

    // Jika backend mengirim format jam murni (e.g., "14:30:00" atau "14:30")
    if (typeof timeData === "string" && /^\d{2}:\d{2}/.test(timeData)) {
      return timeData.substring(0, 5);
    }

    // Jika backend mengirim ISO Date String dari Prisma
    const dateObj = new Date(timeData);
    if (!isNaN(dateObj.getTime())) {
      const h = String(dateObj.getHours()).padStart(2, "0");
      const m = String(dateObj.getMinutes()).padStart(2, "0");
      return `${h}:${m}`;
    }

    return "00:00";
  };

  const qrInvoiceData = JSON.stringify({
    type: "INVOICE_PNBP",
    reg: data.no_reg,
    inv: invoiceNo,
    pasien: data.nama_pasien,
    total: data.total_biaya,
    petugas: currentUser?.fullname || currentUser?.username || "Admin",
    date: new Date().toISOString(),
  });

  // Logic Render Tabel Biaya (Improved 2-Column UI/UX)
  const renderItemTable = () => {
    const details = data.details || [];
    const isGratis = data.status_pembayaran === "gratis";

    const groupedDetails = details.reduce((acc, item) => {
      const key = item.nama_pemeriksaan;
      if (!acc[key]) {
        acc[key] = {
          nama: item.nama_pemeriksaan,
          harga: Number(item.harga_saat_ini),
          qty: 1,
        };
      } else {
        acc[key].qty += 1;
      }
      return acc;
    }, {});

    const items = Object.values(groupedDetails);

    const midIndex = Math.ceil(items.length / 2);
    const leftColumnItems = items.slice(0, midIndex);
    const rightColumnItems = items.slice(midIndex);

    const TableContent = ({ columnItems }) => (
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-2 py-2 text-left font-bold text-gray-600">
              Pemeriksaan
            </th>
            <th className="px-2 py-2 text-center font-bold text-gray-600 w-8">
              Qty
            </th>
            <th className="px-2 py-2 text-right font-bold text-gray-600">
              Subtotal
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {columnItems.map((item, idx) => (
            <tr key={idx}>
              <td
                className="px-2 py-2 text-gray-700 font-medium truncate max-w-[120px]"
                title={item.nama}
              >
                {item.nama}
              </td>
              <td className="px-2 py-2 text-center text-cyan-700 font-bold">
                {item.qty}
              </td>
              <td className="px-2 py-2 text-right text-gray-700 font-mono">
                {formatRupiah(item.harga * item.qty)
                  .replace("Rp", "")
                  .trim()}
              </td>
            </tr>
          ))}
          {columnItems.length === 0 && (
            <tr>
              <td colSpan="3" className="py-2 text-center text-gray-300">
                -
              </td>
            </tr>
          )}
        </tbody>
      </table>
    );

    return (
      <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-gray-200">
          <div className="col-span-1">
            <TableContent columnItems={leftColumnItems} />
          </div>
          <div className="col-span-1">
            <TableContent columnItems={rightColumnItems} />
          </div>
        </div>

        <div className="border-t border-gray-200">
          {isGratis ? (
            <div className="bg-green-50/50 px-4 py-2 flex justify-between items-center border-b border-gray-200">
              <span className="text-xs text-green-700 italic font-medium">
                Diskon / Subsidi Program:
              </span>
              <span className="text-xs text-green-700 font-bold font-mono">
                - {formatRupiah(data.total_biaya || 0)}
              </span>
            </div>
          ) : null}

          <div
            className={`${isGratis ? "bg-green-500" : "bg-cyan-500"} text-white print:bg-gray-100 print:text-black px-2 py-3 flex justify-between items-center`}
          >
            <span className="font-bold text-xs uppercase tracking-wider">
              {isGratis
                ? "Total Yang Harus Dibayar"
                : "Total Biaya Pemeriksaan"}
            </span>
            <span className="font-black text-lg font-mono">
              {isGratis ? "Rp 0" : formatRupiah(data.total_biaya)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in ">
      {/* HEADER ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition font-medium"
        >
          <div className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm">
            <ArrowLeft size={18} />
          </div>
          Kembali ke List
        </button>

        {/* Proteksi Role: Hanya Admin dan Kasir */}
        {["admin", "kasir"].includes(currentUser?.role?.toLowerCase()) && (
          <div className="flex flex-col md:flex-row gap-3 items-end md:items-center">
            {/* PANEL KONFIGURASI INVOICE */}
            <div
              className={`flex flex-col bg-white border ${isInvoiceSaved ? "border-gray-200" : "border-red-300 shadow-red-100 bg-red-50/20"} rounded-xl shadow-sm relative transition-all ${isEditingNo ? "p-4 w-full md:w-[380px]" : "px-4 py-2"}`}
            >
              {/* Badge Peringatan Jika Belum Disimpan */}
              {!isInvoiceSaved && !isEditingNo && (
                <span className="absolute -top-2.5 -right-2 bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold shadow-sm flex items-center gap-1 animate-pulse">
                  <AlertCircle size={10} /> WAJIB DISIMPAN
                </span>
              )}

              {isEditingNo ? (
                <div className="flex flex-col gap-3 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <span className="text-sm font-bold text-gray-800 flex items-center gap-2">
                      <Settings2 size={16} className="text-cyan-600" />{" "}
                      Konfigurasi Invoice
                    </span>
                    <button
                      onClick={() => setIsEditingNo(false)}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded-md transition hover:bg-gray-100"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* INFO NOMOR TERAKHIR DATABASE */}
                  <div className="bg-yellow-50/80 border border-yellow-200 rounded-lg p-2.5 shadow-sm">
                    <p className="text-[10px] text-yellow-700 font-bold uppercase mb-0.5">
                      Riwayat Terakhir Database:
                    </p>
                    <p className="text-xs font-mono font-bold text-black">
                      {lastInvoice || "Belum ada invoice di tahun ini"}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 items-start">
                    {/* INPUT KHUSUS NOMOR URUT */}
                    <div className="col-span-1 flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">
                        Start Urutan
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        className="w-full px-2 py-2 rounded-lg border border-gray-300 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 outline-none text-sm font-bold text-center"
                        value={invoiceBaseSeq}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setInvoiceBaseSeq(val);
                          const year = new Date().getFullYear();
                          setInvoiceNo(
                            val
                              ? `${val}/690798/PNBP/${year}`
                              : `/690798/PNBP/${year}`,
                          );
                        }}
                        placeholder="1"
                      />
                    </div>

                    {/* PREVIEW / MANUAL EDIT */}
                    <div className="col-span-2 flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">
                        Preview / Edit Manual
                      </label>
                      <input
                        type="text"
                        className="w-full px-2 py-2 rounded-lg border border-gray-300 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 outline-none text-sm font-bold font-mono text-cyan-800"
                        value={invoiceNo}
                        onChange={(e) => {
                          setInvoiceNo(e.target.value);
                          // Coba auto-extract urutan jika diedit manual
                          const match = e.target.value.match(/^(\d+)/);
                          setInvoiceBaseSeq(match ? match[1] : "");
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 mt-1">
                    <button
                      onClick={() => setIsEditingNo(false)}
                      className="text-xs px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition font-bold border border-gray-200"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleSaveInvoice}
                      disabled={loadingSave}
                      className="text-xs px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition flex items-center gap-1.5 font-bold shadow-sm"
                    >
                      {loadingSave ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Save size={14} />
                      )}{" "}
                      Simpan Invoice
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-xs font-bold text-gray-400 mr-2 uppercase">
                      No Invoice:
                    </span>
                    <span
                      className={`text-sm font-bold font-mono ${isInvoiceSaved ? "text-gray-800" : "text-red-600"}`}
                    >
                      {invoiceNo || "-"}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsEditingNo(true)}
                    className="text-cyan-600 p-1.5 ml-3 hover:bg-cyan-50 rounded-lg transition"
                    title="Konfigurasi Invoice"
                  >
                    <Settings2 size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* TOMBOL PRINT YANG DIPROTEKSI */}
            <button
              onClick={() => {
                if (!isInvoiceSaved) {
                  toast.error(
                    "Akses ditolak! Simpan Nomor Invoice terlebih dahulu sebelum mencetak.",
                  );
                  setIsEditingNo(true); // Memaksa kasir membuka mode input konfigurasi
                  return;
                }
                globalThis.print();
              }}
              className={`flex items-center justify-center gap-2 px-4 h-[46px] rounded-xl transition shadow-lg shrink-0 ${
                isInvoiceSaved
                  ? "bg-gray-800 text-white hover:bg-gray-700 hover:-translate-y-0.5"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed opacity-80"
              }`}
            >
              <Printer size={18} /> Cetak Bukti
            </button>
          </div>
        )}
      </div>

      <div id="print-section" className="print-content-padding">
        {/* --- KOP SURAT (PRINT VIEW) --- */}
        <div className="hidden print:flex justify-between items-center pb-4 mb-4">
          <img
            src={kopMailImg}
            alt="Logo"
            className="w-auto object-contain"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        </div>

        {/* JUDUL PRINT DENGAN NOMOR INVOICE */}
        <div className="hidden print:block text-center mb-6">
          <h3 className="text-lg font-extrabold text-black underline-offset-4 uppercase">
            INVOICE LAYANAN PNBP
            <br />
            BALAI LABORATORIUM KESEHATAN MASYARAKAT BANDA ACEH
          </h3>
          <p className="text-sm mt-1 uppercase tracking-widest">
            Nomor : {invoiceNo}
          </p>
        </div>

        {/* --- MAIN CARD --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:border-0 print:rounded-none">
          <div className="bg-linear-to-r from-teal-500 to-cyan-600 p-8 text-white print:text-black print:bg-none print:p-0 print:border-b print:pb-4 print:mb-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white text-xs font-bold uppercase mb-1 print:text-gray-400">
                  Nomor Registrasi Sistem
                </p>
                <h1 className="text-3xl font-bold print:text-lg">
                  {data.no_reg}
                </h1>
                {data.no_sampel_lab && (
                  <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-lg backdrop-blur-sm border border-white/20 print:border-black print:bg-transparent print:px-0 print:border-0">
                    <FlaskConical
                      size={16}
                      className="text-white print:text-black"
                    />
                    <span className="text-sm font-medium opacity-90 print:opacity-100">
                      No. Sampel:{" "}
                      <span className="font-bold text-white print:text-orange-600">
                        {data.no_sampel_lab}
                      </span>
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-white/20 px-4 py-1.5 rounded-full border border-white/30 print:border-black print:text-black">
                <span className="font-bold text-sm uppercase">
                  {data.status}
                </span>
              </div>
            </div>
          </div>

          <div className="p-8 print:p-0">
            {/* Row 1: Identitas & Info Sampel Sejajar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 print:gap-4 print:grid-cols-2">
              {/* Kiri: Identitas */}
              <div className="space-y-4 print:space-y-2">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100 mb-4 print:border-black print:mb-2">
                  <User className="text-cyan-600 print:hidden" size={20} />
                  <h3 className="font-bold text-gray-800 print:text-black print:text-sm print:uppercase">
                    Identitas Pasien
                  </h3>
                </div>
                <div className="print:text-xs space-y-2">
                  {/* TAMBAHAN RM DI ATAS NAMA PASIEN */}
                  {/* <div className="grid grid-cols-3">
                    <span className="text-gray-500">Dokter</span>
                    <span className="col-span-2 font-bold">
                      {data.dokter || "-"}
                    </span>
                  </div> */}
                  {/* <div className="grid grid-cols-3">
                    <span className="text-gray-500">No. Rekam Medik</span>
                    <span className="col-span-2 font-bold font-mono">
                      {data.no_rekam_medik || "-"}
                    </span>
                  </div> */}
                  <div className="grid grid-cols-3">
                    <span className="text-gray-500">Nama</span>
                    <span className="col-span-2 font-bold">
                      : {data.nama_pasien}
                    </span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-gray-500">NIK</span>
                    <span className="col-span-2">: {data.nik || "-"}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-gray-500">Umur / JK</span>
                    <span className="col-span-2 font-medium">
                      :{" "}
                      {getDetailedAge(data.tgl_lahir, data.tgl_daftar) ||
                        `${data.umur || "-"} Tahun`}{" "}
                      / {data.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-gray-500">Tgl Lahir</span>
                    <span className="col-span-2">
                      : {formatDate(data.tgl_lahir)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-gray-500">Alamat</span>
                    <span className="col-span-2">: {data.alamat || "-"}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-gray-500">Kontak</span>
                    <span className="col-span-2">
                      : {data.no_kontak || "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Kanan: Sampel & Layanan */}
              <div className="space-y-4 print:space-y-2">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100 mb-4 print:border-black print:mb-2">
                  <Activity className="text-cyan-600 print:hidden" size={20} />
                  <h3 className="font-bold text-gray-800 print:text-black print:text-sm print:uppercase">
                    Info Sampel & Layanan
                  </h3>
                </div>
                <div className="print:text-xs space-y-2">
                  <div className="grid grid-cols-3">
                    <span className="text-gray-500">Asal Sampel</span>
                    <span className="col-span-2 font-medium">
                      : {data.asal_sampel}
                    </span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-gray-500">Instansi</span>
                    <span className="col-span-2 font-medium">
                      : {data.pengirim_instansi || "-"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-gray-500">Pembayaran</span>
                    <span className="col-span-2 font-medium">
                      : {data.status_pembayaran || "berbayar"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-gray-500">Waktu Daftar</span>
                    <span className="col-span-2">
                      : {formatDate(data.tgl_daftar)} -{" "}
                      {formatTime(data.waktu_daftar)} WIB
                    </span>
                  </div>
                  {/* TAMBAHAN WAKTU SAMPLING DAN TERBIT */}
                  {/* <div className="grid grid-cols-3">
                    <span className="text-gray-500">Waktu Sampling</span>
                    <span className="col-span-2">
                      : {data.waktu_pengambilan
                        ? formatTime(data.waktu_pengambilan) + " WIB"
                        : "Menunggu sampling"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-gray-500">Terbit Hasil</span>
                    <span className="col-span-2 font-semibold text-emerald-600">
                      {data.validated_at
                        ? formatTime(data.validated_at) + " WIB"
                        : "Belum terbit"}
                    </span>
                  </div> */}

                  <div className="grid grid-cols-3">
                    <span className="text-gray-500">Catatan</span>
                    <span className="col-span-2 0 font-medium ">
                      : {data.catatan_tambahan || "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Rincian Pemeriksaan */}
            <div className="mt-8 print:mt-6 border-t border-gray-100 pt-6 print:border-black">
              <div className="flex items-center gap-2 mb-4 print:hidden">
                <CreditCard size={16} className="text-cyan-600" />
                <span className="font-bold text-gray-800">
                  Rincian Pemeriksaan
                </span>
              </div>
              {renderItemTable()}
            </div>

            {/* Footer Tanda Tangan */}
            <div className="hidden print:flex mt-4 pt-4 justify-end text-center text-xs text-black break-inside-avoid items-end">
              {/* SISI KANAN: PETUGAS */}
              <div className="flex flex-col items-center justify-center text-center w-64">
                <p>Aceh Besar, {formatDate(data.tgl_daftar)}</p>
                <p>Pengelola PNBP</p>

                <div className="py-2">
                  {signatureMode === "qr" ? (
                    <QRCode
                      value={qrInvoiceData}
                      size={80}
                      level="M"
                      style={{
                        height: "auto",
                        maxWidth: "100%",
                        width: "100%",
                      }}
                    />
                  ) : (
                    // Beri ruang kosong untuk TTD Kasir
                    <div className="h-14 w-full"></div>
                  )}
                </div>
                {signatureMode === "qr" && (
                  <span className="text-[9px] text-gray-400 mb-1 block">
                    Dokumen ini di tandatangani secara elektronik
                  </span>
                )}
                <p className="font-bold underline">
                  {currentUser?.fullname ||
                    currentUser?.username ||
                    "Admin Labkesmas"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
