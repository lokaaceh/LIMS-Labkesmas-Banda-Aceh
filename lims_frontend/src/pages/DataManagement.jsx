// src/pages/DataManagement.jsx

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

import {
  FileBarChart,
  Printer,
  Download,
  Search,
  Calendar,
  Pencil,
  Trash2,
  ArrowUpDown,
  ListFilter,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  User,
  ArrowRight,
  Microscope,
  CheckCircle2,
  FileText,
  CloudUpload,
  UploadCloud,
  DownloadCloud,
  X, // <-- Icon tambahan untuk tutup modal
} from "lucide-react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

import { toast } from "react-toastify";
import LHUPrintTemplate from "../components/LHUPrintTemplate";
import ResultInputModal from "../components/ResultInputModal";
import UploadLhuModal from "../components/UploadLhuModal";
import { useAuth } from "../context/AuthContext";

export default function DataManagement({ onRefreshStats }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  // --- EXISTING STATE ---
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedForPrint, setSelectedForPrint] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [isEditingResult, setIsEditingResult] = useState(false);

  // --- NEW STATE FOR SORTING & PAGINATION (UI CONTROL) ---
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("newest");

  // --- NEW STATE FOR PDF FILTER MODAL ---
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfFilter, setPdfFilter] = useState({
    type: "month", // 'all', 'month', 'year'
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  // --- NEW STATE FOR UPLOAD LHU MODAL ---
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedUploadData, setSelectedUploadData] = useState(null);

  const months = [
    { value: 1, label: "Januari" },
    { value: 2, label: "Februari" },
    { value: 3, label: "Maret" },
    { value: 4, label: "April" },
    { value: 5, label: "Mei" },
    { value: 6, label: "Juni" },
    { value: 7, label: "Juli" },
    { value: 8, label: "Agustus" },
    { value: 9, label: "September" },
    { value: 10, label: "Oktober" },
    { value: 11, label: "November" },
    { value: 12, label: "Desember" },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/registrations");
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Gagal memuat data laporan");
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  const processedData = useMemo(() => {
    let filtered = data.filter(
      (item) =>
        (item.nama_pasien || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (item.no_reg || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.no_sampel_lab || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()),
    );

    filtered.sort((a, b) => {
      if (sortBy === "newest")
        return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === "oldest")
        return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === "name_asc")
        return a.nama_pasien.localeCompare(b.nama_pasien);
      return 0;
    });

    return filtered;
  }, [data, searchTerm, sortBy]);

  // Generate daftar tahun dinamis dari data registrasi yang ada
  const availableYears = useMemo(() => {
    if (!data.length) return [new Date().getFullYear()];
    const years = data
      .map((item) => new Date(item.tgl_daftar || item.created_at).getFullYear())
      .filter((y) => !isNaN(y));
    const uniqueYears = [...new Set(years)].sort((a, b) => b - a); // Urut dari terbaru
    return uniqueYears.length ? uniqueYears : [new Date().getFullYear()];
  }, [data]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedData.slice(startIndex, startIndex + itemsPerPage);
  }, [processedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage) || 1;

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

  const refreshPreviewData = async () => {
    if (!previewData) return;
    setIsEditingResult(false);
    await handleOpenPreview(previewData.id);
    toast.success("Data hasil berhasil diperbarui");
  };

  const handleForceBackup = async () => {
    if (
      !window.confirm(
        "Jalankan backup database manual sekarang? Proses ini akan berjalan di latar belakang.",
      )
    )
      return;

    const toastId = toast.loading("Memulai proses backup database...");
    try {
      const res = await api.get("/admin/force-backup");

      toast.update(toastId, {
        render:
          res.data.message ||
          "Proses backup manual sedang dijalankan di latar belakang.",
        type: "info",
        isLoading: false,
        autoClose: 5000,
      });
    } catch (error) {
      console.error("Error triggering backup:", error);
      toast.update(toastId, {
        render: "Gagal memicu proses backup.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const handleDelete = async (id) => {
    if (
      globalThis.confirm(
        "Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak bisa dibatalkan.",
      )
    ) {
      const toastId = toast.loading("Menghapus data...");
      try {
        await api.delete(`/registrations/${id}`);
        toast.update(toastId, {
          render: "Data berhasil dihapus.",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
        fetchData();
        if (onRefreshStats) onRefreshStats();
      } catch (error) {
        console.error("Error deleting registration:", error);
        toast.update(toastId, {
          render: `Gagal menghapus: ${error.response?.data?.message || error.message}`,
          type: "error",
          isLoading: false,
          autoClose: 5000,
        });
      }
    }
  };

  const exportToExcel = async () => {
    if (processedData.length === 0) {
      toast.warn("Tidak ada data untuk diexport");
      return;
    }

    const toastId = toast.loading("Menyiapkan format laporan yang rapi...");
    try {
      const enrichedData = await Promise.all(
        processedData.map(async (item) => {
          try {
            const res = await api.get(`/registrations/${item.id}/tests`);
            const testsData = res.data.success ? res.data.data : [];
            return { ...item, tests: testsData };
          } catch (err) {
            return item;
          }
        }),
      );

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Laporan LIMS", {
        views: [{ showGridLines: true }],
      });

      const exportDate = new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const exportTime = new Date().toLocaleTimeString("id-ID");

      let totalUji = 0;
      enrichedData.forEach((item) => {
        totalUji += item.tests && item.tests.length > 0 ? item.tests.length : 1;
      });

      worksheet.addRow(["LAPORAN DATA PEMERIKSAAN LABORATORIUM (LIMS)"]);
      worksheet.addRow(["BALAI LABORATORIUM KESEHATAN MASYARAKAT BANDA ACEH"]);
      worksheet.addRow([""]);
      worksheet.addRow([
        "Tanggal Export:",
        `${exportDate} Pukul ${exportTime}`,
      ]);
      worksheet.addRow([
        "Total Data:",
        `${enrichedData.length} Pasien (${totalUji} Baris Uji)`,
      ]);
      worksheet.addRow([
        "Filter Pencarian:",
        searchTerm ? `'${searchTerm}'` : "Semua Data",
      ]);
      worksheet.addRow([""]);

      worksheet.mergeCells("A1:R1");
      worksheet.mergeCells("A2:R2");
      worksheet.getCell("A1").font = { bold: true, size: 14 };
      worksheet.getCell("A2").font = { bold: true, size: 12 };
      worksheet.getCell("A1").alignment = { horizontal: "center" };
      worksheet.getCell("A2").alignment = { horizontal: "center" };

      const headers = [
        "No",
        "No. Registrasi",
        "No. Sampel",
        "Tanggal Daftar",
        "Nama Pasien",
        "NIK",
        "JK",
        "Umur",
        "Alamat",
        "Pengirim",
        "Asal Sampel",
        "Status",
        "Catatan",
        "Parameter Uji",
        "Hasil",
        "Satuan",
        "Nilai Rujukan",
        "Metode",
      ];

      const headerRow = worksheet.addRow(headers);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF3F4F6" },
      };
      headerRow.alignment = { vertical: "middle", horizontal: "center" };

      enrichedData.forEach((item, index) => {
        const tests = item.tests && item.tests.length > 0 ? item.tests : [];
        const rowSpan = tests.length > 0 ? tests.length : 1;
        const startRow = worksheet.rowCount + 1;

        const patientInfo = [
          index + 1,
          item.no_reg,
          item.no_sampel_lab || "-",
          new Date(item.tgl_daftar).toLocaleDateString("id-ID"),
          item.nama_pasien,
          item.nik ? `'${item.nik}` : "-",
          item.jenis_kelamin,
          `${item.umur} Th`,
          item.alamat || "-",
          item.pengirim_instansi || "Mandiri",
          item.asal_sampel,
          item.status.replace("_", " ").toUpperCase(),
          item.catatan_tambahan || "-",
        ];

        if (tests.length > 0) {
          tests.forEach((tes, testIndex) => {
            const rowData = [
              ...(testIndex === 0 ? patientInfo : Array(13).fill("")),
              tes.nama_pemeriksaan || tes.parameter_name,
              tes.nilai || tes.result || "Belum ada",
              tes.satuan || "-",
              tes.nilai_rujukan || "-",
              tes.metode || "-",
            ];
            worksheet.addRow(rowData);
          });
        } else {
          worksheet.addRow([
            ...patientInfo,
            item.jenis_pemeriksaan,
            "-",
            "-",
            "-",
            "-",
          ]);
        }

        if (rowSpan > 1) {
          const endRow = startRow + rowSpan - 1;
          for (let col = 1; col <= 13; col++) {
            worksheet.mergeCells(startRow, col, endRow, col);
            worksheet.getCell(startRow, col).alignment = { vertical: "top" };
          }
        } else {
          for (let col = 1; col <= 13; col++) {
            worksheet.getCell(startRow, col).alignment = { vertical: "top" };
          }
        }
      });

      worksheet.columns.forEach((column) => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell, rowNumber) => {
          if (rowNumber >= 8) {
            const columnLength = cell.value ? cell.value.toString().length : 10;
            if (columnLength > maxLength) maxLength = columnLength;
          }
        });
        column.width = maxLength < 10 ? 10 : maxLength + 2;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const fileName = `Laporan_LIMS_Clean_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;

      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(blob, fileName);

      toast.dismiss(toastId);
      toast.success("Laporan Excel berhasil didownload");
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.dismiss(toastId);
      toast.error("Gagal melakukan export data Excel");
    }
  };

  const handleGeneratePDF = async () => {
    setShowPdfModal(false); // Tutup modal saat proses mulai

    // 1. Filter data berdasarkan pilihan modal
    let filteredForExport = processedData;

    if (pdfFilter.type === "month") {
      filteredForExport = filteredForExport.filter((item) => {
        const date = new Date(item.tgl_daftar || item.created_at);
        return (
          date.getMonth() + 1 === pdfFilter.month &&
          date.getFullYear() === pdfFilter.year
        );
      });
    } else if (pdfFilter.type === "year") {
      filteredForExport = filteredForExport.filter((item) => {
        const date = new Date(item.tgl_daftar || item.created_at);
        return date.getFullYear() === pdfFilter.year;
      });
    }

    if (filteredForExport.length === 0) {
      toast.warn("Tidak ada data pada periode yang dipilih");
      return;
    }

    const toastId = toast.loading("Menyiapkan dokumen PDF...");
    try {
      const enrichedData = await Promise.all(
        filteredForExport.map(async (item) => {
          try {
            const res = await api.get(`/registrations/${item.id}/tests`);
            const testsData = res.data.success ? res.data.data : [];
            return { ...item, tests: testsData };
          } catch (err) {
            return { ...item, tests: [] };
          }
        }),
      );

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const exportDate = new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // --- HEADER SECTION ---
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(
        "REKAPITULASI DATA PEMERIKSAAN LABORATORIUM",
        doc.internal.pageSize.width / 2,
        15,
        { align: "center" },
      );

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(
        "Balai Laboratorium Kesehatan Masyarakat Banda Aceh",
        doc.internal.pageSize.width / 2,
        21,
        { align: "center" },
      );

      // Dinamiskan Label Periode
      let periodeText = "Semua Waktu";
      if (pdfFilter.type === "month") {
        const monthLabel = months.find(
          (m) => m.value === pdfFilter.month,
        )?.label;
        periodeText = `Bulan ${monthLabel} ${pdfFilter.year}`;
      } else if (pdfFilter.type === "year") {
        periodeText = `Tahun ${pdfFilter.year}`;
      }

      // --- INFO METADATA ---
      doc.setFontSize(9);
      doc.text(`Tanggal Export: ${exportDate}`, 10, 30);
      doc.text(`Periode Data: ${periodeText}`, 10, 35);
      doc.text(`Total Data: ${enrichedData.length} Pasien`, 10, 40);
      if (searchTerm) {
        doc.text(`Filter Pencarian: "${searchTerm}"`, 10, 45);
      }

      // --- PREPARE DATA ---
      const tableColumn = [
        "No",
        "No. Registrasi",
        "Tgl Daftar",
        "Nama Pasien",
        "Asal Sampel",
        "Pengirim",
        "Parameter Uji",
        "Status",
      ];

      const tableRows = [];

      enrichedData.forEach((item, index) => {
        const parameterUji =
          item.tests && item.tests.length > 0
            ? item.tests
                .map(
                  (t) =>
                    t.nama_pemeriksaan || t.parameter_name || "Tidak diketahui",
                )
                .join(", ")
            : "Belum ada uji";

        const rowData = [
          index + 1,
          item.no_reg || "-",
          item.tgl_daftar
            ? new Date(item.tgl_daftar).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })
            : "-",
          item.nama_pasien || "-",
          item.asal_sampel || "-",
          item.pengirim_instansi || "Mandiri",
          parameterUji,
          (item.status || "Belum ada").replace("_", " ").toUpperCase(),
        ];
        tableRows.push(rowData);
      });

      // --- RENDER TABLE ---
      const startY = searchTerm ? 49 : 44; // Sesuaikan agar tidak nabrak text di atas

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: startY,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: {
          fillColor: [37, 99, 235],
          textColor: 255,
          fontStyle: "bold",
          halign: "center",
        },
        alternateRowStyles: { fillColor: [243, 244, 246] },
        columnStyles: {
          0: { cellWidth: 8, halign: "center" },
          1: { cellWidth: 24 },
          2: { cellWidth: 16, halign: "center" },
          3: { cellWidth: 28 },
          4: { cellWidth: 16 },
          5: { cellWidth: 24 },
          6: { cellWidth: "auto" },
          7: { cellWidth: 22, halign: "center", fontStyle: "bold" },
        },
        margin: { top: 15, left: 10, right: 10 },
        didDrawPage: function (data) {
          let str = "Halaman " + doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.text(
            str,
            data.settings.margin.left,
            doc.internal.pageSize.height - 10,
          );
        },
      });

      const fileName = `Recap_LIMS_${periodeText.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);

      toast.update(toastId, {
        render: "Laporan PDF berhasil didownload",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.update(toastId, {
        render: "Gagal men-generate laporan PDF",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const handlePrintLHU = async (id) => {
    const toastId = toast.loading("Menyiapkan dokumen...");
    try {
      const res = await api.get(`/registrations/${id}`);
      const regData = res.data.data;
      const testRes = await api.get(`/registrations/${id}/tests`);
      regData.tests = testRes.data.data;

      if (!regData.tests || regData.tests.length === 0) {
        toast.update(toastId, {
          render: "Belum ada hasil uji untuk dicetak",
          type: "warning",
          isLoading: false,
          autoClose: 3000,
        });
        return;
      }
      setSelectedForPrint(regData);
      setTimeout(() => {
        toast.dismiss(toastId);
        globalThis.print();
      }, 800);
    } catch (e) {
      console.error("Error saat print LHU:", e);
      toast.update(toastId, {
        render: "Gagal memuat data print",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

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

  const handleDeleteCustomLHU = async (id) => {
    if (
      globalThis.confirm(
        "Hapus dokumen Custom LHU ini? Sistem akan kembali menggunakan LHU Auto-generate.",
      )
    ) {
      const toastId = toast.loading("Menghapus dokumen...");
      try {
        await api.delete(`/registrations/${id}/custom-lhu`);
        toast.update(toastId, {
          render: "Dokumen Custom LHU berhasil dihapus",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
        fetchData(); // Refresh tabel
      } catch (error) {
        console.error("Error deleting custom LHU:", error);
        toast.update(toastId, {
          render: error.response?.data?.message || "Gagal menghapus dokumen",
          type: "error",
          isLoading: false,
          autoClose: 4000,
        });
      }
    }
  };

   const getSafeLhuUrl = (rawLink) => {
    if (!rawLink) return "#";

    // Mengekstrak HANYA nama file PDF/DOC/XLS
    const match = rawLink.match(/(custom_lhu_[a-zA-Z0-9-]+\.[a-zA-Z0-9]+)/i);

    if (match && match[0]) {
      const fileName = match[0];
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
      
      // Menggunakan rute API agar bypass masalah routing Nginx untuk file statis
      return `${apiBase}/public/download/${fileName}`;
    }

    return rawLink;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in p-2 md:p-0">
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 print:hidden">
        {/* BAGIAN KIRI */}
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

        {/* --- CONTROLS & FILTER --- */}
        <div className="flex flex-col md:flex-row items-center gap-4 print:hidden md:ml-auto w-full md:w-auto">
          {/* Left: Search & Sort */}
          <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
            {/* SORTING */}
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

            {/* SEARCH */}
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

          {/* Right: Refresh */}
          <button
            onClick={fetchData}
            className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-all shadow-sm hidden md:block"
            title="Refresh Data"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Action Button (Export & Backup) */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* TOMBOL BACKUP - HANYA ADMIN */}
          {user?.role === "admin" && (
            <button
              onClick={handleForceBackup}
              className="w-full sm:w-auto bg-slate-700 text-white px-4 py-2.5 rounded-xl font-bold shadow-md shadow-slate-200 hover:bg-slate-800 hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
              title="Force Backup Database ke Google Drive"
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
            onClick={exportToExcel}
            className="w-full md:w-auto bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-green-200 hover:bg-green-700 hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Download size={18} /> Export Excel
          </button>
        </div>
      </div>

      {/* --- TABLE CARD --- */}
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
                    {/* Kolom 1: Pasien */}
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

                    {/* Kolom 2: Detail Lab */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-gray-700 text-xs font-semibold">
                          <Microscope size={14} className="text-blue-500" />
                          ID Lab:{" "}
                          <span className="font-mono">
                            {item.no_sampel_lab || "-"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-400 text-[11px]">
                          <Calendar size={12} />
                          {new Date(item.created_at).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Kolom 3: Status */}
                    <td className="px-6 py-4">
                      <StatusBadge status={item.status} />
                    </td>

                    {/* Kolom 4: Aksi */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2 items-center">
                        {item.status === "selesai" ? (
                          <>
                            {/* Tombol Print (Auto-generate LHU bawaan sistem) */}
                            <button
                              onClick={() => handlePrintLHU(item.id)}
                              className="bg-purple-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold hover:bg-purple-700 flex items-center gap-1.5 shadow-md shadow-purple-100 transition-all"
                              title="Cetak Auto Template LHU"
                            >
                              <Printer size={14} /> Cetak
                            </button>

                            {/* Logika Custom LHU Action Group */}
                            {item.link_hasil &&
                            item.link_hasil.includes("custom_lhu_") ? (
                              <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 p-0.5 rounded-lg ml-1">
                                <a
                                  href={getSafeLhuUrl(item.link_hasil)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-md transition-all"
                                  title="Lihat Custom LHU"
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
                                  title="Ganti Dokumen (Upload Ulang)"
                                >
                                  <UploadCloud size={14} />
                                </button>
                                <div className="w-px h-4 bg-emerald-200"></div>
                                <button
                                  onClick={() => handleDeleteCustomLHU(item.id)}
                                  className="p-1.5 text-red-600 hover:bg-red-600 hover:text-white rounded-md transition-all"
                                  title="Hapus Dokumen"
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
                                title="Upload LHU Dokumen Custom"
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

                        {/* Tombol Edit & Hapus (Untuk Admin/Manajemen) */}
                        {(user?.role === "manajemen" ||
                          user?.role === "admin") && (
                          // ... Biarkan bagian Edit/Delete ini tetap sama seperti kode Anda sebelumnya ...
                          <div className="flex gap-1 ml-2 pl-2 border-l border-gray-200">
                            <button
                              onClick={() =>
                                navigate(`/registrations/edit/${item.id}`, {
                                  state: { restrictItems: true },
                                })
                              }
                              className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                              title="Edit Data Pasien"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 transition-colors"
                              title="Hapus Data"
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

        {/* --- FOOTER INFO & PAGINATION --- */}
        {!loading && processedData.length > 0 && (
          <div className="bg-gray-50/50 px-6 py-4 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold text-gray-500">
            {/* Left: Total & Rows Per Page */}
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

            {/* Right: Pagination Controls */}
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

        {!loading && (
          <div className="bg-gray-50 px-6 py-2 border-t border-gray-200 text-[10px] text-gray-400 font-bold flex justify-end items-center gap-1 print:hidden">
            Sistem LIMS <ArrowRight size={10} /> Manajemen Data
          </div>
        )}
      </div>

      {/* --- MODAL EDIT HASIL --- */}
      {isEditingResult && previewData && (
        <ResultInputModal
          registrationId={previewData.id}
          noSampel={previewData.no_sampel_lab}
          onClose={refreshPreviewData}
        />
      )}

      {/* Component Cetak Hidden */}
      {selectedForPrint && (
        <div
          id="print-section"
          className="hidden print:block absolute top-0 left-0 w-full h-auto min-h-screen bg-white z-[9999]"
        >
          <LHUPrintTemplate data={selectedForPrint} />
        </div>
      )}

      {/* --- MODAL FILTER PDF --- */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in print:hidden">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <FileText size={18} className="text-yellow-600" />
                Pengaturan Rekap PDF
              </h3>
              <button
                onClick={() => setShowPdfModal(false)}
                className="p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body Modal */}
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-3">
                  Tipe Rekapitulasi
                </label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-blue-50 transition-colors">
                    <input
                      type="radio"
                      name="pdfType"
                      value="month"
                      checked={pdfFilter.type === "month"}
                      onChange={() =>
                        setPdfFilter({ ...pdfFilter, type: "month" })
                      }
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-semibold text-gray-700">
                      Per Bulan & Tahun
                    </span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-blue-50 transition-colors">
                    <input
                      type="radio"
                      name="pdfType"
                      value="year"
                      checked={pdfFilter.type === "year"}
                      onChange={() =>
                        setPdfFilter({ ...pdfFilter, type: "year" })
                      }
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-semibold text-gray-700">
                      Per Tahun
                    </span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-blue-50 transition-colors">
                    <input
                      type="radio"
                      name="pdfType"
                      value="all"
                      checked={pdfFilter.type === "all"}
                      onChange={() =>
                        setPdfFilter({ ...pdfFilter, type: "all" })
                      }
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-semibold text-gray-700">
                      Semua Waktu (All Time)
                    </span>
                  </label>
                </div>
              </div>

              {/* Dynamic Selectors */}
              {pdfFilter.type !== "all" && (
                <div className="flex gap-3 animate-fade-in">
                  {pdfFilter.type === "month" && (
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                        Bulan
                      </label>
                      <select
                        value={pdfFilter.month}
                        onChange={(e) =>
                          setPdfFilter({
                            ...pdfFilter,
                            month: Number(e.target.value),
                          })
                        }
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
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
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                      Tahun
                    </label>
                    <select
                      value={pdfFilter.year}
                      onChange={(e) =>
                        setPdfFilter({
                          ...pdfFilter,
                          year: Number(e.target.value),
                        })
                      }
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
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

            {/* Footer Modal */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowPdfModal(false)}
                className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleGeneratePDF}
                className="px-5 py-2 bg-yellow-600 text-white text-sm font-bold rounded-xl shadow-md shadow-yellow-200 hover:bg-yellow-700 hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Download size={16} /> Export Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
      {/* --- MODAL UPLOAD CUSTOM LHU --- */}
      {uploadModalOpen && selectedUploadData && (
        <UploadLhuModal
          registrationId={selectedUploadData.id}
          noReg={selectedUploadData.no_reg}
          onClose={() => {
            setUploadModalOpen(false);
            setSelectedUploadData(null);
          }}
          onSuccess={(newLink) => {
            setUploadModalOpen(false);
            setSelectedUploadData(null);
            fetchData(); // Refresh tabel setelah upload sukses
            if (onRefreshStats) onRefreshStats();
          }}
        />
      )}
    </div>
  );
}
