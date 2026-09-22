import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { toast } from "react-toastify";
import api from "../../../api/axios";

export const exportToExcel = async (processedData, searchTerm) => {
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
    worksheet.addRow(["Tanggal Export:", `${exportDate} Pukul ${exportTime}`]);
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
        item.pengirim_instansi || "-",
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
    const fileName = `Laporan_LIMS_Clean_${new Date().toISOString().slice(0, 10)}.xlsx`;
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

export const handleGeneratePDF = async (
  pdfFilter,
  processedData,
  searchTerm,
  months,
) => {
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

  if (pdfFilter.parameter) {
    const selectedParam = pdfFilter.parameter.toLowerCase().trim();
    filteredForExport = filteredForExport.filter((item) => {
      // Cek parameter tunggal dan paket
      const matchInTests =
        item.tests &&
        item.tests.some(
          (t) =>
            (t.parameter_name &&
              t.parameter_name.toLowerCase().includes(selectedParam)) ||
            (t.nama_pemeriksaan &&
              t.nama_pemeriksaan.toLowerCase().includes(selectedParam)),
        );

      // Cek cadangan pada nama jenis pemeriksaan utama
      const matchInJenisPemeriksaan =
        item.jenis_pemeriksaan &&
        item.jenis_pemeriksaan.toLowerCase().includes(selectedParam);

      return matchInTests || matchInJenisPemeriksaan;
    });
  }

  if (filteredForExport.length === 0) {
    toast.warn("Tidak ada data pada periode dan parameter yang dipilih");
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

    let periodeText = "Semua Waktu";
    if (pdfFilter.type === "month") {
      const monthLabel = months.find((m) => m.value === pdfFilter.month)?.label;
      periodeText = `Bulan ${monthLabel} ${pdfFilter.year}`;
    } else if (pdfFilter.type === "year") {
      periodeText = `Tahun ${pdfFilter.year}`;
    }

    doc.setFontSize(9);
    doc.text(`Tanggal Export: ${exportDate}`, 10, 30);
    doc.text(`Periode Data: ${periodeText}`, 10, 35);
    doc.text(`Total Data: ${enrichedData.length} Pasien`, 10, 40);
    if (searchTerm) doc.text(`Filter Pencarian: "${searchTerm}"`, 10, 45);

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
        item.pengirim_instansi || "-",
        parameterUji,
        (item.status || "Belum ada").replace("_", " ").toUpperCase(),
      ];
      tableRows.push(rowData);
    });

    const startY = searchTerm ? 49 : 44;
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
