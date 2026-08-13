import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  FileText,
  TrendingUp,
  Users,
  CreditCard,
  Printer,
  Calendar,
  Inbox,
} from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import api from "../api/axios";

export default function FinanceDashboard() {
  const [financeData, setFinanceData] = useState(null);
  const [loading, setLoading] = useState(true);

  // State untuk filter
  const [period, setPeriod] = useState("this_month");

  // Fetch data setiap kali period berubah
  useEffect(() => {
    fetchFinanceData();
  }, [period]);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      // Mengirim parameter filter ke Backend
      const res = await api.get("/registrations/finance/dashboard", {
        params: { period },
      });
      if (res.data.success) {
        setFinanceData(res.data.data);
      }
    } catch (error) {
      console.error("Gagal mengambil data keuangan:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatIDR = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number || 0);
  };

  // BEST PRACTICE: Menggunakan SheetJS untuk export langsung ke format .xlsx
  const exportToExcel = async () => {
    if (!financeData?.recentData || financeData.recentData.length === 0) return;

    // 1. Inisialisasi Workbook dan Worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Laporan Keuangan");

    // 2. Definisikan Kolom dan Lebarnya (Auto-width layout)
    worksheet.columns = [
      { header: "No Registrasi", key: "no_reg", width: 20 },
      { header: "Tanggal", key: "tanggal", width: 15 },
      { header: "Nama Pasien", key: "nama_pasien", width: 30 },
      { header: "No Invoice", key: "no_invoice", width: 20 },
      { header: "Status", key: "status", width: 15 },
      { header: "Total Biaya (Rp)", key: "total_biaya", width: 20 },
    ];

    // Styling Header (Opsional tapi membuat hasil Excel lebih profesional)
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF3F4F6" }, // Warna background abu-abu muda
    };

    // 3. Masukkan Data ke dalam baris
    financeData.recentData.forEach((item) => {
      worksheet.addRow({
        no_reg: item.no_reg,
        tanggal: new Date(item.created_at).toLocaleDateString("id-ID"),
        nama_pasien: item.nama_pasien,
        no_invoice: item.no_invoice || "-",
        status: item.status_pembayaran,
        total_biaya: item.total_biaya,
      });
    });

    // 4. Generate File dan Trigger Download
    try {
      const buffer = await workbook.xlsx.writeBuffer();
      const fileName = `Laporan_Keuangan_${period}_${new Date()
        .toLocaleDateString("id-ID")
        .replaceAll('/', "-")}.xlsx`;

      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(blob, fileName);
    } catch (error) {
      console.error("Gagal men-generate file Excel:", error);
    }
  };

  const printPDF = () => {
    globalThis.print();
  };

  // Helper untuk menampilkan nama periode di cetakan PDF
  const getPeriodLabel = () => {
    const labels = {
      today: "Hari Ini",
      this_week: "Minggu Ini",
      this_month: "Bulan Ini",
      this_year: "Tahun Ini",
      all_time: "Semua Waktu",
    };
    return labels[period] || period;
  };

  if (loading && !financeData) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <div className="w-10 h-10 border-4 border-gray-100 border-t-cyan-500 rounded-full animate-spin"></div>
        <p className="text-sm text-gray-500">Memuat data keuangan...</p>
      </div>
    );
  }

  return (
    <div
      id="print-section"
      className="space-y-6 animate-fade-in print-container relative"
    >
      {/* HEADER & ACTIONS (Hidden on Print) */}
      <div className="print-hide flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Laporan Keuangan</h2>
          <p className="text-sm text-gray-500">
            Ringkasan pendapatan dan transaksi lab
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Filter Dropdown */}
          <div className="relative flex-grow lg:flex-grow-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar size={16} className="text-gray-400" />
            </div>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full lg:w-48 pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all cursor-pointer shadow-sm"
              disabled={loading}
            >
              <option value="today">Hari Ini</option>
              <option value="this_week">Minggu Ini</option>
              <option value="this_month">Bulan Ini</option>
              <option value="this_year">Tahun Ini</option>
              <option value="all_time">Semua Waktu</option>
            </select>
          </div>

          {/* Export Buttons */}
          <button
            onClick={exportToExcel}
            className="flex-1 lg:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100 rounded-lg font-medium text-sm transition-colors"
          >
            <FileText size={16} />{" "}
            <span className="hidden sm:inline">Export Excel</span>
          </button>
          <button
            onClick={printPDF}
            className="flex-1 lg:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-gray-800 text-white hover:bg-gray-900 shadow-sm shadow-gray-400/20 rounded-lg font-medium text-sm transition-colors"
          >
            <Printer size={16} />{" "}
            <span className="hidden sm:inline">Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* HEADER KHUSUS PRINT (Hidden on Screen, Visible on Print) */}
      <div className="hidden print-only-header mb-8 pb-4 border-b-2 border-gray-800">
        <h1 className="text-2xl font-bold text-black mb-1">
          Laporan Rincian Transaksi
        </h1>
        <div className="flex justify-between text-sm text-gray-600">
          <p>
            Periode: <strong>{getPeriodLabel()}</strong>
          </p>
          <p>
            Dicetak pada:{" "}
            {new Date().toLocaleDateString("id-ID", { dateStyle: "full" })}
          </p>
        </div>
      </div>

      {/* Loading Overlay saat filter diganti */}
      {loading && financeData && (
        <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-[1px] rounded-2xl print-hide"></div>
      )}

      {/* SUMMARY CARDS (Hidden on Print) */}
      <div className="print-hide grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200/50 relative overflow-hidden">
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <p className="text-cyan-100 text-sm font-medium mb-1">
                Total Pendapatan
              </p>
              <h3 className="text-3xl font-bold tracking-tight">
                {formatIDR(financeData?.summary?.total_revenue)}
              </h3>
            </div>
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <TrendingUp size={24} className="text-white" />
            </div>
          </div>
          <p className="text-xs text-cyan-50 mt-4 opacity-90 relative z-10">
            Berdasarkan filter: {getPeriodLabel()}
          </p>
          {/* Decorative background shape */}
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex justify-between items-start hover:shadow-md transition-shadow group">
          <div>
            <p className="text-gray-500 text-sm font-medium mb-1">
              Pasien Berbayar
            </p>
            <h3 className="text-3xl font-bold text-gray-800">
              {financeData?.summary?.paid_count || 0}{" "}
              <span className="text-sm font-normal text-gray-400">
                transaksi
              </span>
            </h3>
          </div>
          <div className="p-3 bg-emerald-50 group-hover:bg-emerald-100 transition-colors rounded-xl text-emerald-600">
            <CreditCard size={24} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex justify-between items-start hover:shadow-md transition-shadow group">
          <div>
            <p className="text-gray-500 text-sm font-medium mb-1">
              Total Pasien
            </p>
            <h3 className="text-3xl font-bold text-gray-800">
              {financeData?.summary?.total_transactions || 0}{" "}
              <span className="text-sm font-normal text-gray-400">pasien</span>
            </h3>
          </div>
          <div className="p-3 bg-purple-50 group-hover:bg-purple-100 transition-colors rounded-xl text-purple-600">
            <Users size={24} />
          </div>
        </div>
      </div>

      {/* CHART SECTION (Hidden on Print) */}
      <div className="print-hide bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-lg text-gray-800 mb-6">
          Grafik Pendapatan
        </h3>

        {financeData?.chartData?.length > 0 ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={financeData.chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={(tick) =>
                    new Date(tick).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                    })
                  }
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={20}
                />
                <YAxis
                  tickFormatter={(tick) => `Rp ${tick / 1000}k`}
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                />
                <Tooltip
                  formatter={(value) => formatIDR(value)}
                  labelFormatter={(label) =>
                    new Date(label).toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })
                  }
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 20px -2px rgb(0 0 0 / 0.1)",
                    fontWeight: "500",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#06b6d4"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  activeDot={{ r: 6, strokeWidth: 0, fill: "#0891b2" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          /* UX Improvement: Empty State Chart */
          <div className="h-72 w-full flex flex-col justify-center items-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
            <Inbox size={40} className="text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium text-sm">
              Belum ada data pendapatan
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Pilih periode waktu lain atau tunggu transaksi masuk.
            </p>
          </div>
        )}
      </div>

      {/* DATA TABLE (TETAP MUNCUL SAAT PRINT) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden print-table-container">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center print-hide">
          <h3 className="font-bold text-lg text-gray-800">
            Rincian Transaksi Terbaru
          </h3>
          <span className="text-xs font-medium px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg">
            {financeData?.recentData?.length || 0} Data
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-wider print:bg-gray-100 print:text-black">
                <th className="px-6 py-4 font-semibold print:py-2">
                  No Reg / Invoice
                </th>
                <th className="px-6 py-4 font-semibold print:py-2">Tanggal</th>
                <th className="px-6 py-4 font-semibold print:py-2">
                  Nama Pasien
                </th>
                <th className="px-6 py-4 font-semibold print:py-2 print:text-center">
                  Status
                </th>
                <th className="px-6 py-4 font-semibold text-right print:py-2">
                  Total Biaya
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 print:divide-gray-300">
              {financeData?.recentData?.length > 0 ? (
                financeData.recentData.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-50/50 transition-colors print:hover:bg-transparent"
                  >
                    <td className="px-6 py-4 print:py-2">
                      <div className="font-medium text-cyan-600 print:text-black">
                        {row.no_reg}
                      </div>
                      <div className="text-xs text-gray-400 print:text-gray-600">
                        {row.no_invoice || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 print:text-black print:py-2">
                      {new Date(row.created_at).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800 print:text-black print:py-2">
                      {row.nama_pasien}
                    </td>
                    <td className="px-6 py-4 print:py-2 print:text-center">
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-medium border print:border-none print:p-0 ${
                          row.status_pembayaran === "berbayar"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100 print:bg-transparent print:text-black"
                            : "bg-orange-50 text-orange-700 border-orange-100 print:bg-transparent print:text-black"
                        }`}
                      >
                        {row.status_pembayaran}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-800 text-right print:text-black print:py-2">
                      {formatIDR(row.total_biaya)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="p-3 bg-gray-50 rounded-full mb-3">
                        <FileText size={24} className="text-gray-400" />
                      </div>
                      <p className="text-gray-500 text-sm font-medium">
                        Belum ada transaksi di periode ini.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* STYLING CETAK PDF */}
      <style jsx>{`
        @media print {
          /* Matikan margin dan padding container utama agar mepet kertas rapi */
          .print-container {
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }

          /* SEMBUNYIKAN SEMUA KECUALI TABEL */
          .print-hide {
            display: none !important;
          }

          /* TAMPILKAN HEADER KHUSUS CETAK */
          .print-only-header {
            display: block !important;
          }

          /* STYLING TABEL KHUSUS CETAK */
          .print-table-container {
            border: none !important;
            box-shadow: none !important;
          }

          table {
            border: 1px solid #e5e7eb !important;
          }

          th,
          td {
            border-bottom: 1px solid #e5e7eb !important;
          }

          th {
            background-color: #f3f4f6 !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
