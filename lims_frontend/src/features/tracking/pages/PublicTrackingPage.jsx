import React, { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Download,
  Hash,
  IdCard,
  User,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

import TrackingSteps from "../components/TrackingSteps";
import { containerVar, itemVar, getActiveIndex } from "../utils/trackingHelper";
import LHUPrintTemplate from "../../../components/LHUPrintTemplate";

export default function PublicTracking() {
  const [form, setForm] = useState({ no_reg: "", nik: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [allowDownload, setAllowDownload] = useState(true);

  const handleSearch = async (e) => {
    e.preventDefault();
    setResult(null);
    setLoading(true);
    setHasSearched(true);

    try {
      const API_URL = import.meta.env.VITE_API_BASE_URL || "";
      const res = await axios.post(`${API_URL}/public/track`, form);

      if (res.data?.success && res.data?.data) {
        setResult(res.data.data);
        setAllowDownload(res.data.settings?.allow_public_download ?? true);
        toast.success("Data Ditemukan!");
      } else {
        toast.error("Data tidak ditemukan");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Kesalahan Server");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadLHU = async () => {
    if (result.link_hasil && result.link_hasil.includes("custom_lhu_")) {
      const toastId = toast.loading("Mempersiapkan unduhan PDF...");
      try {
        const match = result.link_hasil.match(
          /(custom_lhu_[a-zA-Z0-9-]+\.[a-zA-Z0-9]+)/i,
        );
        if (!match || !match[0]) throw new Error("Format file tidak valid");

        const fileName = match[0];
        const apiBase =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
        const downloadUrl = `${apiBase}/public/download/${fileName}`;

        const response = await axios.get(downloadUrl, { responseType: "blob" });
        const blob = new Blob([response.data], { type: "application/pdf" });
        const objectUrl = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = `LHU_CUSTOM_${result?.no_reg}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(objectUrl);

        toast.update(toastId, {
          render: "LHU Berhasil diunduh",
          type: "success",
          isLoading: false,
          autoClose: 2000,
        });
      } catch (e) {
        console.error("Download Error:", e);
        toast.update(toastId, {
          render: "Gagal mengunduh file, pastikan internet stabil.",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
      }
    } else {
      const toastId = toast.loading("Mempersiapkan dokumen LHU...");
      setTimeout(() => {
        toast.dismiss(toastId);
        window.print();
      }, 800);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center py-12 px-4 relative overflow-hidden print:hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-cyan-100 rounded-full blur-[100px] opacity-50 z-0" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-blue-100 rounded-full blur-[80px] opacity-40 z-0" />

        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="absolute top-6 left-6 z-10"
        >
          <Link
            to="/"
            className="flex items-center gap-2 text-slate-500 hover:text-cyan-600 font-bold text-sm transition-all group"
          >
            <div className="p-2 bg-white rounded-xl shadow-sm group-hover:shadow-md border border-slate-100 transition-all">
              <ArrowLeft size={18} />
            </div>
            <span className="hidden sm:inline">Beranda</span>
          </Link>
        </motion.div>

        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-cyan-900/5 p-8 border border-white relative z-10"
        >
          <div className="text-center mb-10">
            <motion.img
              whileHover={{ rotate: 10, scale: 1.1 }}
              src="/logo.svg"
              className="h-14 mx-auto mb-6"
              alt="Logo"
            />
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Lacak <span className="text-cyan-600">Status</span>
            </h2>
            <p className="text-slate-400 text-xs font-semibold mt-2 uppercase tracking-widest">
              Digital LIMS Tracking
            </p>
          </div>

          <form onSubmit={handleSearch} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-500 uppercase ml-2 tracking-wider">
                No. Registrasi
              </label>
              <div className="relative group">
                <Hash
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-500 transition-colors"
                  size={18}
                />
                <input
                  type="text"
                  required
                  placeholder="REG-2026..."
                  className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-cyan-500 focus:ring-0 outline-none transition-all font-mono text-sm shadow-sm"
                  value={form.no_reg}
                  onChange={(e) =>
                    setForm({ ...form, no_reg: e.target.value.toUpperCase() })
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-500 uppercase ml-2 tracking-wider">
                NIK Konfirmasi
              </label>
              <div className="relative group">
                <IdCard
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-500 transition-colors"
                  size={18}
                />
                <input
                  type="text"
                  required
                  maxLength={16}
                  placeholder="16 Digit NIK"
                  className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-cyan-500 focus:ring-0 outline-none transition-all text-sm shadow-sm font-semibold tracking-widest"
                  value={form.nik}
                  onChange={(e) =>
                    setForm({ ...form, nik: e.target.value.replace(/\D/g, "") })
                  }
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-cyan-200 transition-all flex items-center justify-center gap-3 active:shadow-inner"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <Search size={18} /> CEK SEKARANG
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Result Section */}
        <div className="w-full max-w-md mt-10 relative z-10">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="result"
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, scale: 0.9 }}
                variants={containerVar}
                className="bg-white rounded-[2.5rem] shadow-2xl border border-white overflow-hidden shadow-slate-200"
              >
                <div className="p-8 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-cyan-100 flex items-center justify-center text-cyan-600 shadow-inner">
                      <User size={28} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-cyan-600 uppercase tracking-widest">
                        Informasi Pasien
                      </p>
                      <h3 className="text-xl font-black text-slate-900 leading-tight">
                        {result.nama_pasien}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-tighter">
                          {result.no_reg}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {result.pemeriksaan?.map((item, i) => (
                      <motion.span
                        variants={itemVar}
                        key={i}
                        className="px-3 py-1.5 bg-cyan-50/50 border border-cyan-100 rounded-xl text-[10px] font-extrabold text-cyan-700 shadow-sm"
                      >
                        {typeof item === "string"
                          ? item
                          : item?.nama_pemeriksaan}
                      </motion.span>
                    ))}
                  </div>
                </div>

                {/* Menggunakan Sub-Component yang sudah dipisah */}
                <TrackingSteps
                  activeIndex={getActiveIndex(result.status)}
                  asalSampel={result.asal_sampel}
                />

                <AnimatePresence>
                  {result.status === "selesai" && (
                    <motion.div
                      key="download-btn"
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 50, opacity: 0 }}
                      className="p-6 bg-emerald-50 border-t border-emerald-100 flex flex-col gap-3"
                    >
                      {allowDownload ? (
                        <button
                          onClick={handleDownloadLHU}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-lg shadow-emerald-200 transition-all hover:scale-[1.02] active:scale-95"
                        >
                          <Download size={20} /> UNDUH HASIL LAB (PDF)
                        </button>
                      ) : (
                        <div className="bg-red-50 text-orange-600 p-4 rounded-xl text-center text-[13px] font-bold border border-red-100 flex items-center justify-center gap-2">
                          <AlertCircle size={18} />
                          Fitur unduhan daring dinonaktifkan Admin.
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : hasSearched && !loading ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white p-10 rounded-[2.5rem] border border-slate-200 text-center shadow-2xl shadow-red-100"
              >
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle size={32} />
                </div>
                <h3 className="font-black text-slate-800 text-lg">
                  Data Tidak Ditemukan
                </h3>
                <p className="text-sm text-slate-500 mt-2 font-medium leading-relaxed">
                  No. Registrasi{" "}
                  <span className="font-bold text-slate-800">
                    "{form.no_reg}"
                  </span>{" "}
                  tidak cocok dengan NIK yang dimasukkan.
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      {result && result.status === "selesai" && (
        <div
          id="print-section"
          className="hidden print:block absolute top-0 left-0 w-full min-h-screen bg-white z-[9999]"
        >
          <LHUPrintTemplate data={result} />
        </div>
      )}
    </>
  );
}
