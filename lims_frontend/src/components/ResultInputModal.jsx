import React, { useState, useEffect } from "react";
import api from "../api/axios";
import { toast } from "react-toastify";
import {
  X,
  Save,
  TestTube2,
  Loader2,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Layers,
  Droplets,
} from "lucide-react";
import {
  parseRefConfig,
  getDisplayRefRange,
  smartAnalyzeResult,
} from "../utils/testAnalyzer.js";
import TestResultRow from "./TestResultRow";
// ------------------------------------

export default function ResultInputModal({
  registrationId,
  noSampel,
  initialSpesimen,
  initialKondisiSampel,
  onClose,
}) {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [jenisSpesimen, setJenisSpesimen] = useState(initialSpesimen || "");
  const [kondisiSampel, setKondisiSampel] = useState(
    initialKondisiSampel || "",
  );

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await api.get(`/registrations/${registrationId}/tests`);
        if (res.data.success) {
          setTests(res.data.data);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchTests();
  }, [registrationId]);

  const handleInputChange = (testId, value) => {
    const strValue = typeof value === "string" ? value : String(value);
    setTests((prev) =>
      prev.map((t) => (t.id === testId ? { ...t, nilai: strValue } : t)),
    );
  };

  const handleSaveAll = async () => {
    const isConfirmed = window.confirm(
      `Apakah Anda yakin ingin menyimpan ${tests.length} hasil tes ini? \n\nPastikan data sudah benar karena akan diverifikasi.`,
    );
    if (!isConfirmed) return;

    try {
      setSaving(true);
      await api.put(`/registrations/${registrationId}/spesimen`, {
        jenis_spesimen: jenisSpesimen,
        kondisi_sampel: kondisiSampel,
      });

      const savePromises = tests.map((test) => {
        return api.put(`/tests/${test.id}/result`, { nilai: test.nilai || "" });
      });

      await Promise.all(savePromises);
      setTests((prev) => prev.map((t) => ({ ...t, status: "completed" })));
      toast.success("Semua hasil berhasil disimpan & disinkronisasi!");
      onClose();
    } catch (e) {
      console.error("Error batch saving:", e);
      toast.error("Gagal menyimpan beberapa data. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const groupedTests = tests.reduce((acc, test) => {
    const groupName = test.pemeriksaan_name || "Pemeriksaan Lainnya / Tunggal";
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(test);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* --- HEADER --- */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-cyan-50">
          <h3 className="font-bold text-lg text-cyan-800 flex items-center gap-2">
            <TestTube2 size={20} /> Input Hasil Lab: {noSampel}
          </h3>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* --- SPESIMEN & KONDISI SAMPEL INPUT --- */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          {/* Jenis Spesimen */}
          <div>
            <label className="block text-[11px] uppercase font-bold text-gray-500 mb-1.5 flex items-center gap-1">
              <Droplets size={12} className="text-cyan-600" /> Jenis Spesimen /
              Sampel <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={jenisSpesimen}
              onChange={(e) => setJenisSpesimen(e.target.value)}
              placeholder="Contoh: Darah EDTA, Serum, Swab..."
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500 font-semibold text-gray-700 bg-white shadow-sm"
              disabled={saving}
              required
            />
          </div>

          {/* Kondisi Sampel (Baru) */}
          <div>
            <label className="block text-[11px] uppercase font-bold text-gray-500 mb-1.5 flex items-center gap-1">
              <AlertCircle size={12} className="text-cyan-600" /> Kondisi Sampel{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={kondisiSampel}
              onChange={(e) => setKondisiSampel(e.target.value)}
              placeholder="Contoh: Baik ..."
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500 font-semibold text-gray-700 bg-white shadow-sm"
              disabled={saving}
              required
            />
          </div>
        </div>

        {/* --- TABLE CONTENT --- */}
        <div className="p-0 overflow-y-auto flex-1 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="animate-spin text-cyan-600 mb-4" size={32} />
              <p className="text-gray-500">Memuat data tes...</p>
            </div>
          ) : tests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Tidak ada data tes ditemukan
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white z-10 shadow-sm">
                <tr className="text-left text-gray-500 border-b-2 border-cyan-100">
                  <th className="pb-3 pt-4 pl-6 font-bold">Parameter Uji</th>
                  <th className="pb-3 pt-4 text-center font-bold">Metode</th>
                  <th className="pb-3 pt-4 font-bold">Nilai Rujukan</th>
                  <th className="pb-3 pt-4 w-64 text-center font-bold">
                    Hasil Uji
                  </th>
                  <th className="pb-3 pt-4 text-center w-24 font-bold">
                    Satuan
                  </th>
                  <th className="pb-3 pt-4 text-center font-bold pr-6">
                    Status
                  </th>
                </tr>
              </thead>

              {Object.entries(groupedTests).map(([groupName, groupItems]) => (
                <tbody
                  key={groupName}
                  className="divide-y divide-gray-100/70 border-b-4 border-gray-100"
                >
                  <tr className="bg-gray-50/80">
                    <td
                      colSpan="6"
                      className="py-2.5 pl-6 border-l-4 border-cyan-500"
                    >
                      <div className="flex items-center gap-2 font-bold text-cyan-800 uppercase tracking-wider text-[11px]">
                        <Layers size={14} className="text-cyan-600" />
                        {groupName}
                      </div>
                    </td>
                  </tr>

                  {/* KINI RENDER BARIS JAUH LEBIH BERSIH */}
                  {groupItems.map((test) => (
                    <TestResultRow
                      key={test.id}
                      test={test}
                      saving={saving}
                      onInputChange={handleInputChange}
                    />
                  ))}
                </tbody>
              ))}
            </table>
          )}
        </div>

        {/* --- FOOTER --- */}
        <div className="p-5 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
          <div className="text-xs text-gray-600 font-medium flex items-center gap-1.5 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
            <AlertCircle size={14} className="text-red-500" />
            Hasil di luar rujukan akan ditandai{" "}
            <span className="text-red-600 font-bold">merah</span> otomatis.
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 text-gray-600 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl font-bold transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={handleSaveAll}
              disabled={saving || loading || tests.length === 0}
              className="bg-cyan-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-cyan-700 shadow-md shadow-cyan-600/20 hover:shadow-cyan-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> Menyimpan...
                </>
              ) : (
                <>
                  <Save size={18} /> Simpan Semua
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
