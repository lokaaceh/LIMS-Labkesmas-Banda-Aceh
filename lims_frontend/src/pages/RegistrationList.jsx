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
  ChevronDown,
  Calendar,
  ListFilter,
  ArrowRight,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Send,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { toast } from "react-toastify";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { getDetailedAge } from "../utils/ageHelper";

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

  // --- PAGINATION STATE ---
  // Default limit 5 untuk dashboard, 25 untuk halaman list utama
  const [rowsLimit, setRowsLimit] = useState(isDashboard ? 5 : 25);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset ke halaman 1 jika user melakukan pencarian atau mengubah limit baris
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, rowsLimit]);

  const formatDateSafe = (dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      });
    } catch (e) {
      console.error(e);
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
      if (error.response?.status !== 200) {
        toast.error(
          error.response?.data?.message || "Gagal menghapus registrasi",
        );
      }
    }
  };

  const handleEdit = (id) => {
    navigate(`/registrations/edit/${id}`);
  };

  // --- LOGIC: FILTERING & SORTING ---
  const processedData = useMemo(() => {
    if (!data) return [];

    let result = [...data];

    // 1. Searching (Tetap jalan meski di dashboard agar data rapi jika dibutuhkan)
    if (searchTerm && !isDashboard) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.nama_pasien?.toLowerCase().includes(lowerTerm) ||
          item.no_reg?.toLowerCase().includes(lowerTerm) ||
          item.no_sampel_lab?.toLowerCase().includes(lowerTerm) ||
          item.jenis_pemeriksaan?.toLowerCase().includes(lowerTerm),
      );
    }

    // 2. Sorting
    result.sort((a, b) => {
      const dateA = new Date(a?.created_at || a?.tgl_daftar).getTime();
      const dateB = new Date(b?.created_at || b?.tgl_daftar).getTime();

      const timeA = Number.isNaN(dateA) ? 0 : dateA;
      const timeB = Number.isNaN(dateB) ? 0 : dateB;

      if (sortOrder === "asc") {
        return timeA - timeB;
      } else {
        return timeB - timeA;
      }
    });

    // NOTE: Hapus return result.slice() di sini. Pemotongan dilakukan oleh Pagination Logic di bawah.
    return result;
  }, [data, searchTerm, sortOrder, isDashboard]);

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
        {status.replace("_", " ")}
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

  const handleDirectToLab = async (id, noReg) => {
    if (
      !confirm(
        `Konfirmasi: Sampel fisik Rujukan untuk ${noReg} sudah diterima dan siap diteruskan langsung ke Lab?`,
      )
    )
      return;
    try {
      await api.put(`/registrations/${id}/send-to-lab`);
      toast.success(`Sampel rujukan ${noReg} diteruskan ke Laboratorium!`);
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error("Gagal meneruskan sampel ke lab");
    }
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
      {/* --- HEADER SECTION (HANYA TAMPIL JIKA BUKAN DASHBOARD) --- */}
      {!isDashboard && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
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

          <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
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
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
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
              {!data || data.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                        <MoreHorizontal size={30} className="text-gray-300" />
                      </div>
                      <h3 className="text-gray-800 font-bold text-sm">
                        Belum ada data
                      </h3>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12">
                    <div className="flex flex-col items-center justify-center text-center">
                      <Search size={30} className="text-gray-300 mb-2" />
                      <p className="text-gray-400 text-sm">
                        Tidak ada hasil untuk "{searchTerm}"
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                // PASTIKAN MAP DARI paginatedData BUKAN processedData
                paginatedData.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-blue-50/30 transition-colors group"
                  >
                    {/* ... (Kolom-kolom Table `td` tidak ada yang berubah, gunakan *render* aslimu di sini) ... */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-100 to-cyan-100 flex items-center justify-center text-blue-600 font-bold text-xs border border-blue-100 shrink-0">
                          {getInitials(item.nama_pasien)}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 leading-tight">
                            {item.nama_pasien}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            <span className="font-medium text-cyan-700">
                              {/* Prioritaskan kalkulasi detail, jika gagal fallback ke data umur lama di DB */}
                              {getDetailedAge(
                                item.tgl_lahir,
                                item.tgl_daftar,
                              ) || (item.umur ? `${item.umur} Thn` : "-")}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                            <span>
                              {item.jenis_kelamin === "L"
                                ? "Laki-Laki"
                                : "Perempuan"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                            {item.no_reg}
                          </span>
                          {!item.no_invoice && (
                            <span
                              className="flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 px-1.5 py-[2px] rounded text-[9px] font-extrabold tracking-wide cursor-help shadow-sm"
                              title="Perhatian: Nomor Invoice belum diset / disimpan!"
                            >
                              <AlertCircle size={10} strokeWidth={2.5} /> Belum
                              bayar
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                          No Sampel:{" "}
                          <span className="text-gray-600 font-semibold">
                            {item.no_sampel_lab || "-"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div
                        className="max-w-[150px] truncate font-medium text-gray-800 text-sm"
                        title={item.jenis_pemeriksaan}
                      >
                        {item.jenis_pemeriksaan}
                      </div>
                      {!isDashboard && (
                        <>
                          <div className="flex items-center gap-2 mt-1">
                            {item.status_pembayaran === "gratis" ? (
                              <span className="bg-green-100 text-green-700 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide border border-green-200">
                                GRATIS
                              </span>
                            ) : (
                              <div className="flex items-center gap-1 text-cyan-700 font-bold text-[11px]">
                                <Wallet size={10} />
                                {formatRupiah(item.total_biaya)}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400">
                            <Calendar size={10} />
                            {formatDateSafe(item.tgl_daftar)}
                          </div>
                        </>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-1.5">
                        <StatusBadge status={item.status} />
                        {!isDashboard && (
                          <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1 px-1">
                            <ArrowRight size={8} /> {item.asal_sampel}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center gap-1">
                        <button
                          onClick={() => onViewDetail(item)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors tooltip"
                          title="Lihat Detail"
                        >
                          <Eye size={18} />
                        </button>

                        {!isDashboard && (
                          <>
                            {/* LOGIC BYPASS RUJUKAN: Munculkan tombol Kirim ke Lab untuk Input/Kasir/Admin jika asal_sampel Rujukan */}
                            {item.status === "terdaftar" &&
                              item.asal_sampel === "Rujukan" &&
                              ["admin", "input", "kasir"].includes(
                                user?.role,
                              ) && (
                                <button
                                  onClick={() =>
                                    handleDirectToLab(item.id, item.no_reg)
                                  }
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                                  title="Bypass: Teruskan Langsung Ke Lab"
                                >
                                  <Send size={18} />
                                </button>
                              )}

                            {(user?.role === "admin" ||
                              (user?.role === "input" &&
                                item.status === "terdaftar")) && (
                              <>
                                <button
                                  onClick={() => handleEdit(item.id)}
                                  className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-xl transition-colors"
                                  title="Edit Data"
                                >
                                  <Edit size={18} />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDelete(item.id, item.no_reg)
                                  }
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                  title={
                                    user?.role === "admin"
                                      ? "Hapus Permanen"
                                      : "Hapus Registrasi"
                                  }
                                >
                                  <Trash2 size={18} />
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* --- DYNAMIC FOOTER INFO & PAGINATION --- */}
        {processedData.length > 0 && (
          <div className="bg-gray-50/50 px-6 py-4 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold text-gray-500">
            {/* Left: Total & Limit Control */}
            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
              <span className="whitespace-nowrap">
                Total: {data ? data.length : 0} Data
                {searchTerm &&
                  !isDashboard &&
                  ` (Difilter: ${processedData.length})`}
              </span>

              <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
                <span className="text-gray-400 hidden sm:inline">
                  Tampilkan:
                </span>
                <div className="relative">
                  <select
                    value={rowsLimit}
                    onChange={(e) => setRowsLimit(Number(e.target.value))}
                    className="bg-white border border-gray-200 text-gray-700 py-1 pl-2 pr-6 rounded-lg appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value={5}>5</option>
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

            {/* Right: Pagination Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-2">
                Hal {currentPage} / {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
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

RegistrationList.propTypes = {
  data: PropTypes.array.isRequired,
  onViewDetail: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  isDashboard: PropTypes.bool,
};
