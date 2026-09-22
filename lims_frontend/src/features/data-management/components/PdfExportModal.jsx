import React from "react";
import { FileText, X, Search, Download, Filter } from "lucide-react";

export default function PdfExportModal({
  showPdfModal,
  setShowPdfModal,
  pdfFilter,
  setPdfFilter,
  months,
  availableYears,
  paramSearch,
  setParamSearch,
  isDropdownOpen,
  setIsDropdownOpen,
  filteredDropdownOptions, 
  onGeneratePDF,
}) {
  if (!showPdfModal) return null;

  const handleExport = () => {
    setShowPdfModal(false);
    onGeneratePDF();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in print:hidden">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col animate-slide-up">
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <FileText size={18} className="text-yellow-600" /> Pengaturan Rekap
            PDF
          </h3>
          <button
            onClick={() => setShowPdfModal(false)}
            className="p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-6">
          {/* FILTER PARAMETER UJI (Paling Atas) */}
          <div className="relative z-20">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1.5">
              <Filter size={14} className="text-blue-500" /> Filter Parameter
              Uji
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Cari parameter (misal: Narkoba...)"
                value={paramSearch}
                onChange={(e) => {
                  setParamSearch(e.target.value);
                  setIsDropdownOpen(true);
                  if (pdfFilter.parameter)
                    setPdfFilter({ ...pdfFilter, parameter: "" });
                }}
                onFocus={() => setIsDropdownOpen(true)}
                onBlur={() => setIsDropdownOpen(false)} // Menutup dropdown saat klik di luar
                className="w-full p-2.5 pl-10 pr-10 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
              />
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              {/* Tombol Clear (X) */}
              {paramSearch && (
                <button
                  onMouseDown={(e) => {
                    e.preventDefault(); // Mencegah onBlur input berjalan duluan
                    setParamSearch("");
                    setPdfFilter({ ...pdfFilter, parameter: "" });
                    setIsDropdownOpen(true); // Tetap buka dropdown setelah di-clear
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                  title="Hapus filter parameter"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Dropdown Options (Langsung muncul saat fokus) */}
            {isDropdownOpen && (
              <ul className="absolute z-30 w-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto animate-fade-in divide-y divide-gray-50">
                {filteredDropdownOptions.length > 0 ? (
                  filteredDropdownOptions.map((param, index) => (
                    <li
                      key={index}
                      onMouseDown={(e) => {
                        e.preventDefault(); // Wajib agar tidak terpotong oleh onBlur
                        setPdfFilter({ ...pdfFilter, parameter: param });
                        setParamSearch(param);
                        setIsDropdownOpen(false);
                      }}
                      className="px-4 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-colors flex items-center gap-2"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></div>
                      <span className="truncate">{param}</span>
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-4 text-sm text-gray-400 italic text-center bg-gray-50/50 rounded-xl">
                    Parameter tidak ditemukan pada data saat ini.
                  </li>
                )}
              </ul>
            )}
          </div>

          <div className="h-px w-full bg-gray-100"></div>

          {/* 2. TIPE REKAPITULASI WAKTU */}
          <div className="relative z-10">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-3">
              Tipe Waktu Laporan
            </label>
            <div className="flex flex-col gap-2.5">
              <label
                className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${pdfFilter.type === "month" ? "border-blue-500 bg-blue-50/50 shadow-sm" : "border-gray-200 hover:bg-gray-50"}`}
              >
                <input
                  type="radio"
                  name="pdfType"
                  value="month"
                  checked={pdfFilter.type === "month"}
                  onChange={() => setPdfFilter({ ...pdfFilter, type: "month" })}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span
                  className={`text-sm font-semibold ${pdfFilter.type === "month" ? "text-blue-700" : "text-gray-700"}`}
                >
                  Per Bulan & Tahun
                </span>
              </label>

              <label
                className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${pdfFilter.type === "year" ? "border-blue-500 bg-blue-50/50 shadow-sm" : "border-gray-200 hover:bg-gray-50"}`}
              >
                <input
                  type="radio"
                  name="pdfType"
                  value="year"
                  checked={pdfFilter.type === "year"}
                  onChange={() => setPdfFilter({ ...pdfFilter, type: "year" })}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span
                  className={`text-sm font-semibold ${pdfFilter.type === "year" ? "text-blue-700" : "text-gray-700"}`}
                >
                  Per Tahun Saja
                </span>
              </label>

              <label
                className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${pdfFilter.type === "all" ? "border-blue-500 bg-blue-50/50 shadow-sm" : "border-gray-200 hover:bg-gray-50"}`}
              >
                <input
                  type="radio"
                  name="pdfType"
                  value="all"
                  checked={pdfFilter.type === "all"}
                  onChange={() => setPdfFilter({ ...pdfFilter, type: "all" })}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span
                  className={`text-sm font-semibold ${pdfFilter.type === "all" ? "text-blue-700" : "text-gray-700"}`}
                >
                  Semua Waktu (All Time)
                </span>
              </label>
            </div>
          </div>

          {/* 3. DYNAMIC SELECTORS (BULAN / TAHUN) */}
          {pdfFilter.type !== "all" && (
            <div className="flex gap-3 animate-fade-in pt-1">
              {pdfFilter.type === "month" && (
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                    Pilih Bulan
                  </label>
                  <select
                    value={pdfFilter.month}
                    onChange={(e) =>
                      setPdfFilter({
                        ...pdfFilter,
                        month: Number(e.target.value),
                      })
                    }
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm cursor-pointer"
                  >
                    {months.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  Pilih Tahun
                </label>
                <select
                  value={pdfFilter.year}
                  onChange={(e) =>
                    setPdfFilter({ ...pdfFilter, year: Number(e.target.value) })
                  }
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm cursor-pointer"
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 rounded-b-2xl mt-auto">
          <button
            onClick={() => setShowPdfModal(false)}
            className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleExport}
            className="px-5 py-2 bg-yellow-600 text-white text-sm font-bold rounded-xl shadow-md shadow-yellow-200 hover:bg-yellow-700 hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Download size={16} /> Export PDF
          </button>
        </div>
      </div>
    </div>
  );
}
