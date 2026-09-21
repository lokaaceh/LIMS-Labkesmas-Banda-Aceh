import React from "react";
import {
  User,
  Microscope,
  Calendar,
  Printer,
  DownloadCloud,
  UploadCloud,
  Trash2,
  Pencil,
  CheckCircle2,
  ListFilter,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const StatusBadge = ({ status }) => {
  const styles = {
    selesai: "bg-green-100 text-green-700 border-green-200",
    selesai_uji: "bg-blue-100 text-blue-700 border-blue-200",
    proses_lab: "bg-yellow-50 text-yellow-700 border-yellow-200",
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

export default function DataTable({
  loading,
  paginatedData,
  processedDataLength,
  searchTerm,
  user,
  handlePrintLHU,
  getSafeLhuUrl,
  setSelectedUploadData,
  setUploadModalOpen,
  handleDeleteCustomLHU,
  handleDelete,
  itemsPerPage,
  setItemsPerPage,
  currentPage,
  setCurrentPage,
  totalPages,
}) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden print:hidden">
      <div className="overflow-x-auto min-h-[300px]">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50/50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Informasi Pasien
              </th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Detail Laporan
              </th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Status
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
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-400 text-sm font-medium">
                      Memuat data laporan...
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
                      Data tidak ditemukan
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">
                      {searchTerm
                        ? "Tidak ada hasil pencarian."
                        : "Belum ada laporan data yang tersedia."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-blue-50/30 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 border border-gray-200 group-hover:border-blue-200 transition-all shrink-0">
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
                        <Microscope size={14} className="text-blue-500" /> ID
                        Lab:{" "}
                        <span className="font-mono">
                          {item.no_sampel_lab || "-"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-400 text-[11px]">
                        <Calendar size={12} />{" "}
                        {new Date(item.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2 items-center">
                      {item.status === "selesai" ? (
                        <>
                          <button
                            onClick={() => handlePrintLHU(item.id)}
                            className="bg-purple-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold hover:bg-purple-700 flex items-center gap-1.5 shadow-md shadow-purple-100 transition-all"
                          >
                            <Printer size={14} /> Cetak
                          </button>
                          {item.link_hasil &&
                          item.link_hasil.includes("custom_lhu_") ? (
                            <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 p-0.5 rounded-lg ml-1">
                              <a
                                href={getSafeLhuUrl(item.link_hasil)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-md transition-all"
                              >
                                <DownloadCloud size={14} />
                              </a>
                              <div className="w-px h-4 bg-emerald-200"></div>
                              <button
                                onClick={() => {
                                  setSelectedUploadData(item);
                                  setUploadModalOpen(true);
                                }}
                                className="p-1.5 text-blue-600 hover:bg-blue-600 hover:text-white rounded-md transition-all"
                              >
                                <UploadCloud size={14} />
                              </button>
                              <div className="w-px h-4 bg-emerald-200"></div>
                              <button
                                onClick={() => handleDeleteCustomLHU(item.id)}
                                className="p-1.5 text-red-600 hover:bg-red-600 hover:text-white rounded-md transition-all"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedUploadData(item);
                                setUploadModalOpen(true);
                              }}
                              className="bg-cyan-600 text-white px-2.5 py-1.5 ml-1 rounded-lg text-xs font-bold hover:bg-cyan-700 flex items-center gap-1.5 shadow-md shadow-cyan-100 transition-all"
                            >
                              <UploadCloud size={14} /> Upload
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-400 italic text-[10px] bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100">
                          {item.status === "selesai_uji"
                            ? "Menunggu Validasi"
                            : "Belum Selesai"}
                        </span>
                      )}

                      {(user?.role === "manajemen" ||
                        user?.role === "admin") && (
                        <div className="flex gap-1 ml-2 pl-2 border-l border-gray-200">
                          <button
                            onClick={() =>
                              navigate(`/registrations/edit/${item.id}`, {
                                state: { restrictItems: true },
                              })
                            }
                            className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
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

      {!loading && processedDataLength > 0 && (
        <div className="bg-gray-50/50 px-6 py-4 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold text-gray-500">
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
            <span className="whitespace-nowrap">
              Total: {processedDataLength} Data
            </span>
            <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
              <span className="text-gray-400 hidden sm:inline">Tampilkan:</span>
              <div className="relative">
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="bg-white border border-gray-200 text-gray-700 py-1 pl-2 pr-6 rounded-lg appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500 outline-none"
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
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {!loading && (
        <div className="bg-gray-50 px-6 py-2 border-t border-gray-200 text-[10px] text-gray-400 font-bold flex justify-end items-center gap-1 print:hidden">
          Sistem LIMS <ArrowRight size={10} /> Manajemen Data
        </div>
      )}
    </div>
  );
}
