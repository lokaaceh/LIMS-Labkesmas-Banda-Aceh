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

// --- ROBUST SMART PARSER (V2 - Dynamic Multi-Category Support) ---
export const parseRefConfig = (rujukanString) => {
  try {
    if (!rujukanString) return { jenis: "teks", teks_bebas: "-" };

    let minified;
    if (typeof rujukanString === "string") {
      if (!rujukanString.trim().startsWith("{")) {
        return { jenis: "teks", teks_bebas: rujukanString };
      }
      try {
        minified = JSON.parse(rujukanString);
      } catch (e) {
        return { jenis: "teks", teks_bebas: "Format terpotong / Data Lama" };
      }
    } else {
      minified = rujukanString;
    }

    if (minified.jenis) return minified; // Format Unminified

    if (minified.j === "kan") {
      const parsed = {
        jenis: "kuantitatif",
        is_multi: minified.m || minified.bg || false, // Backward compat .bg
        kuantitatif: {
          umum: minified.u || { min: "", max: "" },
          custom_refs: [],
        },
      };

      // MIGRATION DARI DATA LAMA (L/P) KE DYNAMIC REFS
      if (minified.bg !== undefined) {
        if (minified.L)
          parsed.kuantitatif.custom_refs.push({
            label: "Laki-laki",
            min: minified.L.min,
            max: minified.L.max,
          });
        if (minified.P)
          parsed.kuantitatif.custom_refs.push({
            label: "Perempuan",
            min: minified.P.min,
            max: minified.P.max,
          });
      } else if (minified.r && Array.isArray(minified.r)) {
        // Data Baru
        parsed.kuantitatif.custom_refs = minified.r.map((ref) => ({
          label: ref.l,
          min: ref.mn,
          max: ref.mx,
        }));
      }
      return parsed;
    } else if (minified.j === "kal") {
      return {
        jenis: "kualitatif",
        kualitatif: {
          opsi: minified.o || "Negatif, Positif",
          normal: minified.n || "Negatif",
        },
      };
    } else if (minified.j === "txt") {
      return { jenis: "teks", teks_bebas: minified.v || "-" };
    }

    return { jenis: "teks", teks_bebas: "-" };
  } catch {
    return { jenis: "teks", teks_bebas: "Format tidak valid" };
  }
};

export const getDisplayRefRange = (config, gender) => {
  if (!config) return "-";
  if (config.jenis === "teks") return config.teks_bebas || "-";
  if (config.jenis === "kualitatif")
    return `Normal: ${config.kualitatif?.normal || "-"}`;

  if (config.jenis === "kuantitatif") {
    if (config.is_multi && config.kuantitatif?.custom_refs?.length > 0) {
      // Jika multi, gabungkan semua untuk display tabel (Contoh: "Dewasa: 1-2, Anak: 0.5-1")
      return config.kuantitatif.custom_refs
        .map((ref) => `${ref.label}: ${ref.min}-${ref.max}`)
        .join(" | ");
    }

    const target = config.kuantitatif?.umum;
    if (target && target.min !== "" && target.max !== "") {
      return `${target.min} - ${target.max}`;
    }
  }
  return "-";
};

export const smartAnalyzeResult = (nilai, config, gender) => {
  if (!nilai || nilai.toString().trim() === "") return "normal";

  if (config.jenis === "kualitatif") {
    const valStr = String(nilai).trim().toLowerCase();
    const expected = String(config.kualitatif?.normal || "")
      .trim()
      .toLowerCase();
    return valStr !== expected ? "abnormal" : "normal";
  }

  if (config.jenis === "kuantitatif") {
    const valNum = parseFloat(String(nilai).replace(/,/g, "."));
    if (isNaN(valNum)) return "normal";

    let target = config.kuantitatif?.umum;

    // Heuristic Matching: Coba cari rujukan berdasarkan gender pasien jika formatnya multi
    if (config.is_multi && config.kuantitatif?.custom_refs) {
      const refs = config.kuantitatif.custom_refs;
      const mappedRef = refs.find((r) => {
        const lbl = (r.label || "").toLowerCase();
        if (
          gender === "L" &&
          (lbl.includes("laki") || lbl.includes("pria") || lbl === "l")
        )
          return true;
        if (
          gender === "P" &&
          (lbl.includes("perem") || lbl.includes("wanita") || lbl === "p")
        )
          return true;
        return false;
      });
      if (mappedRef) target = mappedRef;
      // NOTE: Jika kategori sangat spesifik (Cth: "Anak 5 Tahun") maka auto-flag di-skip
      // Analis lab harus mem-validasi manual. Ini standar keselamatan medis.
    }

    if (target && target.min !== "" && target.max !== "") {
      if (valNum < parseFloat(target.min)) return "low";
      if (valNum > parseFloat(target.max)) return "high";
    }
  }

  // Logika evaluasi Teks Bebas (Sama seperti yang lama) ...
  if (config.jenis === "teks" && config.teks_bebas) {
    // ... (Pertahankan kode pengecekan < dan > eksisting Anda disini) ...
  }
  return "normal";
};

// ------------------------------------

export default function ResultInputModal({
  registrationId,
  noSampel,
  initialSpesimen,
  onClose,
}) {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [jenisSpesimen, setJenisSpesimen] = useState(initialSpesimen || "");

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await api.get(`/registrations/${registrationId}/tests`);
        if (res.data.success) {
          setTests(res.data.data);
        }
      } catch (e) {
        console.error("Error fetching tests:", e);
        if (e.response?.status === 403) {
          toast.error("Akses ditolak. Pastikan Anda memiliki role lab.");
        } else {
          toast.error("Gagal memuat data tes");
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
    // BLOK VALIDASI JENIS SPESIMEN WAJIB DIISI
    if (!jenisSpesimen || jenisSpesimen.trim() === "") {
      toast.warn("Jenis Spesimen / Sampel wajib diisi!");
      return;
    }
    // BLOK VALIDASI CEK ADA TIDAK TES YANG NILAINYA KOSONG
    const emptyTests = tests.filter(
      (t) => !t.nilai || t.nilai.toString().trim() === "",
    );

    if (emptyTests.length > 0) {
      const missingParams = emptyTests.map((t) => t.parameter_name).join(", ");
      toast.warn(`Harap lengkapi nilai untuk: ${missingParams}`);
      return;
    }

    const isConfirmed = window.confirm(
      `Apakah Anda yakin ingin menyimpan ${tests.length} hasil tes ini? \n\nPastikan data sudah benar karena akan diverifikasi.`,
    );
    if (!isConfirmed) return;

    try {
      setSaving(true);

      // 1. SIMPAN DULU JENIS SPESIMENNYA KE BACKEND
      await api.put(`/registrations/${registrationId}/spesimen`, {
        jenis_spesimen: jenisSpesimen,
      });

      // 2. KEMUDIAN SIMPAN HASIL TESNYA
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
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="w-full md:w-1/3">
            <label className="block text-[11px] uppercase font-bold text-gray-500 mb-1.5 items-center gap-1">
              <Droplets size={12} className="text-cyan-600" /> Jenis Spesimen /
              Sampel
            </label>
            <input
              type="text"
              value={jenisSpesimen}
              onChange={(e) => setJenisSpesimen(e.target.value)}
              placeholder="Contoh: Darah EDTA, Serum, Swab..."
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500 font-semibold text-gray-700 bg-white shadow-sm"
              disabled={saving}
            />
          </div>
          <div className="text-xs text-gray-400 mt-4 md:mt-0 italic">
            * Wajib diisi agar tercetak dengan benar pada Laporan Hasil Uji
            (LHU).
          </div>
        </div>
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

                  {groupItems.map((test) => {
                    const config = parseRefConfig(
                      test.nilai_rujukan || test.range_normal,
                    );
                    const gender = test.jenis_kelamin || "L";
                    const displayRef = getDisplayRefRange(config, gender);
                    const status = smartAnalyzeResult(
                      test.nilai,
                      config,
                      gender,
                    );
                    const isAbnormal = status !== "normal" && test.nilai;

                    const inputClass = `w-full border rounded-lg px-3 py-2 outline-none transition-all font-medium ${
                      isAbnormal
                        ? "border-red-400 bg-red-50 text-red-700 focus:ring-2 focus:ring-red-500 shadow-sm"
                        : "border-gray-300 bg-white focus:ring-2 focus:ring-cyan-500"
                    }`;

                    return (
                      <tr
                        key={test.id}
                        className={`hover:bg-cyan-50/30 transition-colors ${isAbnormal ? "bg-red-50/20" : ""}`}
                      >
                        <td className="py-3 pl-8 font-semibold text-gray-700">
                          {test.parameter_name}
                          {config.beda_gender && (
                            <span className="block text-[10px] text-gray-400 mt-0.5">
                              *Nilai rujukan{" "}
                              {gender === "L" ? "Pria" : "Wanita"}
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-gray-500 text-[10px] text-center uppercase tracking-wider">
                          {test.metode || "-"}
                        </td>
                        <td className="py-3 text-gray-600 text-xs font-medium">
                          {displayRef}
                        </td>
                        <td className="py-3 relative px-4">
                          {config.jenis === "kualitatif" ? (
                            <select
                              className={inputClass}
                              value={test.nilai || ""}
                              onChange={(e) =>
                                handleInputChange(test.id, e.target.value)
                              }
                              disabled={saving}
                            >
                              <option value="" disabled>
                                -- Pilih Hasil --
                              </option>
                              {config.kualitatif.opsi.split(",").map((opt) => (
                                <option key={opt.trim()} value={opt.trim()}>
                                  {opt.trim()}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="relative">
                              <input
                                type={
                                  config.jenis === "kuantitatif"
                                    ? "number"
                                    : "text"
                                }
                                step="any"
                                className={`${inputClass} pr-8`}
                                value={test.nilai || ""}
                                onChange={(e) =>
                                  handleInputChange(test.id, e.target.value)
                                }
                                placeholder="Input hasil..."
                                disabled={saving}
                              />
                              {status === "high" && (
                                <ArrowUp
                                  size={16}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600 font-bold"
                                />
                              )}
                              {status === "low" && (
                                <ArrowDown
                                  size={16}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600 font-bold"
                                />
                              )}
                              {status === "abnormal" &&
                                config.jenis !== "kuantitatif" && (
                                  <AlertCircle
                                    size={16}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600"
                                  />
                                )}
                            </div>
                          )}
                        </td>
                        <td className="py-3 text-gray-500 text-center text-xs font-mono">
                          {test.satuan || "-"}
                        </td>
                        <td className="py-3 text-center pr-6">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${test.status === "completed" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-gray-100 text-gray-500 border border-gray-200"}`}
                          >
                            {test.status === "completed" ? "Selesai" : "Draft"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              ))}
            </table>
          )}
        </div>

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
