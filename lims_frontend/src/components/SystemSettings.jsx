// src/pages/SystemSettings.jsx
import React, { useState, useEffect } from "react";
import {
  Save,
  Settings,
  FileCheck,
  Edit,
  Loader2,
  Hash,
  Image as ImageIcon,
  ImageOff,
  Download,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../api/axios";

export default function SystemSettings() {
  const [signatureMode, setSignatureMode] = useState("qr");
  const [kodeLaboratorium, setKodeLaboratorium] = useState("");
  const [useKopSurat, setUseKopSurat] = useState(true);

  // State baru untuk opsi download pasien
  const [allowPublicDownload, setAllowPublicDownload] = useState(true);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load setting dari Database saat komponen di-mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get("/settings");
        if (res.data.success) {
          if (res.data.data.signature_mode)
            setSignatureMode(res.data.data.signature_mode);
          if (res.data.data.kode_laboratorium)
            setKodeLaboratorium(res.data.data.kode_laboratorium);
          // Konversi string 'false' ke boolean false, default true
          if (res.data.data.use_kop_surat !== undefined) {
            setUseKopSurat(res.data.data.use_kop_surat === "true");
          }
          // Set state dari DB
          if (res.data.data.allow_public_download !== undefined) {
            setAllowPublicDownload(
              res.data.data.allow_public_download === "true",
            );
          }
        }
      } catch (error) {
        toast.error("Gagal memuat pengaturan sistem dari server");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await api.put("/settings", {
        signature_mode: signatureMode,
        kode_laboratorium: kodeLaboratorium,
        use_kop_surat: useKopSurat,
        allow_public_download: String(allowPublicDownload),
      });
      toast.success("Pengaturan sistem berhasil disimpan secara global!");
    } catch (error) {
      console.error("Save error:", error);
      toast.error(
        error.response?.data?.message || "Gagal menyimpan pengaturan",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 size={32} className="animate-spin text-cyan-600" />
        <p className="text-gray-500 font-medium">Memuat Pengaturan Global...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-10">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
          <Settings size={28} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Pengaturan Sistem</h2>
          <p className="text-gray-500 text-sm font-medium">
            Konfigurasi preferensi global aplikasi LIMS.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* SECTION: TANDA TANGAN */}
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-lg">
            Metode Tanda Tangan Cetak
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Pilih bagaimana tanda tangan ditampilkan pada dokumen cetak (LHU).
          </p>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-gray-100">
          <label
            className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              signatureMode === "qr"
                ? "border-cyan-500 bg-cyan-50/30"
                : "border-gray-200 hover:border-cyan-200 hover:bg-gray-50"
            }`}
          >
            <input
              type="radio"
              value="qr"
              checked={signatureMode === "qr"}
              onChange={(e) => setSignatureMode(e.target.value)}
              className="w-5 h-5 mt-0.5 text-cyan-600 focus:ring-cyan-500"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <FileCheck size={18} className="text-gray-700" />
                <span className="font-bold text-gray-800">
                  Gunakan QR Code (Digital)
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Dokumen dicetak dengan QR Code untuk validasi.
              </p>
            </div>
          </label>
          <label
            className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              signatureMode === "manual"
                ? "border-cyan-500 bg-cyan-50/30"
                : "border-gray-200 hover:border-cyan-200 hover:bg-gray-50"
            }`}
          >
            <input
              type="radio"
              value="manual"
              checked={signatureMode === "manual"}
              onChange={(e) => setSignatureMode(e.target.value)}
              className="w-5 h-5 mt-0.5 text-cyan-600 focus:ring-cyan-500"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Edit size={18} className="text-gray-700" />
                <span className="font-bold text-gray-800">
                  Kosongkan (Manual)
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Area dibiarkan kosong untuk tanda tangan basah.
              </p>
            </div>
          </label>
        </div>

        {/* SECTION: IDENTITAS LABORATORIUM */}
        <div className="p-6 border-b border-gray-100 bg-gray-50/30">
          <h3 className="font-bold text-gray-800 text-lg">
            Pengaturan Cetak LHU
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Konfigurasi elemen visual pada Laporan Hasil Pemeriksaan (LHU).
          </p>
        </div>
        <div className="p-6 space-y-6">
          {/* Kode Laboratorium */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
              <Hash size={16} className="text-cyan-600" /> Kode Laboratorium
            </label>
            <input
              type="text"
              value={kodeLaboratorium}
              onChange={(e) => setKodeLaboratorium(e.target.value)}
              placeholder="Contoh: 11060700001"
              className="w-full md:w-1/2 p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all shadow-sm"
            />
            <p className="text-xs text-gray-500">
              Kode ini akan ditampilkan pada tabel informasi pasien di LHU.
            </p>
          </div>

          {/* Pengaturan Kop Surat */}
          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
              <ImageIcon size={16} className="text-cyan-600" /> Visibilitas Kop
              Surat
            </label>
            <div className="flex gap-4">
              <label
                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all flex-1 ${
                  useKopSurat
                    ? "border-cyan-500 bg-cyan-50/30"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  checked={useKopSurat}
                  onChange={() => setUseKopSurat(true)}
                  className="w-4 h-4 text-cyan-600 focus:ring-cyan-500"
                />
                <ImageIcon
                  size={18}
                  className={useKopSurat ? "text-cyan-600" : "text-gray-400"}
                />
                <span
                  className={`font-semibold ${useKopSurat ? "text-cyan-800" : "text-gray-600"}`}
                >
                  Tampilkan Kop Surat
                </span>
              </label>

              <label
                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all flex-1 ${
                  !useKopSurat
                    ? "border-red-500 bg-red-50/30"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  checked={!useKopSurat}
                  onChange={() => setUseKopSurat(false)}
                  className="w-4 h-4 text-red-600 focus:ring-red-500"
                />
                <ImageOff
                  size={18}
                  className={!useKopSurat ? "text-red-600" : "text-gray-400"}
                />
                <span
                  className={`font-semibold ${!useKopSurat ? "text-red-800" : "text-gray-600"}`}
                >
                  Sembunyikan Kop
                </span>
              </label>
            </div>
            <p className="text-xs text-gray-500">
              Pilih "Sembunyikan Kop" jika Anda mencetak LHU di atas kertas yang
              sudah memiliki Kop cetak dari pabrik.
            </p>
          </div>
        </div>

        <div className="p-6 border-b border-t border-gray-100 bg-gray-50/30">
          <h3 className="font-bold text-gray-800 text-lg">
            Akses Portal Publik
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Atur perizinan dan visibilitas pada halaman pelacakan mandiri
            pasien.
          </p>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
              <Download size={16} className="text-cyan-600" /> Izin Unduh LHU
              Mandiri
            </label>
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={allowPublicDownload}
                  onChange={(e) => setAllowPublicDownload(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                <span
                  className={`ml-3 text-sm font-bold ${allowPublicDownload ? "text-cyan-700" : "text-gray-500"}`}
                >
                  {allowPublicDownload
                    ? "Diizinkan (Pasien dapat mengunduh PDF)"
                    : "Nonaktif (Hanya tracking status)"}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* FOOTER ACTION */}
        <div className="p-6 bg-gray-50 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-400 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md shadow-cyan-200 transition-all"
          >
            <span className="flex items-center justify-center">
              {isSaving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
            </span>
            <span>{isSaving ? "Menyimpan..." : "Simpan Pengaturan"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
