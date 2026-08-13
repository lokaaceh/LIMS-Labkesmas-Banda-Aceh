// src/pages/LabQueue.jsx

import React, { useState, useEffect, useMemo, useCallback } from "react";
import api from "../api/axios";
import { toast } from "react-toastify";
import ResultInputModal from "../components/ResultInputModal";
import { useAuth } from "../context/AuthContext";

import {
  FlaskConical,
  Clock,
  CheckCircle2,
  PlayCircle,
  Package,
  FileEdit,
  AlertCircle,
  Search,
  RefreshCw,
  ArrowUpDown,
  ListFilter,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Eye,
  X,
  Droplets,
  Bug,
  Beef,
  Microscope,
  Building2,
  CheckSquare,
  ClipboardList,
  ArrowUp,
  ArrowDown,
  Layers,
  Loader2,
  ShieldCheck,
  Lock,
  Edit2,
  Save,
  XCircle,
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
// -----------------------------------------------------

export default function LabQueue({ onRefreshStats }) {
  const { user } = useAuth();

  // UX STATE: Pemisah mode kerja lab sebagai UI/UX, BUKAN database role
  const [labMode, setLabMode] = useState(() => {
    return localStorage.getItem("preferredLabMode") || "input";
  });

  // FIX BUG: inisiasi tab dari "queue" menjadi "waiting" agar antrian langsung terbuka
  const [activeTab, setActiveTab] = useState(
    labMode === "verifikator" ? "verify" : "waiting",
  );

  useEffect(() => {
    localStorage.setItem("preferredLabMode", labMode);
    // Auto pindah tab mengikuti workspace mode
    if (labMode === "input" && activeTab === "verify") {
      setActiveTab("waiting");
    } else if (labMode === "verifikator" && activeTab !== "verify") {
      setActiveTab("verify");
    }
  }, [labMode]);

  const [selectedInstalasi, setSelectedInstalasi] = useState("ALL");
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSample, setSelectedSample] = useState(null);

  const [masterMap, setMasterMap] = useState({});
  const [instalasiList, setInstalasiList] = useState([]);

  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("newest");

  const [detailPemeriksaan, setDetailPemeriksaan] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [processingVerify, setProcessingVerify] = useState(false);

  const [editingTestId, setEditingTestId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

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

  useEffect(() => {
    if (["lab"].includes(user?.role) && user?.instalasi_id) {
      setSelectedInstalasi(user.instalasi_id);
    } else {
      setSelectedInstalasi("ALL");
    }
  }, [user]);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const [queueRes, masterRes, instalasiRes] = await Promise.all([
        api.get("/registrations/lab-queue"),
        api.get("/master/pemeriksaan"),
        api.get("/master/instalasi"),
      ]);

      if (instalasiRes.data.success) setInstalasiList(instalasiRes.data.data);

      if (masterRes.data.success) {
        const map = {};
        masterRes.data.data.forEach((item) => {
          map[item.nama_pemeriksaan.toLowerCase().trim()] = {
            id: item.instalasi_id,
            name: item.nama_instalasi || "UMUM",
          };
        });
        setMasterMap(map);
      }

      if (queueRes.data.success) setQueue(queueRes.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat data ruang laboratorium");
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, itemsPerPage, selectedInstalasi]);

  const getInstalasiForRegistration = (jenisPemeriksaanString) => {
    if (!jenisPemeriksaanString) return [];
    const examNames = jenisPemeriksaanString.split(",").map((str) =>
      str
        .replace(/\s*\(\d+\)$/, "")
        .trim()
        .toLowerCase(),
    );
    const instIds = new Set();
    examNames.forEach((name) => {
      const inst = masterMap[name];
      instIds.add(inst?.id ? inst.id : "UMUM");
    });
    return Array.from(instIds);
  };

  const renderSampleBadges = (jenisPemeriksaanString) => {
    if (!jenisPemeriksaanString) return null;
    const examNames = jenisPemeriksaanString.split(",").map((str) =>
      str
        .trim()
        .replace(/\s*\(\d+\)$/, "")
        .toLowerCase(),
    );
    const detectedInstalasi = new Set();

    examNames.forEach((name) => {
      const inst = masterMap[name];
      if (inst?.name) detectedInstalasi.add(inst.name.toUpperCase());
    });

    if (detectedInstalasi.size === 0) {
      return (
        <span className="bg-gray-100 text-gray-700 text-[10px] px-2 py-0.5 rounded-md font-bold border border-gray-200 flex items-center gap-1 w-fit mb-1.5">
          <FlaskConical size={10} /> UMUM
        </span>
      );
    }

    return (
      <div className="flex flex-wrap gap-1 mb-1.5">
        {Array.from(detectedInstalasi).map((inst) => {
          if (
            [
              "HEMATOLOGI",
              "KIMIA KLINIK",
              "IMUNOLOGI",
              "SEROLOGI",
              "KLINIK",
            ].some((c) => inst.includes(c))
          )
            return (
              <span
                key={inst}
                className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-md font-bold border border-red-200 flex items-center gap-1"
              >
                <Droplets size={10} /> {inst}
              </span>
            );
          if (inst.includes("URIN"))
            return (
              <span
                key={inst}
                className="bg-yellow-100 text-yellow-700 text-[10px] px-2 py-0.5 rounded-md font-bold border border-yellow-200 flex items-center gap-1"
              >
                <FlaskConical size={10} /> {inst}
              </span>
            );
          if (
            ["VEKTOR", "PARASITOLOGI", "ENTOMOLOGI"].some((c) =>
              inst.includes(c),
            )
          )
            return (
              <span
                key={inst}
                className="bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-md font-bold border border-orange-200 flex items-center gap-1"
              >
                <Bug size={10} /> {inst}
              </span>
            );
          if (
            ["LINGKUNGAN", "AIR", "FISIKA", "LIMBAH"].some((c) =>
              inst.includes(c),
            )
          )
            return (
              <span
                key={inst}
                className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-md font-bold border border-blue-200 flex items-center gap-1"
              >
                <Droplets size={10} /> {inst}
              </span>
            );
          if (
            ["MAKANAN", "MINUMAN", "TOKSIKOLOGI", "KIMIA MAKANAN"].some((c) =>
              inst.includes(c),
            )
          )
            return (
              <span
                key={inst}
                className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-md font-bold border border-emerald-200 flex items-center gap-1"
              >
                <Beef size={10} /> {inst}
              </span>
            );
          if (
            ["BIOMOLEKULER", "PCR", "MIKROBIOLOGI", "BAKTERIOLOGI"].some((c) =>
              inst.includes(c),
            )
          )
            return (
              <span
                key={inst}
                className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-md font-bold border border-purple-200 flex items-center gap-1"
              >
                <Microscope size={10} /> {inst}
              </span>
            );
          return (
            <span
              key={inst}
              className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-md font-bold border border-gray-200 flex items-center gap-1"
            >
              <FlaskConical size={10} /> {inst}
            </span>
          );
        })}
      </div>
    );
  };

  const processedData = useMemo(() => {
    if (!Array.isArray(queue)) return [];
    let filtered = queue.filter((item) => {
      let matchesTab = false;
      if (activeTab === "waiting") matchesTab = item.status === "diterima_lab";
      if (activeTab === "process") matchesTab = item.status === "proses_lab";
      if (activeTab === "verify")
        matchesTab = item.status === "menunggu_verifikasi";

      let matchesInstalasi = true;
      if (selectedInstalasi !== "ALL") {
        const itemInstalasiIds = getInstalasiForRegistration(
          item.jenis_pemeriksaan,
        );
        matchesInstalasi =
          itemInstalasiIds.some(
            (id) => String(id) === String(selectedInstalasi),
          ) || String(selectedInstalasi) === String(item.instalasi_id);
      }

      const query = searchQuery.toLowerCase();
      const matchesSearch =
        (item.no_sampel_lab || "").toLowerCase().includes(query) ||
        (item.no_reg || "").toLowerCase().includes(query) ||
        (item.nama_pasien || "").toLowerCase().includes(query);

      return matchesTab && matchesInstalasi && matchesSearch;
    });

    filtered.sort((a, b) => {
      const timeA = Number.isNaN(
        new Date(a?.created_at || a?.tgl_daftar).getTime(),
      )
        ? 0
        : new Date(a?.created_at || a?.tgl_daftar).getTime();
      const timeB = Number.isNaN(
        new Date(b?.created_at || b?.tgl_daftar).getTime(),
      )
        ? 0
        : new Date(b?.created_at || b?.tgl_daftar).getTime();
      if (sortBy === "newest") return timeB - timeA;
      if (sortBy === "oldest") return timeA - timeB;
      if (sortBy === "sample_asc")
        return (a.no_sampel_lab || "").localeCompare(b.no_sampel_lab || "");
      if (sortBy === "urgent")
        return (b.catatan_tambahan ? 1 : 0) - (a.catatan_tambahan ? 1 : 0);
      return 0;
    });

    return filtered;
  }, [queue, activeTab, searchQuery, sortBy, selectedInstalasi, masterMap]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedData.slice(startIndex, startIndex + itemsPerPage);
  }, [processedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage);

  const handleStartProcess = async (id, noSampel) => {
    if (user?.role === "lab" && labMode !== "input") {
      toast.warn(
        "Akses Ditolak: Silakan beralih ke Mode Input / Analis di bagian atas untuk memulai analisis.",
        {
          icon: <Lock className="text-amber-500" />,
        },
      );
      return;
    }

    try {
      await api.put(`/registrations/${id}/start-process`);
      toast.success(`Sampel ${noSampel} mulai dianalisis`);
      fetchQueue();
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      toast.error("Gagal update status");
    }
  };

  const handleOpenInput = (item) => {
    if (user?.role === "lab" && labMode !== "input") {
      toast.warn(
        "Akses Ditolak: Silakan beralih ke Mode Input / Analis di bagian atas untuk menginput hasil.",
        {
          icon: <Lock className="text-amber-500" />,
        },
      );
      return;
    }
    setSelectedSample(item);
  };

  const handleOpenPreview = async (id) => {
    // --- UX GUARD: Cek Mode ---
    // Memaksa petugas pindah ke mode verifikator agar tidak salah konteks kerja
    if (user?.role === "lab" && labMode !== "verifikator") {
      toast.warn(
        "Akses Ditolak: Silakan beralih ke Mode Verifikator di bagian atas untuk melakukan verifikasi hasil.",
        {
          icon: <Lock className="text-amber-500" />,
        },
      );
      return;
    }
    const toastId = toast.loading("Memuat data verifikasi...");
    try {
      const regRes = await api.get(`/registrations/${id}`);
      const testRes = await api.get(`/registrations/${id}/tests`);
      if (regRes.data.success && testRes.data.success) {
        setPreviewData({ ...regRes.data.data, tests: testRes.data.data });
        toast.dismiss(toastId);
      }
    } catch (error) {
      toast.update(toastId, {
        render: "Gagal memuat detail data",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const handleVerify = async () => {
    if (!previewData) return;
    setProcessingVerify(true);
    try {
      const res = await api.put(`/registrations/${previewData.id}/verify`);
      if (res.data.success) {
        toast.success("Hasil berhasil diverifikasi!");
        setPreviewData(null);
        fetchQueue();
        if (onRefreshStats) onRefreshStats();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal memverifikasi data");
    } finally {
      setProcessingVerify(false);
    }
  };

  const getCounts = (status) => {
    if (!Array.isArray(queue)) return 0;
    return queue.filter((item) => {
      if (item.status !== status) return false;
      if (selectedInstalasi === "ALL") return true;
      const itemInstalasiIds = getInstalasiForRegistration(
        item.jenis_pemeriksaan,
      );
      return itemInstalasiIds.includes(selectedInstalasi);
    }).length;
  };

  const groupedTests = previewData?.tests?.reduce((acc, test) => {
    const groupName = test.pemeriksaan_name || "Pemeriksaan Lainnya / Tunggal";
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(test);
    return acc;
  }, {});

  const getDuration = (start, end) => {
    if (!start || !end) return "-";
    const diffMs = new Date(end) - new Date(start);
    if (diffMs <= 0) return "< 1 menit";
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    if (hours > 0) return `${hours}j ${mins}m`;
    return `${mins} menit`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in p-2 md:p-0">
      {/* --- UI TOGGLE SWITCHER (HANYA UNTUK ROLE LAB SEBAGAI UI UX WORKSPACE) --- */}
      {user?.role === "lab" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 flex flex-col md:flex-row items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-3 px-4">
            <ShieldCheck
              size={24}
              className={
                labMode === "verifikator" ? "text-emerald-500" : "text-cyan-500"
              }
            />
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Mode Kerja Saat Ini
              </p>
              <p
                className={`font-bold ${labMode === "verifikator" ? "text-emerald-700" : "text-cyan-700"}`}
              >
                {labMode === "verifikator"
                  ? "Otoritas Verifikator"
                  : "Analis / Input Hasil"}
              </p>
            </div>
          </div>

          <div className="flex bg-gray-100 p-1.5 rounded-xl w-full md:w-auto">
            <button
              onClick={() => setLabMode("input")}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${
                labMode === "input"
                  ? "bg-white text-cyan-700 shadow-md ring-1 ring-cyan-100"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <FlaskConical size={16} /> Input Lab
            </button>
            <button
              onClick={() => setLabMode("verifikator")}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${
                labMode === "verifikator"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <CheckSquare size={16} /> Verifikator
            </button>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-cyan-50 rounded-xl text-cyan-600">
            <Microscope size={28} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 tracking-tight">
              Ruang Laboratorium
            </h2>
            <p className="text-gray-500 text-sm font-medium">
              Manajemen uji sampel, input hasil, dan verifikasi lab.
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative group w-full md:w-40">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <ArrowUpDown size={16} />
            </div>
            <select
              className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none text-sm font-semibold text-gray-600 appearance-none cursor-pointer hover:bg-gray-50 transition-all"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="sample_asc">No. Sampel (A-Z)</option>
              <option value="urgent">Prioritas Catatan</option>
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>

          <div className="relative flex-1 md:w-64 w-full">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Cari No. Sampel / Reg..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none transition-all text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={fetchQueue}
            className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-all shadow-sm hidden md:block"
            title="Refresh Data"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {user?.role !== "lab" && instalasiList && instalasiList.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar -mt-2">
          <button
            onClick={() => setSelectedInstalasi("ALL")}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-all border flex items-center gap-2 ${selectedInstalasi === "ALL" ? "bg-cyan-600 border-cyan-600 text-white shadow-md" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            <Building2 size={16} /> SEMUA INSTALASI
          </button>
          {instalasiList.map((inst) => (
            <button
              key={inst.id}
              onClick={() => setSelectedInstalasi(inst.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-all border ${selectedInstalasi === inst.id ? "bg-cyan-600 border-cyan-600 text-white shadow-md" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              {inst.nama_instalasi.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* --- TABS --- */}
      <div className="flex bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
        <button
          onClick={() => setActiveTab("waiting")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "waiting" ? "bg-white text-cyan-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          <Package size={16} /> Antrian Uji
          <span
            className={`ml-1 px-2 py-0.5 rounded-md text-[10px] ${activeTab === "waiting" ? "bg-cyan-100 text-cyan-700" : "bg-gray-200"}`}
          >
            {getCounts("diterima_lab")}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("process")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "process" ? "bg-white text-yellow-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          <FlaskConical size={16} /> Sedang Diuji
          <span
            className={`ml-1 px-2 py-0.5 rounded-md text-[10px] ${activeTab === "process" ? "bg-yellow-100 text-yellow-700" : "bg-gray-200"}`}
          >
            {getCounts("proses_lab")}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("verify")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === "verify" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          <CheckSquare size={16} /> Menunggu Verifikasi
          <span
            className={`ml-1 px-2 py-0.5 rounded-md text-[10px] ${activeTab === "verify" ? "bg-emerald-100 text-emerald-700" : "bg-gray-200"}`}
          >
            {getCounts("menunggu_verifikasi")}
          </span>
        </button>
      </div>

      {/* --- MAIN TABLE CARD --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  ID Sampel (Lab)
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Waktu Daftar
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Parameter Pemeriksaan
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-20 text-center">
                    <Loader2
                      className="animate-spin text-cyan-500 mx-auto mb-2"
                      size={32}
                    />
                    <p className="text-gray-400 text-sm font-medium">
                      Menyinkronkan data lab...
                    </p>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-24 text-center">
                    <CheckCircle2
                      size={40}
                      className="text-gray-200 mx-auto mb-4"
                    />
                    <h3 className="text-gray-800 font-bold">Tidak ada data</h3>
                    <p className="text-gray-400 text-sm mt-1">
                      Tidak ada sampel pada tahap ini.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="px-6 py-4 align-top">
                      <div className="flex flex-col mt-0.5">
                        <span className="font-mono font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded border border-gray-200 w-fit">
                          {item.no_sampel_lab}
                        </span>
                        <div className="text-[10px] text-gray-400 mt-1 font-medium">
                          Reg: {item.no_reg}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="flex flex-col gap-0.5 mt-0.5">
                        <div className="flex items-center gap-1 font-bold text-gray-700">
                          <Clock size={14} className="text-cyan-600" />{" "}
                          {new Date(item.created_at).toLocaleTimeString(
                            "id-ID",
                            { hour: "2-digit", minute: "2-digit" },
                          )}{" "}
                          WIB
                        </div>
                        <div className="text-[10px] text-gray-400 capitalize mt-0.5">
                          {new Date(item.created_at).toLocaleDateString(
                            "id-ID",
                            {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs align-top">
                      <div className="flex flex-col">
                        {renderSampleBadges(item.jenis_pemeriksaan)}
                        <div className="flex items-start justify-between gap-2 mt-0.5">
                          <p
                            className="truncate font-medium text-gray-700 flex-1 text-xs leading-relaxed"
                            title={item.jenis_pemeriksaan}
                          >
                            {item.jenis_pemeriksaan}
                          </p>
                          <button
                            onClick={() => setDetailPemeriksaan(item)}
                            className="p-1 text-cyan-600 bg-cyan-50 hover:bg-cyan-100 rounded md:opacity-50 group-hover:opacity-100 transition-all flex-shrink-0"
                            title="Lihat Detail"
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                        {item.catatan_tambahan && (
                          <div className="flex items-center gap-1 mt-1.5 text-[10px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded w-fit border border-orange-100">
                            <AlertCircle size={10} /> {item.catatan_tambahan}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center align-top">
                      <div className="mt-0.5">
                        {activeTab === "waiting" ? (
                          <button
                            onClick={() =>
                              handleStartProcess(item.id, item.no_sampel_lab)
                            }
                            className="bg-orange-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-orange-600 transition-all flex items-center gap-2 mx-auto active:scale-95 shadow-sm w-full justify-center max-w-[140px]"
                          >
                            <PlayCircle size={16} /> Mulai Analisis
                          </button>
                        ) : activeTab === "process" ? (
                          <button
                            onClick={() => handleOpenInput(item)}
                            className="bg-cyan-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-cyan-700 transition-all flex items-center gap-2 mx-auto active:scale-95 shadow-sm w-full justify-center max-w-[140px]"
                          >
                            <FileEdit size={16} /> Input Hasil
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenPreview(item.id)}
                            className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-2 mx-auto active:scale-95 shadow-sm w-full justify-center max-w-[140px]"
                          >
                            <CheckSquare size={16} /> Verifikasi
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Info */}
        {!loading && processedData.length > 0 && (
          <div className="bg-gray-50/50 px-6 py-4 border-t border-gray-100 flex justify-between items-center gap-4 text-xs font-bold text-gray-500">
            <span className="whitespace-nowrap">
              Total: {processedData.length} Sampel
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-50"
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
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- MODALS --- */}

      {/* Modal Input Hasil */}
      {selectedSample && (
        <ResultInputModal
          registrationId={selectedSample.id}
          noSampel={selectedSample.no_sampel_lab}
          initialSpesimen={selectedSample.jenis_spesimen}
          onClose={() => {
            setSelectedSample(null);
            fetchQueue();
            if (onRefreshStats) onRefreshStats();
          }}
        />
      )}

      {/* Modal Detail Pemeriksaan */}
      {detailPemeriksaan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform scale-100">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <ListFilter size={18} className="text-cyan-600" /> Detail
                Pemeriksaan
              </h3>
              <button
                onClick={() => setDetailPemeriksaan(null)}
                className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                  Nomor Sampel
                </span>
                <p className="font-mono font-bold text-gray-800 text-lg mt-0.5">
                  {detailPemeriksaan.no_sampel_lab}
                </p>
              </div>
              <div>
                <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                  Parameter yang Diuji
                </span>
                <div className="mt-1.5 p-3.5 bg-gray-50 rounded-xl text-sm font-medium text-gray-700 border border-gray-100 max-h-48 overflow-y-auto leading-relaxed">
                  {detailPemeriksaan.jenis_pemeriksaan
                    .split(",")
                    .map((param, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 mb-1.5 last:mb-0"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                        <span>{param.trim()}</span>
                      </div>
                    ))}
                </div>
              </div>
              {detailPemeriksaan.catatan_tambahan && (
                <div>
                  <span className="text-[11px] text-orange-500 font-bold uppercase tracking-wider flex items-center gap-1">
                    <AlertCircle size={12} /> Catatan Khusus
                  </span>
                  <div className="mt-1.5 p-3 bg-orange-50/50 rounded-xl text-sm font-medium text-orange-700 border border-orange-100">
                    {detailPemeriksaan.catatan_tambahan}
                  </div>
                </div>
              )}
            </div>
            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button
                onClick={() => setDetailPemeriksaan(null)}
                className="px-5 py-2.5 bg-gray-800 text-white rounded-xl text-sm font-bold hover:bg-gray-900 transition-colors"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Preview Verifikasi */}
      {previewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-emerald-50">
              <div>
                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                  <CheckSquare size={20} className="text-emerald-600" />{" "}
                  Verifikasi Hasil Lab
                </h3>
                <p className="text-xs text-gray-500">
                  Tinjau kesesuaian data input sebelum di-acc validator.
                </p>
              </div>
              <button
                onClick={() => setPreviewData(null)}
                className="p-2 hover:bg-white rounded-full transition text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-white space-y-6 custom-scrollbar">
              <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 grid grid-cols-2 md:grid-cols-5 gap-y-4 gap-x-6">
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">
                    Nama Pasien
                  </p>
                  <p className="font-bold text-gray-800">
                    {previewData.nama_pasien}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">
                    No. Lab
                  </p>
                  <p className="font-mono text-sm font-bold text-emerald-700">
                    {previewData.no_sampel_lab}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">
                    Mulai Uji
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
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">
                    Selesai Input
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
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">
                    Durasi Analisis
                  </p>
                  <p className="text-sm font-semibold text-emerald-700 bg-emerald-100/50 w-fit px-2 py-0.5 rounded border border-emerald-200">
                    {getDuration(
                      previewData.waktu_mulai_periksa,
                      previewData.waktu_selesai_periksa,
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">
                    Selesai Input
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
              </div>

              <div>
                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                  <ClipboardList size={16} className="text-emerald-600" /> Data
                  Input Analis
                </h4>
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-600 font-bold text-[11px] uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3 pl-6">Parameter</th>
                        <th className="px-5 py-3 text-center bg-gray-200/50">
                          Hasil
                        </th>
                        <th className="px-5 py-3">Satuan</th>
                        <th className="px-5 py-3">Nilai Rujukan</th>
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
                                colSpan="4"
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
                                          className="w-full max-w-[120px] px-2 py-1 text-sm border border-emerald-400 rounded focus:ring-2 focus:ring-emerald-200 outline-none text-center bg-white text-gray-900 font-semibold"
                                          autoFocus
                                        />
                                        <button
                                          onClick={() =>
                                            handleSaveEdit(test.id)
                                          }
                                          disabled={isSavingEdit}
                                          className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
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
                                          className="p-1.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 disabled:opacity-50"
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
                                        {/* Icon edit dibuat selalu tampil dengan menghapus class opacity-0 */}
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
                <AlertCircle size={14} className="text-red-500" /> Hasil
                abnormal disorot{" "}
                <span className="text-red-600 font-bold">merah</span>.
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setPreviewData(null)}
                  className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-bold text-sm hover:bg-white transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleVerify}
                  disabled={processingVerify}
                  className="px-6 py-2.5 rounded-xl text-white font-bold text-sm transition-all flex items-center gap-2 disabled:opacity-70 bg-gradient-to-r from-emerald-600 to-green-600 hover:shadow-emerald-200"
                >
                  {processingVerify ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />{" "}
                      Memproses...
                    </>
                  ) : (
                    <>
                      <CheckSquare size={18} /> Verifikasi Data
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
