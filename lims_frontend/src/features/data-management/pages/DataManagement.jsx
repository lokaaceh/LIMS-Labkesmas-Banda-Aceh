import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import api from "../../../api/axios.js";
import { useAuth } from "../../../context/AuthContext";

// Komponen Internal
import HeaderControls from "../components/HeaderControls";
import DataTable from "../components/DataTable";
import PdfExportModal from "../components/PdfExportModal";

// Utils
import { exportToExcel, handleGeneratePDF } from "../utils/exportServices";

// Modals Eksternal
import LHUPrintTemplate from "../../../components/LHUPrintTemplate";
import ResultInputModal from "../../../components/ResultInputModal";
import UploadLhuModal from "../../../components/UploadLhuModal";

export default function DataManagementPage({ onRefreshStats }) {
  const { user } = useAuth();

  // STATE
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("newest");

  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfFilter, setPdfFilter] = useState({
    type: "month",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    parameter: "",
  });
  const [paramSearch, setParamSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [selectedForPrint, setSelectedForPrint] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [isEditingResult, setIsEditingResult] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedUploadData, setSelectedUploadData] = useState(null);
  const [masterParameters, setMasterParameters] = useState([]);

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
    const fetchMasterParameters = async () => {
      try {
        const res = await api.get("/master/parameters/list");
        if (res.data.success) {
          setMasterParameters(res.data.data);
        }
      } catch (err) {
        console.error("Gagal memuat daftar parameter master:", err);
      }
    };
    fetchMasterParameters();
  }, []);

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
      if (res.data.success) setData(res.data.data);
    } catch (error) {
      toast.error("Gagal memuat data laporan");
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  const availableParameters = useMemo(() => {
    const allParams = data
      .map((item) => item.jenis_pemeriksaan)
      .filter((param) => param != null && param !== "");
    return [...new Set(allParams)];
  }, [data]);

  const filteredDropdownOptions = useMemo(() => {
    return masterParameters.filter((param) =>
      param.toLowerCase().includes(paramSearch.toLowerCase()),
    );
  }, [masterParameters, paramSearch]);

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

  const availableYears = useMemo(() => {
    if (!data.length) return [new Date().getFullYear()];
    const years = data
      .map((item) => new Date(item.tgl_daftar || item.created_at).getFullYear())
      .filter((y) => !isNaN(y));
    const uniqueYears = [...new Set(years)].sort((a, b) => b - a);
    return uniqueYears.length ? uniqueYears : [new Date().getFullYear()];
  }, [data]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedData.slice(startIndex, startIndex + itemsPerPage);
  }, [processedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage) || 1;

  // HANDLERS (Database / API)
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
        render: res.data.message || "Proses backup berjalan.",
        type: "info",
        isLoading: false,
        autoClose: 5000,
      });
    } catch (error) {
      toast.update(toastId, {
        render: "Gagal memicu proses backup.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus data ini?")) {
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
        toast.update(toastId, {
          render: "Gagal menghapus",
          type: "error",
          isLoading: false,
          autoClose: 5000,
        });
      }
    }
  };

  const handleDeleteCustomLHU = async (id) => {
    if (window.confirm("Hapus dokumen Custom LHU ini?")) {
      const toastId = toast.loading("Menghapus dokumen...");
      try {
        await api.delete(`/registrations/${id}/custom-lhu`);
        toast.update(toastId, {
          render: "Dokumen Custom LHU berhasil dihapus",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
        fetchData();
      } catch (error) {
        toast.update(toastId, {
          render: "Gagal menghapus dokumen",
          type: "error",
          isLoading: false,
          autoClose: 4000,
        });
      }
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
        window.print();
      }, 800);
    } catch (e) {
      toast.update(toastId, {
        render: "Gagal memuat data print",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const getSafeLhuUrl = (rawLink) => {
    if (!rawLink) return "#";
    const match = rawLink.match(/(custom_lhu_[a-zA-Z0-9-]+\.[a-zA-Z0-9]+)/i);
    if (match && match[0]) {
      const fileName = match[0];
      const apiBase =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
      return `${apiBase}/public/download/${fileName}`;
    }
    return rawLink;
  };

  const refreshPreviewData = async () => {
    setIsEditingResult(false);
    toast.success("Data hasil berhasil diperbarui");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in p-2 md:p-0">
      <HeaderControls
        user={user}
        sortBy={sortBy}
        setSortBy={setSortBy}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        loading={loading}
        fetchData={fetchData}
        handleForceBackup={handleForceBackup}
        setShowPdfModal={setShowPdfModal}
        onExportExcel={() => exportToExcel(processedData, searchTerm)}
      />

      <DataTable
        loading={loading}
        paginatedData={paginatedData}
        processedDataLength={processedData.length}
        searchTerm={searchTerm}
        user={user}
        handlePrintLHU={handlePrintLHU}
        getSafeLhuUrl={getSafeLhuUrl}
        setSelectedUploadData={setSelectedUploadData}
        setUploadModalOpen={setUploadModalOpen}
        handleDeleteCustomLHU={handleDeleteCustomLHU}
        handleDelete={handleDelete}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
      />

      <PdfExportModal
        showPdfModal={showPdfModal}
        setShowPdfModal={setShowPdfModal}
        pdfFilter={pdfFilter}
        setPdfFilter={setPdfFilter}
        months={months}
        availableYears={availableYears}
        paramSearch={paramSearch}
        setParamSearch={setParamSearch}
        isDropdownOpen={isDropdownOpen}
        setIsDropdownOpen={setIsDropdownOpen}
        filteredDropdownOptions={filteredDropdownOptions}
        onGeneratePDF={() =>
          handleGeneratePDF(pdfFilter, processedData, searchTerm, months)
        }
      />

      {isEditingResult && previewData && (
        <ResultInputModal
          registrationId={previewData.id}
          noSampel={previewData.no_sampel_lab}
          onClose={refreshPreviewData}
        />
      )}

      {selectedForPrint && (
        <div
          id="print-section"
          className="hidden print:block absolute top-0 left-0 w-full h-auto min-h-screen bg-white z-[9999]"
        >
          <LHUPrintTemplate data={selectedForPrint} />
        </div>
      )}

      {uploadModalOpen && selectedUploadData && (
        <UploadLhuModal
          registrationId={selectedUploadData.id}
          noReg={selectedUploadData.no_reg}
          onClose={() => {
            setUploadModalOpen(false);
            setSelectedUploadData(null);
          }}
          onSuccess={() => {
            setUploadModalOpen(false);
            setSelectedUploadData(null);
            fetchData();
            if (onRefreshStats) onRefreshStats();
          }}
        />
      )}
    </div>
  );
}
