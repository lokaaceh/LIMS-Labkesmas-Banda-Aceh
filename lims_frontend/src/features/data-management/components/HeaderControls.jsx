import React from "react";
import {
  FileBarChart,
  ArrowUpDown,
  ChevronDown,
  Search,
  RefreshCw,
  CloudUpload,
  FileText,
  Download,
} from "lucide-react";

export default function HeaderControls({
  user,
  sortBy,
  setSortBy,
  searchTerm,
  setSearchTerm,
  loading,
  fetchData,
  handleForceBackup,
  setShowPdfModal,
  onExportExcel,
}) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 print:hidden">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
          <FileBarChart size={28} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800 tracking-tight">
            Manajemen Laporan
          </h2>
          <p className="text-gray-500 text-sm font-medium">
            Cetak hasil uji (LHU) dan export data laporan.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 print:hidden md:ml-auto w-full md:w-auto">
        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative group w-full md:w-44">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <ArrowUpDown size={16} />
            </div>
            <select
              className="w-full pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold text-gray-600 appearance-none cursor-pointer hover:bg-gray-50 transition-all shadow-sm"
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

          <div className="relative w-full md:w-72">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Cari Data Pasien..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <button
          onClick={fetchData}
          className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-all shadow-sm hidden md:block"
          title="Refresh Data"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
        {user?.role === "admin" && (
          <button
            onClick={handleForceBackup}
            className="w-full sm:w-auto bg-slate-700 text-white px-4 py-2.5 rounded-xl font-bold shadow-md shadow-slate-200 hover:bg-slate-800 hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
            title="Force Backup Database"
          >
            <CloudUpload size={18} /> Backup DB
          </button>
        )}

        <button
          onClick={() => setShowPdfModal(true)}
          className="w-full sm:w-auto bg-yellow-600 text-white px-4 py-2.5 rounded-xl font-bold shadow-md shadow-yellow-200 hover:bg-yellow-700 hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
          title="Download Rekap PDF"
        >
          <FileText size={18} /> Recap PDF
        </button>
        <button
          onClick={onExportExcel}
          className="w-full md:w-auto bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-green-200 hover:bg-green-700 hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
        >
          <Download size={18} /> Export Excel
        </button>
      </div>
    </div>
  );
}
