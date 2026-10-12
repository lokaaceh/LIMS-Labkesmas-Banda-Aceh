import { useState, useMemo, useEffect } from "react";
import {
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Wallet,
  FileText,
  Search,
  ArrowUpDown,
  Calendar,
  ListFilter,
  ArrowRight,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Send,
  Filter,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../api/axios.js";
import { toast } from "react-toastify";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { getDetailedAge } from "../../../utils/ageHelper.js";

export default function RegistrationList({
  data,
  onViewDetail,
  onRefresh,
  isDashboard = false,
}) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [instalasiList, setInstalasiList] = useState([]);
  const [selectedInstalasiFilter, setSelectedInstalasiFilter] = useState("");

  // --- AMBIL DATA MASTER INSTALASI ---
  useEffect(() => {
    const fetchInstalasi = async () => {
      try {
        const res = await api.get("/master/instalasi");
        if (res.data.success) {
          setInstalasiList(res.data.data);
        }
      } catch (error) {
        console.error("Gagal memuat data instalasi", error);
      }
    };
    fetchInstalasi();
  }, []);

  // --- PAGINATION STATE ---
  const [rowsLimit, setRowsLimit] = useState(isDashboard ? 5 : 25);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, rowsLimit, selectedInstalasiFilter]);

  const formatDateSafe = (dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      });
    } catch (e) {
      return "-";
    }
  };

  const formatRupiah = (num) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num || 0);
  };

  const handleDelete = async (id, noReg) => {
    if (!confirm(`Yakin ingin menghapus registrasi ${noReg}?`)) return;
    try {
      await api.delete(`/registrations/${id}`);
      toast.success("Registrasi berhasil dihapus");
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Gagal menghapus registrasi",
      );
    }
  };

  const handleEdit = (id) => {
    navigate(`/registrations/edit/${id}`);
  };

  // --- LOGIC: FILTERING & SORTING ---
  const processedData = useMemo(() => {
    if (!data) return [];

    let result = [...data];

    // 1. Filter Berdasarkan Instalasi yang dipilih dari tombol filter
    if (selectedInstalasiFilter !== "") {
      const selectedInstalasiObj = instalasiList.find(
        (i) => i.id === selectedInstalasiFilter,
      );
      const targetKodeSampel =
        selectedInstalasiObj?.kode_sampel?.toLowerCase() || "";
      const targetNamaInstalasi =
        selectedInstalasiObj?.nama_instalasi?.toLowerCase() || "";

      result = result.filter((item) => {
        // A. Cek langsung jika item memiliki instalasi_id
        if (item.instalasi_id === selectedInstalasiFilter) return true;

        // B. Cek melalui relasi registration_details -> master_pemeriksaan -> instalasi_id
        if (
          item.registration_details &&
          Array.isArray(item.registration_details)
        ) {
          const matchDetail = item.registration_details.some(
            (d) =>
              d.instalasi_id === selectedInstalasiFilter ||
              d.master_pemeriksaan?.instalasi_id === selectedInstalasiFilter,
          );
          if (matchDetail) return true;
        }

        // Cek untuk data Kesling berdasarkan kategori atau nomor sampel / jenis pemeriksaan
        if (item.kategori && targetNamaInstalasi) {
          const matchKategori = item.kategori
            .toLowerCase()
            .includes(targetNamaInstalasi.split(" ")[0]);
          if (matchKategori) return true;
        }

        if (item.no_sampel_lab || item.nomor_sampel) {
          const sampelStr = (
            item.no_sampel_lab ||
            item.nomor_sampel ||
            ""
          ).toLowerCase();
          if (targetKodeSampel && sampelStr.includes(targetKodeSampel)) {
            return true;
          }
        }

        return false;
      });
    }

    // Searching
    if (searchTerm && !isDashboard) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          (item.nama_pasien || item.nama_pelanggan)
            ?.toLowerCase()
            .includes(lowerTerm) ||
          item.no_reg?.toLowerCase().includes(lowerTerm) ||
          (item.no_sampel_lab || item.nomor_sampel)
            ?.toLowerCase()
            .includes(lowerTerm) ||
          (item.jenis_pemeriksaan || item.pengujian)
            ?.toLowerCase()
            .includes(lowerTerm),
      );
    }

    // Sorting
    result.sort((a, b) => {
      const dateA = new Date(
        a?.created_at || a?.tgl_daftar || a?.tgl_penerimaan,
      ).getTime();
      const dateB = new Date(
        b?.created_at || b?.tgl_daftar || b?.tgl_penerimaan,
      ).getTime();

      const timeA = Number.isNaN(dateA) ? 0 : dateA;
      const timeB = Number.isNaN(dateB) ? 0 : dateB;

      return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
    });

    return result;
  }, [
    data,
    searchTerm,
    sortOrder,
    selectedInstalasiFilter,
    instalasiList,
    isDashboard,
  ]);
  // --- LOGIC: PAGINATION ---
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsLimit;
    return processedData.slice(startIndex, startIndex + rowsLimit);
  }, [processedData, currentPage, rowsLimit]);

  const totalPages = Math.ceil(processedData.length / rowsLimit) || 1;

  const StatusBadge = ({ status }) => {
    const styles = {
      selesai: "bg-green-100 text-green-700 border-green-200",
      terdaftar: "bg-blue-50 text-blue-700 border-blue-200",
      diterima_lab: "bg-indigo-50 text-indigo-700 border-indigo-200",
      proses_lab: "bg-yellow-50 text-yellow-700 border-yellow-200",
      selesai_uji: "bg-purple-50 text-purple-700 border-purple-200",
    };
    const style = styles[status] || "bg-gray-100 text-gray-600 border-gray-200";

    return (
      <span
        className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wide border ${style}`}
      >
        {status ? status.replace("_", " ") : "TERDAFTAR"}
      </span>
    );
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const containerClass = isDashboard
    ? "overflow-hidden"
    : "bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden";

  return (
    <div
      className={
        isDashboard
          ? ""
          : "max-w-7xl mx-auto space-y-6 animate-fade-in p-2 md:p-0"
      }
    >
      {/* --- HEADER SECTION --- */}
      {!isDashboard && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                <FileText size={28} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800 tracking-tight">
                  Data Registrasi
                </h2>
                <p className="text-gray-500 text-sm font-medium">
                  Kelola data pendaftaran pasien dan status pemeriksaan.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative group w-full md:w-40">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <ArrowUpDown size={16} />
                </div>
                <select
                  className="w-full pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold text-gray-600 appearance-none cursor-pointer hover:bg-gray-50 transition-all shadow-sm"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="desc">Terbaru</option>
                  <option value="asc">Terlama</option>
                </select>
              </div>

              <div className="relative w-full md:w-64">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Cari Nama / No. Reg..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* --- TOMBOL FILTER INSTALASI --- */}
          <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-gray-100 custom-scrollbar">
            <Filter size={16} className="text-gray-400 shrink-0 mr-2" />
            <button
              onClick={() => setSelectedInstalasiFilter("")}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                selectedInstalasiFilter === ""
                  ? "bg-cyan-50 border-cyan-200 text-cyan-700 shadow-sm"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              SEMUA INSTALASI
            </button>
            {instalasiList.map((inst) => (
              <button
                key={inst.id}
                onClick={() => setSelectedInstalasiFilter(inst.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium border flex items-center gap-2 transition-all ${
                  selectedInstalasiFilter === inst.id
                    ? "bg-cyan-50 border-cyan-200 text-cyan-700 shadow-sm"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {inst.kode_sampel && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-200 text-cyan-800">
                    {inst.kode_sampel}
                  </span>
                )}
                {inst.nama_instalasi.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* --- TABLE CARD --- */}
      <div className={containerClass}>
        <div className="overflow-x-auto min-h-[150px]">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Info Pasien
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  No. Reg / Sampel
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Pemeriksaan
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
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12">
                    <div className="flex flex-col items-center justify-center text-center">
                      <Search size={30} className="text-gray-300 mb-2" />
                      <p className="text-gray-400 text-sm">
                        Tidak ada data registrasi ditemukan.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => {
                  const namaDisplay =
                    item.nama_pasien || item.nama_pelanggan || "Tanpa Nama";
                  const pemeriksaanDisplay =
                    item.jenis_pemeriksaan || item.pengujian || "-";
                  const noSampelDisplay =
                    item.no_sampel_lab || item.nomor_sampel || "-";

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-blue-50/30 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center text-blue-600 font-bold text-xs border border-blue-100 shrink-0">
                            {getInitials(namaDisplay)}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 leading-tight">
                              {namaDisplay}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                              <span className="font-medium text-cyan-700">
                                {getDetailedAge(
                                  item.tgl_lahir,
                                  item.tgl_daftar,
                                ) || (item.umur ? `${item.umur} Thn` : "-")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start gap-1.5">
                          <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                            {item.no_reg}
                          </span>
                          <div className="text-[10px] text-gray-400 font-medium">
                            No Sampel:{" "}
                            <span className="text-gray-600 font-semibold">
                              {noSampelDisplay}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div
                          className="max-w-[180px] truncate font-medium text-gray-800 text-sm"
                          title={pemeriksaanDisplay}
                        >
                          {pemeriksaanDisplay}
                        </div>
                        <div className="flex items-center gap-1 text-cyan-700 font-bold text-[11px] mt-1">
                          <Wallet size={10} />
                          {formatRupiah(item.total_biaya)}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <StatusBadge status={item.status} />
                      </td>

                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center items-center gap-1">
                          {/* TOMBOL LIHAT DETAIL */}
                          <button
                            onClick={() => onViewDetail(item)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                            title="Lihat Detail"
                          >
                            <Eye size={18} />
                          </button>

                          {/* TOMBOL EDIT */}
                          <button
                            onClick={() => handleEdit(item.id)}
                            className="p-2 text-amber-500 hover:bg-amber-50 rounded-xl transition-colors"
                            title="Edit Registrasi"
                          >
                            <Edit size={18} />
                          </button>

                          {/* TOMBOL HAPUS */}
                          <button
                            onClick={() => handleDelete(item.id, item.no_reg)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                            title="Hapus Registrasi"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* --- PAGINATION FOOTER --- */}
        {processedData.length > 0 && (
          <div className="bg-gray-50/50 px-6 py-4 border-t border-gray-100 flex justify-between items-center text-xs font-bold text-gray-500">
            <span>Total: {processedData.length} Data</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronLeft size={14} />
              </button>
              <span>
                Hal {currentPage} / {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
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
    </div>
  );
}

RegistrationList.propTypes = {
  data: PropTypes.array.isRequired,
  onViewDetail: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  isDashboard: PropTypes.bool,
};
