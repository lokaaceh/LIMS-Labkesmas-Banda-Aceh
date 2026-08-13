import React, { useState, useEffect, useMemo, useCallback } from "react";
import api from "../api/axios";
import { toast } from "react-toastify";
import { getDetailedAge } from "../utils/ageHelper";

import {
  Syringe,
  Clock,
  CheckCircle2,
  PlayCircle,
  Send,
  AlertCircle,
  Search,
  User,
  FlaskConical,
  ClipboardList,
  RefreshCw,
  Bug,
  Droplets,
  Beef,
  Microscope,
  ArrowUpDown,
  ListFilter,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Lock, // <-- Tambahan icon Lock untuk status terkunci
} from "lucide-react";

export default function SamplerQueue({ onRefreshStats }) {
  const [activeTab, setActiveTab] = useState("queue");
  const [dataList, setDataList] = useState([]);
  const [masterMap, setMasterMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("newest");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [regRes, masterRes] = await Promise.all([
        api.get("/registrations"),
        api.get("/master/pemeriksaan"),
      ]);

      if (masterRes.data.success) {
        const map = {};
        masterRes.data.data.forEach((item) => {
          map[item.nama_pemeriksaan.toLowerCase()] =
            item.nama_instalasi || item.kategori || "SAMPEL UMUM";
        });
        setMasterMap(map);
      }

      if (regRes.data.success) {
        const relevantData = regRes.data.data.filter(
          (item) =>
            ["terdaftar", "proses_sampling"].includes(item.status) &&
            item.asal_sampel === "Mandiri", // <-- UX FIX: HANYA TAMPILKAN PASIEN MANDIRI
        );
        setDataList(relevantData);
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat antrian sampler");
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, itemsPerPage]);

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
      if (inst) detectedInstalasi.add(inst.toUpperCase());
    });

    if (detectedInstalasi.size === 0) {
      return (
        <span className="bg-gray-100 text-gray-700 text-[10px] px-2 py-0.5 rounded-md font-bold border border-gray-200 flex items-center gap-1 w-fit">
          <FlaskConical size={10} /> SAMPEL UMUM
        </span>
      );
    }

    return (
      <div className="flex flex-wrap gap-1">
        {Array.from(detectedInstalasi).map((inst) => {
          if (
            [
              "HEMATOLOGI",
              "KIMIA KLINIK",
              "IMUNOLOGI",
              "SEROLOGI",
              "KLINIK",
            ].some((c) => inst.includes(c))
          ) {
            return (
              <span
                key={inst}
                className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-md font-bold border border-red-200 flex items-center gap-1"
              >
                <Droplets size={10} /> {inst}
              </span>
            );
          }
          if (inst.includes("URIN")) {
            return (
              <span
                key={inst}
                className="bg-yellow-100 text-yellow-700 text-[10px] px-2 py-0.5 rounded-md font-bold border border-yellow-200 flex items-center gap-1"
              >
                <FlaskConical size={10} /> {inst}
              </span>
            );
          }
          if (
            ["VEKTOR", "PARASITOLOGI", "ENTOMOLOGI"].some((c) =>
              inst.includes(c),
            )
          ) {
            return (
              <span
                key={inst}
                className="bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-md font-bold border border-orange-200 flex items-center gap-1"
              >
                <Bug size={15} /> {inst}
              </span>
            );
          }
          if (
            ["LINGKUNGAN", "AIR", "FISIKA", "LIMBAH"].some((c) =>
              inst.includes(c),
            )
          ) {
            return (
              <span
                key={inst}
                className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-md font-bold border border-blue-200 flex items-center gap-1"
              >
                <Droplets size={10} /> {inst}
              </span>
            );
          }
          if (
            ["MAKANAN", "MINUMAN", "TOKSIKOLOGI", "KIMIA MAKANAN"].some((c) =>
              inst.includes(c),
            )
          ) {
            return (
              <span
                key={inst}
                className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-md font-bold border border-emerald-200 flex items-center gap-1"
              >
                <Beef size={10} /> {inst}
              </span>
            );
          }
          if (
            ["BIOMOLEKULER", "PCR", "MIKROBIOLOGI", "BAKTERIOLOGI"].some((c) =>
              inst.includes(c),
            )
          ) {
            return (
              <span
                key={inst}
                className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-md font-bold border border-purple-200 flex items-center gap-1"
              >
                <Microscope size={10} /> {inst}
              </span>
            );
          }
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
    let filtered = dataList.filter((item) => {
      const matchesTab =
        activeTab === "queue"
          ? item.status === "terdaftar"
          : item.status === "proses_sampling";
      const matchesSearch =
        item.nama_pasien.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.no_reg.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });

    filtered.sort((a, b) => {
      if (sortBy === "newest")
        return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === "oldest")
        return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === "name_asc")
        return a.nama_pasien.localeCompare(b.nama_pasien);
      if (sortBy === "urgent")
        return (b.catatan_tambahan ? 1 : 0) - (a.catatan_tambahan ? 1 : 0);
      return 0;
    });

    return filtered;
  }, [dataList, activeTab, searchQuery, sortBy]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedData.slice(startIndex, startIndex + itemsPerPage);
  }, [processedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage);

  // --- LOGIC GUARD ---
  // Pastikan action tertahan jika belum bayar
  const checkIsUnpaid = (item) => {
    return item.status_pembayaran === "berbayar" && !item.no_invoice;
  };

  const handleStartSampling = async (item) => {
    if (checkIsUnpaid(item)) {
      toast.warning(
        `Akses ditolak! Pasien ${item.no_reg} belum menyelesaikan administrasi di Kasir.`,
      );
      return;
    }

    try {
      await api.put(`/registrations/${item.id}/start-sampling`);
      toast.info(`Mulai pengambilan sampel: ${item.no_reg}`);
      fetchData();
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      console.error(err);
      toast.error("Gagal memulai proses sampling");
    }
  };

  const handleSendToLab = async (id, noReg) => {
    if (
      !confirm(
        `Konfirmasi: Sampel ${noReg} sudah selesai diambil dan siap dikirim ke Lab?`,
      )
    )
      return;
    try {
      await api.put(`/registrations/${id}/send-to-lab`);
      toast.success(`Sampel ${noReg} diteruskan ke Laboratorium!`);
      fetchData();
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengirim ke lab");
    }
  };

  const getCounts = (status) =>
    dataList.filter((i) => i.status === status).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in p-2 md:p-0">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-yellow-50 rounded-xl text-yellow-600">
            <Syringe size={28} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 tracking-tight">
              Ruang Sampling
            </h2>
            <p className="text-gray-500 text-sm font-medium">
              Petugas: Silahkan proses pengambilan sampel fisik.
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
              <option value="name_asc">Nama (A-Z)</option>
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
              placeholder="Cari Nama / No. Reg..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none transition-all text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            onClick={fetchData}
            className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-all shadow-sm hidden md:block"
            title="Refresh Antrian"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("queue")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === "queue"
              ? "bg-white text-cyan-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Clock size={16} />
          Antrian Baru
          <span
            className={`ml-1 px-2 py-0.5 rounded-md text-[10px] ${activeTab === "queue" ? "bg-cyan-100 text-cyan-700" : "bg-gray-200"}`}
          >
            {getCounts("terdaftar")}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("process")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === "process"
              ? "bg-white text-orange-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <FlaskConical size={16} />
          Sedang Sampling
          <span
            className={`ml-1 px-2 py-0.5 rounded-md text-[10px] ${activeTab === "process" ? "bg-orange-100 text-orange-600" : "bg-gray-200"}`}
          >
            {getCounts("proses_sampling")}
          </span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-200">
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Data Pasien
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Detail Pemeriksaan
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Status & Waktu
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">
                  Tindakan
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-20">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-gray-400 text-sm font-medium">
                        Menyinkronkan data antrian...
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
                        Tidak ada antrian
                      </h3>
                      <p className="text-gray-400 text-sm mt-1">
                        Semua pasien pada tahap ini telah selesai diproses.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 transition-colors group border-b border-gray-100 last:border-none"
                  >
                    {/* KOLOM 1: Identitas Pasien */}
                    <td className="px-6 py-5 align-top">
                      <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 shadow-sm group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200 transition-all duration-300 shrink-0 mt-0.5">
                          <User size={20} strokeWidth={2} />
                        </div>

                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900 text-sm">
                              {item.nama_pasien}
                            </span>
                            <span className="text-gray-300 text-[10px]">●</span>
                            <span className="text-cyan-700 text-xs font-medium">
                              {getDetailedAge(
                                item.tgl_lahir,
                                item.tgl_daftar,
                              ) || (item.umur ? `${item.umur} Thn` : "-")}
                            </span>
                            <span className="text-gray-300 text-[10px]">●</span>
                            <span className="text-gray-500 text-xs font-medium uppercase">
                              {item.jenis_kelamin === "L"
                                ? "Laki-laki"
                                : item.jenis_kelamin === "P"
                                  ? "Perempuan"
                                  : item.jenis_kelamin}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-md">
                              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                                Reg
                              </span>
                              <span className="font-mono text-xs font-medium text-gray-700">
                                {item.no_reg}
                              </span>
                            </div>
                            {item.no_sampel_lab &&
                              item.no_sampel_lab !== "-" && (
                                <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                                  <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">
                                    Lab
                                  </span>
                                  <span className="font-mono text-xs font-medium text-blue-700">
                                    {item.no_sampel_lab}
                                  </span>
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* KOLOM 2: Pemeriksaan & Catatan */}
                    <td className="px-6 py-5 align-top">
                      <div className="flex flex-col gap-2.5 max-w-sm">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap gap-1.5">
                            {renderSampleBadges(item.jenis_pemeriksaan)}
                          </div>
                          <p
                            className="text-xs text-gray-500 font-medium leading-relaxed line-clamp-2"
                            title={item.jenis_pemeriksaan}
                          >
                            {item.jenis_pemeriksaan}
                          </p>
                        </div>

                        {item.catatan_tambahan && (
                          <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50/80 p-2.5 rounded-lg border border-amber-200/50">
                            <ClipboardList
                              size={14}
                              className="mt-0.5 shrink-0 text-amber-500"
                            />
                            <span className="leading-relaxed font-medium">
                              {item.catatan_tambahan}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* KOLOM 3: Waktu & Status Pembayaran */}
                    <td className="px-6 py-5 align-top">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start gap-2">
                          <Clock
                            size={16}
                            className="text-gray-400 mt-0.5 shrink-0"
                          />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                              Waktu Daftar
                            </span>
                            <span className="text-sm font-semibold text-gray-700">
                              {new Date(item.created_at).toLocaleTimeString(
                                "id-ID",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}{" "}
                              <span className="text-xs font-normal text-gray-500">
                                WIB
                              </span>
                            </span>
                            {/* Tambahan: Menampilkan Hari, Tanggal, Bulan, dan Tahun */}
                            <span className="text-[10px] text-gray-400 capitalize mt-0.5">
                              {new Date(item.created_at).toLocaleDateString(
                                "id-ID",
                                {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </span>
                          </div>
                        </div>

                        {/* --- UX: STATUS BELUM BAYAR/TERKUNCI --- */}
                        {checkIsUnpaid(item) ? (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 w-fit px-2.5 py-1 rounded-md">
                            <AlertCircle size={12} />
                            <span>Menunggu Kasir (Belum Bayar)</span>
                          </div>
                        ) : item.status === "proses_sampling" ? (
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 w-fit px-2.5 py-1.5 rounded-md">
                            <Syringe
                              size={14}
                              className="animate-pulse text-blue-500"
                            />
                            <span className="animate-pulse">
                              Sedang Diambil
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </td>

                    {/* KOLOM 4: Aksi */}
                    <td className="px-6 py-5 align-top">
                      <div className="flex justify-end min-w-[160px]">
                        {item.status === "terdaftar" ? (
                          // --- UX: TOMBOL TERKUNCI ---
                          checkIsUnpaid(item) ? (
                            <button
                              disabled
                              className="relative overflow-hidden bg-gray-100 text-gray-400 px-4 py-2.5 rounded-xl text-[11px] font-bold border border-gray-200 cursor-not-allowed flex items-center justify-center gap-2 w-full"
                            >
                              <Lock size={14} />
                              <span>Terkunci</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStartSampling(item)}
                              className="group/btn relative overflow-hidden bg-cyan-600 text-white pl-4 pr-11 py-2.5 rounded-xl text-xs font-bold hover:bg-cyan-700 transition-all shadow-sm hover:shadow-cyan-200 active:scale-95 flex items-center justify-between w-full"
                            >
                              <span>Proses Sampling</span>
                              <div className="absolute right-0 top-0 bottom-0 w-9 bg-cyan-700/50 flex items-center justify-center group-hover/btn:w-10 transition-all">
                                <PlayCircle size={16} />
                              </div>
                            </button>
                          )
                        ) : (
                          <div className="flex flex-col gap-2 w-full">
                            <button
                              onClick={() =>
                                handleSendToLab(item.id, item.no_reg)
                              }
                              className="bg-green-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-green-700 transition-all shadow-sm hover:shadow-green-200 active:scale-95 flex items-center justify-center gap-2 w-full"
                            >
                              <Send size={14} /> Teruskan Ke Lab
                            </button>

                            <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-amber-600 bg-amber-50 py-1.5 rounded-lg border border-amber-100">
                              <AlertCircle size={12} />
                              <span>Periksa Label</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Info & Pagination */}
        {!loading && processedData.length > 0 && (
          <div className="bg-gray-50/50 px-6 py-4 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold text-gray-500">
            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
              <span className="whitespace-nowrap">
                Total: {processedData.length} Pasien
              </span>

              <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
                <span className="text-gray-400 hidden sm:inline">
                  Tampilkan:
                </span>
                <div className="relative">
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="bg-white border border-gray-200 text-gray-700 py-1 pl-2 pr-6 rounded-lg appearance-none cursor-pointer focus:ring-2 focus:ring-cyan-500 outline-none"
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
    </div>
  );
}
