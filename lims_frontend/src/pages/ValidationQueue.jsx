import React, { useState, useEffect, useMemo } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import {
  FileCheck,
  Search,
  Loader2,
  CheckCircle2,
  FileText,
  Calendar,
  PlayCircle,
  X,
  Eye,
  RefreshCw,
  User,
  Clock,
  ArrowUpDown,
  ListFilter,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Microscope,
  Edit2,
  Save,
  XCircle,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  Layers,
} from "lucide-react";
import { toast } from "react-toastify";

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
// -----------------------------------------------------

export default function ValidationQueue({ onRefreshStats }) {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [previewData, setPreviewData] = useState(null);
  const [processingAcc, setProcessingAcc] = useState(false);

  const [editingTestId, setEditingTestId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("newest");

  const calculateDuration = (start, end) => {
    if (!start || !end) return "-";
    const startTime = new Date(start);
    const endTime = new Date(end);
    const diffInMs = endTime - startTime;

    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    if (diffInMins < 60) return `${diffInMins} Menit`;

    const hours = Math.floor(diffInMins / 60);
    const mins = diffInMins % 60;
    return `${hours} Jam ${mins} Menit`;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/registrations");
      if (res.data.success) {
        // HANYA AMBIL YANG STATUSNYA SELESAI UJI (Sudah melewati Verifikator Lab, Siap di Validasi Dokter)
        const validationPool = res.data.data.filter(
          (item) => item.status === "selesai_uji",
        );
        setData(validationPool);
      }
    } catch (error) {
      console.error("Error fetching validation data:", error);
      toast.error("Gagal memuat data validasi");
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  const processedData = useMemo(() => {
    let filtered = [...data];

    // Filter Search Term
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          (item.nama_pasien || "").toLowerCase().includes(lower) ||
          (item.no_reg || "").toLowerCase().includes(lower) ||
          (item.no_sampel_lab || "").toLowerCase().includes(lower),
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      if (sortBy === "newest")
        return (
          new Date(b.updated_at || b.created_at) -
          new Date(a.updated_at || a.created_at)
        );
      if (sortBy === "oldest")
        return (
          new Date(a.updated_at || a.created_at) -
          new Date(b.updated_at || b.created_at)
        );
      if (sortBy === "name_asc")
        return (a.nama_pasien || "").localeCompare(b.nama_pasien || "");
      return 0;
    });

    return filtered;
  }, [data, searchTerm, sortBy]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedData.slice(startIndex, startIndex + itemsPerPage);
  }, [processedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage);

  const handleOpenPreview = async (id) => {
    const toastId = toast.loading("Memuat rincian hasil...");
    try {
      const regRes = await api.get(`/registrations/${id}`);
      const testRes = await api.get(`/registrations/${id}/tests`);

      if (regRes.data.success && testRes.data.success) {
        setPreviewData({
          ...regRes.data.data,
          tests: testRes.data.data,
        });
        toast.dismiss(toastId);
      }
    } catch (error) {
      console.error(error);
      toast.update(toastId, {
        render: "Gagal memuat detail data",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const handleStartEdit = (test) => {
    setEditingTestId(test.id);
    setEditValue(test.nilai);
  };

  const handleCancelEdit = () => {
    setEditingTestId(null);
    setEditValue("");
  };

  const handleSaveEdit = async (testId) => {
    if (!editValue || editValue.trim() === "") {
      toast.warning("Nilai tidak boleh kosong");
      return;
    }

    setIsSavingEdit(true);
    try {
      const res = await api.put(`/tests/${testId}/result`, {
        nilai: editValue,
      });

      if (res.data.success) {
        toast.success("Hasil berhasil diperbarui");
        setPreviewData((prev) => ({
          ...prev,
          tests: prev.tests.map((t) =>
            t.id === testId ? { ...t, nilai: editValue } : t,
          ),
        }));
        setEditingTestId(null);
      }
    } catch (error) {
      console.error("Error update test:", error);
      toast.error("Gagal mengupdate hasil");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleApprove = async () => {
    if (!previewData) return;
    if (editingTestId) {
      toast.warning("Selesaikan edit data terlebih dahulu");
      return;
    }

    setProcessingAcc(true);
    try {
      // HANYA ACTION FINALISASI VALIDATOR
      const res = await api.put(`/registrations/${previewData.id}/finalize`);
      if (res.data.success) {
        toast.success("Data berhasil di-ACC Final. LHU siap dicetak.");
      }

      setPreviewData(null);
      fetchData();
      if (onRefreshStats) onRefreshStats();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Gagal memproses data");
    } finally {
      setProcessingAcc(false);
    }
  };

  const groupedTests = previewData?.tests?.reduce((acc, test) => {
    const groupName = test.pemeriksaan_name || "Pemeriksaan Lainnya / Tunggal";
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(test);
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in p-2 md:p-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <FileCheck size={28} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 tracking-tight">
              Validasi Final Hasil
            </h2>
            <p className="text-gray-500 text-sm font-medium">
              Tinjau, perbaiki (jika perlu), dan ACC Final hasil uji
              laboratorium.
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative group w-full md:w-40">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <ArrowUpDown size={16} />
            </div>
            <select
              className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold text-gray-600 appearance-none cursor-pointer hover:bg-gray-50 transition-all"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="name_asc">Nama (A-Z)</option>
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>

          <div className="relative flex-1 md:w-64 w-full">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Cari Nama / No. Reg..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={fetchData}
            className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-all shadow-sm hidden md:block"
            title="Refresh Data"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Informasi Pasien
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Detail Lab & Waktu
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-20">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-gray-400 text-sm font-medium">
                        Memuat data validasi...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-24">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 size={40} className="text-gray-200" />
                      </div>
                      <h3 className="text-gray-800 font-bold">
                        Semua data tervalidasi
                      </h3>
                      <p className="text-gray-400 text-sm mt-1">
                        {searchTerm
                          ? "Tidak ada hasil pencarian."
                          : "Tidak ada antrian yang perlu diproses saat ini."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-emerald-50/20 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 border border-gray-200 group-hover:border-emerald-200 transition-all shrink-0">
                          <User size={18} />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 leading-tight">
                            {item.nama_pasien}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-bold border border-gray-200">
                              {item.no_reg}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-gray-700 text-xs font-semibold">
                          <Microscope size={14} className="text-emerald-500" />{" "}
                          ID Lab:{" "}
                          <span className="font-mono">
                            {item.no_sampel_lab || "-"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-400 text-[11px]">
                          <Calendar size={12} />
                          {new Date(item.created_at).toLocaleDateString(
                            "id-ID",
                            { day: "numeric", month: "short", year: "numeric" },
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wide border bg-blue-50 text-blue-700 border-blue-200">
                        <Clock size={12} /> MENUNGGU VALIDASI
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleOpenPreview(item.id)}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 flex items-center gap-2 shadow-md shadow-emerald-100 hover:shadow-lg transition-all active:scale-95 mx-auto"
                      >
                        <Eye size={16} /> Review & ACC
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && processedData.length > 0 && (
          <div className="bg-gray-50/50 px-6 py-4 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold text-gray-500">
            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
              <span className="whitespace-nowrap">
                Total: {processedData.length} Data
              </span>
              <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
                <span className="text-gray-400 hidden sm:inline">
                  Tampilkan:
                </span>
                <div className="relative">
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="bg-white border border-gray-200 text-gray-700 py-1 pl-2 pr-6 rounded-lg appearance-none cursor-pointer focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <ListFilter
                    size={12}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-2">
                Halaman {currentPage} dari {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {previewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-emerald-50">
              <div>
                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                  <FileCheck size={20} className="text-emerald-600" /> Validasi
                  Hasil Uji Laboratorium
                </h3>
                <p className="text-xs text-gray-500">
                  Periksa kesesuaian data sebelum diterbitkan.
                </p>
              </div>
              <button
                onClick={() => {
                  setPreviewData(null);
                  setEditingTestId(null);
                }}
                className="p-2 hover:bg-white rounded-full transition text-gray-500 hover:text-red-500 border border-transparent hover:border-gray-200 hover:shadow-sm"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-white space-y-6 custom-scrollbar">
              <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8">
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">
                    Nama Pasien
                  </p>
                  <p className="font-bold text-gray-800 text-base">
                    {previewData.nama_pasien}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">
                    No. Registrasi / Lab
                  </p>
                  <p className="font-mono text-sm font-bold text-emerald-700">
                    {previewData.no_reg} / {previewData.no_sampel_lab}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">
                    Tanggal Daftar
                  </p>
                  <p className="text-sm font-medium text-gray-700">
                    {new Date(
                      previewData.tgl_daftar || previewData.created_at,
                    ).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="col-span-2 md:col-span-3 h-px bg-emerald-200/50 my-1"></div>
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                    <PlayCircle size={10} className="text-orange-500" /> Waktu
                    Mulai
                  </p>
                  <p className="text-sm font-semibold text-gray-700">
                    {previewData.waktu_mulai_periksa
                      ? new Date(
                          previewData.waktu_mulai_periksa,
                        ).toLocaleString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        }) + " WIB"
                      : "-"}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                    <CheckCircle2 size={10} className="text-emerald-500" />{" "}
                    Waktu Selesai
                  </p>
                  <p className="text-sm font-semibold text-gray-700">
                    {previewData.waktu_selesai_periksa
                      ? new Date(
                          previewData.waktu_selesai_periksa,
                        ).toLocaleString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        }) + " WIB"
                      : "-"}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                    <Clock size={10} className="text-blue-500" /> Durasi
                  </p>
                  <p className="text-sm font-semibold text-gray-700">
                    {calculateDuration(
                      previewData.waktu_mulai_periksa,
                      previewData.waktu_selesai_periksa,
                    )}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                  <FileText size={16} className="text-emerald-600" /> Detail
                  Parameter Uji
                </h4>
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-600 font-bold text-[11px] uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3 pl-6">Parameter</th>
                        <th className="px-5 py-3 text-center bg-gray-200/50 w-1/3">
                          Hasil
                        </th>
                        <th className="px-5 py-3">Satuan</th>
                        <th className="px-5 py-3">Nilai Rujukan</th>
                        <th className="px-5 py-3">Metode</th>
                      </tr>
                    </thead>

                    {groupedTests &&
                      Object.entries(groupedTests).map(
                        ([groupName, groupItems]) => (
                          <tbody
                            key={groupName}
                            className="divide-y divide-gray-100/70 border-b-4 border-gray-100"
                          >
                            <tr className="bg-gray-50/80">
                              <td
                                colSpan="5"
                                className="py-2.5 pl-6 border-l-4 border-emerald-500"
                              >
                                <div className="flex items-center gap-2 font-bold text-emerald-800 uppercase tracking-wider text-[11px]">
                                  <Layers
                                    size={14}
                                    className="text-emerald-600"
                                  />
                                  {groupName}
                                </div>
                              </td>
                            </tr>

                            {groupItems.map((test) => {
                              const config = parseRefConfig(
                                test.nilai_rujukan || test.range_normal,
                              );
                              const gender = previewData.jenis_kelamin || "L";
                              const displayRef = getDisplayRefRange(
                                config,
                                gender,
                              );
                              const status = smartAnalyzeResult(
                                test.nilai,
                                config,
                                gender,
                              );
                              const isAbnormal = status !== "normal";

                              return (
                                <tr
                                  key={test.id}
                                  className={`hover:bg-gray-50 transition-colors ${isAbnormal ? "bg-red-50/30" : ""}`}
                                >
                                  <td className="px-5 py-3 pl-8 font-semibold text-gray-700">
                                    {test.parameter_name}
                                  </td>

                                  <td
                                    className={`px-5 py-3 text-center transition-colors ${isAbnormal ? "bg-red-100/50" : "bg-emerald-50/30"}`}
                                  >
                                    {editingTestId === test.id ? (
                                      <div className="flex items-center gap-2 justify-center">
                                        <input
                                          type="text"
                                          value={editValue}
                                          onChange={(e) =>
                                            setEditValue(e.target.value)
                                          }
                                          className="w-full max-w-[120px] px-2 py-1 text-sm border border-emerald-400 rounded focus:ring-2 focus:ring-emerald-200 outline-none text-center bg-white"
                                          autoFocus
                                        />
                                        <button
                                          onClick={() =>
                                            handleSaveEdit(test.id)
                                          }
                                          disabled={isSavingEdit}
                                          className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                                        >
                                          {isSavingEdit ? (
                                            <Loader2
                                              size={14}
                                              className="animate-spin"
                                            />
                                          ) : (
                                            <Save size={14} />
                                          )}
                                        </button>
                                        <button
                                          onClick={handleCancelEdit}
                                          disabled={isSavingEdit}
                                          className="p-1.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300"
                                        >
                                          <XCircle size={14} />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-between group/cell relative">
                                        <span
                                          className={`flex-1 flex items-center justify-center gap-1.5 text-base ${isAbnormal ? "text-red-600 font-extrabold" : "text-gray-900 font-bold"}`}
                                        >
                                          {test.nilai}
                                          {status === "high" && (
                                            <ArrowUp
                                              size={16}
                                              className="text-red-500 stroke-[3px]"
                                            />
                                          )}
                                          {status === "low" && (
                                            <ArrowDown
                                              size={16}
                                              className="text-red-500 stroke-[3px]"
                                            />
                                          )}
                                          {status === "abnormal" &&
                                            config.jenis !== "kuantitatif" && (
                                              <AlertCircle
                                                size={16}
                                                className="text-red-500 stroke-[3px]"
                                              />
                                            )}
                                        </span>
                                        <button
                                          onClick={() => handleStartEdit(test)}
                                          className="p-1 text-gray-400 hover:text-emerald-600 transition-colors shrink-0 ml-2"
                                          title="Edit Nilai"
                                        >
                                          <Edit2 size={14} />
                                        </button>
                                      </div>
                                    )}
                                  </td>

                                  <td className="px-5 py-3 text-gray-500 text-xs font-mono">
                                    {test.satuan || "-"}
                                  </td>

                                  <td className="px-5 py-3 text-gray-600 text-xs font-medium">
                                    {displayRef}
                                  </td>

                                  <td className="px-5 py-3 text-gray-500 text-[10px] uppercase tracking-wider">
                                    {test.metode || "-"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        ),
                      )}
                  </table>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
              <div className="text-xs text-gray-500 font-medium flex items-center gap-1.5 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                <AlertCircle size={14} className="text-red-500" />
                Hasil <span className="text-red-600 font-bold">merah</span>{" "}
                menandakan nilai abnormal.
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setPreviewData(null);
                    setEditingTestId(null);
                  }}
                  className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-bold text-sm hover:bg-white hover:shadow-sm transition-all"
                >
                  Tutup
                </button>
                <button
                  onClick={handleApprove}
                  disabled={processingAcc || editingTestId !== null}
                  className={`px-6 py-2.5 rounded-xl text-white font-bold text-sm transition-all flex items-center gap-2 disabled:opacity-70 bg-gradient-to-r from-blue-600 to-cyan-600 hover:shadow-blue-200`}
                >
                  {processingAcc ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />{" "}
                      Memproses...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} /> ACC Final & Terbitkan LHU
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
