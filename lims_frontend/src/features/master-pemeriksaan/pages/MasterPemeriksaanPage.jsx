// komponen halaman utama

import React, { useState, useEffect, useMemo } from "react";
import api from "../../../api/axios.js";
import { toast } from "react-toastify";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Database,
  Loader2,
  Scale,
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  FileText,
  Package,
  AlertCircle,
  Settings,
} from "lucide-react";

import { expandConfig } from "../utils/referenceConfig.js";
import InstalasiModal from "../components/InstalasiModal";
import PemeriksaanModal from "../components/PemeriksaanModal";

export default function MasterPemeriksaan() {
  const [data, setData] = useState([]);
  const [instalasiList, setInstalasiList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInstalasiFilter, setSelectedInstalasiFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({
    key: "nama_pemeriksaan",
    direction: "asc",
  });

  // Modal Pemeriksaan State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Modal Instalasi State
  const [showInstalasiModal, setShowInstalasiModal] = useState(false);
  const [isEditingInstalasi, setIsEditingInstalasi] = useState(false);
  const [instalasiSubmitLoading, setInstalasiSubmitLoading] = useState(false);
  const [instalasiForm, setInstalasiForm] = useState({
    id: null,
    kode_instalasi: "",
    nama_instalasi: "",
    kode_sampel: "",
  });

  const [formData, setFormData] = useState({
    id: null,
    tipe: "tunggal",
    instalasi_id: "",
    kategori: "",
    nama_pemeriksaan: "",
    harga: "",
    satuan: "",
    nilai_rujukan: "",
    deskripsi_rujukan: "",
    metode: "",
  });

  const [parameters, setParameters] = useState([]);

  useEffect(() => {
    fetchData();
    fetchInstalasi();
  }, []);

  const fetchInstalasi = async () => {
    try {
      const res = await api.get("/master/instalasi");
      if (res.data.success) setInstalasiList(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/master/pemeriksaan");
      if (res.data.success) setData(res.data.data);
    } catch (error) {
      toast.error("Gagal mengambil data pemeriksaan");
    } finally {
      setLoading(false);
    }
  };

  const activeInstalasiFilters = useMemo(() => {
    const activeIds = [
      ...new Set(data.map((item) => item.instalasi_id).filter(Boolean)),
    ];
    let filters = activeIds
      .map((id) => instalasiList.find((i) => i.id === id))
      .filter(Boolean);
    filters.sort((a, b) => {
      if (!a.kode_sampel) return 1;
      if (!b.kode_sampel) return -1;
      return a.kode_sampel.localeCompare(b.kode_sampel, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });
    return filters;
  }, [data, instalasiList]);

  const categoriesList = useMemo(
    () => [...new Set(data.map((item) => item.kategori).filter(Boolean))],
    [data],
  );

  const processedData = useMemo(() => {
    let filtered = data;
    if (selectedInstalasiFilter !== "")
      filtered = filtered.filter(
        (item) => item.instalasi_id === selectedInstalasiFilter,
      );
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.nama_pemeriksaan.toLowerCase().includes(lowerTerm) ||
          item.kategori.toLowerCase().includes(lowerTerm) ||
          (item.nama_instalasi &&
            item.nama_instalasi.toLowerCase().includes(lowerTerm)) ||
          (item.metode && item.metode.toLowerCase().includes(lowerTerm)),
      );
    }
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const valA = a[sortConfig.key] || "";
        const valB = b[sortConfig.key] || "";
        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [data, selectedInstalasiFilter, searchTerm, sortConfig]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = processedData.slice(indexOfFirstItem, indexOfLastItem);

  const formatRupiahDisplay = (num) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);

  const addParameter = () =>
    setParameters([
      ...parameters,
      {
        parameter_name: "",
        satuan: "",
        nilai_rujukan: "",
        deskripsi_rujukan: "",
        metode: "",
      },
    ]);
  const updateParameter = (index, field, value) => {
    const newParams = [...parameters];
    newParams[index][field] = value;
    setParameters(newParams);
  };
  const removeParameter = (index) =>
    setParameters(parameters.filter((_, i) => i !== index));
  const handleSort = (key) =>
    setSortConfig({
      key,
      direction:
        sortConfig.key === key && sortConfig.direction === "asc"
          ? "desc"
          : "asc",
    });

  const handleAddNew = () => {
    setIsEditing(false);
    const prefilledInstalasiId =
      selectedInstalasiFilter === "Semua"
        ? ""
        : instalasiList.find((i) => i.id === selectedInstalasiFilter)?.id || "";
    setFormData({
      id: null,
      tipe: "tunggal",
      instalasi_id: prefilledInstalasiId,
      kategori: "",
      nama_pemeriksaan: "",
      harga: "",
      satuan: "",
      nilai_rujukan: "",
      deskripsi_rujukan: "",
      metode: "",
    });
    setParameters([]);
    setShowModal(true);
  };

  const handleEdit = async (item) => {
    try {
      const res = await api.get(`/master/pemeriksaan/${item.id}/detail`);
      if (res.data.success) {
        const fullData = res.data.data;
        setIsEditing(true);
        setFormData({
          id: fullData.id,
          tipe: fullData.tipe || "tunggal",
          instalasi_id: fullData.instalasi_id || "",
          kategori: fullData.kategori,
          nama_pemeriksaan: fullData.nama_pemeriksaan,
          harga: fullData.harga,
          satuan: fullData.satuan || "",
          nilai_rujukan: fullData.nilai_rujukan || "",
          deskripsi_rujukan: fullData.deskripsi_rujukan || "",
          metode: fullData.metode || "",
        });
        if (fullData.tipe === "paket" && fullData.parameters)
          setParameters(fullData.parameters);
        else setParameters([]);
        setShowModal(true);
      }
    } catch (error) {
      toast.error("Gagal mengambil detail parameter pemeriksaan");
    }
  };

  const handleDelete = async (id, nama) => {
    if (!confirm(`Yakin ingin menghapus "${nama}"?`)) return;
    try {
      await api.delete(`/master/pemeriksaan/${id}`);
      toast.success("Data berhasil dihapus");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal menghapus data");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    const payload = {
      ...formData,
      parameters: formData.tipe === "paket" ? parameters : [],
    };

    try {
      if (isEditing) {
        await api.put(
          `/master/pemeriksaan/${formData.id}/with-parameters`,
          payload,
        );
        toast.success("Data berhasil diperbarui");
      } else {
        await api.post("/master/pemeriksaan/with-parameters", payload);
        toast.success("Data berhasil ditambahkan");
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Terjadi kesalahan saat menyimpan",
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleInstalasiSubmit = async (e) => {
    e.preventDefault();
    setInstalasiSubmitLoading(true);
    try {
      if (isEditingInstalasi) {
        await api.put(`/master/instalasi/${instalasiForm.id}`, instalasiForm);
        toast.success("Instalasi berhasil diperbarui");
      } else {
        await api.post("/master/instalasi", instalasiForm);
        toast.success("Instalasi baru berhasil ditambahkan");
      }
      setInstalasiForm({
        id: null,
        kode_instalasi: "",
        nama_instalasi: "",
        kode_sampel: "",
      });
      setIsEditingInstalasi(false);
      fetchInstalasi();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal menyimpan instalasi");
    } finally {
      setInstalasiSubmitLoading(false);
    }
  };

  const renderNilaiRujukan = (item) => {
    if (item.tipe === "paket")
      return (
        <span className="text-xs italic text-gray-400 flex items-center gap-1">
          <Package size={12} /> Multi nilai
        </span>
      );

    if (item.deskripsi_rujukan)
      return (
        <span className="text-[13px] text-gray-700 font-medium">
          {item.deskripsi_rujukan}
        </span>
      );

    if (!item.nilai_rujukan)
      return <span className="text-gray-400 text-sm">-</span>;

    try {
      const config = expandConfig(item.nilai_rujukan);
      if (config.jenis === "teks")
        return (
          <span className="text-[13px] text-gray-700">{config.teks_bebas}</span>
        );
      if (config.jenis === "kualitatif")
        return (
          <span className="text-[13px] text-emerald-700">
            Normal: {config.kualitatif.normal}
          </span>
        );
      return (
        <span className="text-[13px] text-gray-700 bg-gray-50 px-2 py-1 rounded border border-gray-100 font-mono">
          {config.kuantitatif.umum.min || "-"} -{" "}
          {config.kuantitatif.umum.max || "-"}
        </span>
      );
    } catch {
      return (
        <span className="text-[13px] text-gray-700">{item.nilai_rujukan}</span>
      );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Database className="text-cyan-600" /> Master Data Laboratorium
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Kelola data jenis pemeriksaan dan instalasi/departemen laboratorium.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => {
              setInstalasiForm({
                id: null,
                kode_instalasi: "",
                nama_instalasi: "",
                kode_sampel: "",
              });
              setIsEditingInstalasi(false);
              setShowInstalasiModal(true);
            }}
            className="flex-1 md:flex-none bg-white text-gray-700 border border-gray-300 px-5 py-2.5 rounded-xl font-semibold hover:bg-gray-50 flex items-center justify-center gap-2 shadow-sm"
          >
            <Settings size={18} /> Kelola Instalasi
          </button>
          <button
            onClick={handleAddNew}
            className="flex-1 md:flex-none bg-cyan-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-cyan-200 hover:bg-cyan-700 flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Tambah Pemeriksaan
          </button>
        </div>
      </div>

      <div className="bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
        <div className="p-4 pb-0">
          <div className="relative mb-4">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Cari nama pemeriksaan, kategori, instalasi, atau metode..."
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto px-4 pb-4 custom-scrollbar">
          <Filter size={16} className="text-gray-400 shrink-0 mr-2" />
          <button
            onClick={() => {
              setSelectedInstalasiFilter("");
              setCurrentPage(1);
            }}
            className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium border ${selectedInstalasiFilter === "" ? "bg-cyan-50 border-cyan-200 text-cyan-700" : "bg-white border-gray-200 text-gray-600"}`}
          >
            SEMUA
          </button>
          {activeInstalasiFilters.map((inst) => (
            <button
              key={inst.id}
              onClick={() => {
                setSelectedInstalasiFilter(inst.id);
                setCurrentPage(1);
              }}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium border flex items-center gap-2 ${selectedInstalasiFilter === inst.id ? "bg-cyan-50 border-cyan-200 text-cyan-700" : "bg-white border-gray-200 text-gray-600"}`}
            >
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-200 text-cyan-800">
                {inst.kode_sampel}
              </span>
              {inst.nama_instalasi.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/80 text-gray-600 font-semibold border-b border-gray-200">
              <tr>
                <th
                  className="px-4 py-4 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("nama_pemeriksaan")}
                >
                  <div className="flex items-center gap-2">
                    Nama Pemeriksaan <ArrowUpDown size={14} />
                  </div>
                </th>
                <th className="px-4 py-4">Tipe</th>
                <th className="px-4 py-4">Instalasi</th>
                <th className="px-4 py-4">Kategori</th>
                <th className="px-4 py-4">Satuan</th>
                <th className="px-4 py-4">Nilai Rujukan / Deskripsi</th>
                <th className="px-4 py-4">Metode</th>
                <th className="px-4 py-4">Harga</th>
                <th className="px-4 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-gray-400">
                    <Loader2 className="animate-spin mb-2 mx-auto" /> Memuat
                    data...
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-gray-400">
                    Tidak ada data ditemukan.
                  </td>
                </tr>
              ) : (
                currentItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-cyan-50/30 transition-colors"
                  >
                    <td className="px-4 py-3 align-top font-bold text-gray-800">
                      {item.nama_pemeriksaan}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {item.tipe === "paket" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                          <Package size={12} /> Paket
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          <FileText size={12} /> Tunggal
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {item.nama_instalasi ? (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {item.kode_sampel}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="px-2 py-1 rounded text-[11px] font-medium bg-gray-100 text-gray-600">
                        {item.kategori}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      {item.tipe === "paket"
                        ? `${item.total_parameters || 0} param`
                        : item.satuan || "-"}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {renderNilaiRujukan(item)}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {item.metode || "-"}
                    </td>
                    <td className="px-4 py-3 align-top font-mono font-medium text-cyan-700">
                      {formatRupiahDisplay(item.harga)}
                    </td>
                    <td className="px-4 py-3 align-top text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(item.id, item.nama_pemeriksaan)
                          }
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <InstalasiModal
        isOpen={showInstalasiModal}
        onClose={() => setShowInstalasiModal(false)}
        instalasiList={instalasiList}
        instalasiForm={instalasiForm}
        setInstalasiForm={setInstalasiForm}
        isEditingInstalasi={isEditingInstalasi}
        setIsEditingInstalasi={setIsEditingInstalasi}
        onSubmit={handleInstalasiSubmit}
        loading={instalasiSubmitLoading}
        onEdit={(inst) => {
          setIsEditingInstalasi(true);
          setInstalasiForm({
            id: inst.id,
            kode_instalasi: inst.kode_instalasi,
            nama_instalasi: inst.nama_instalasi,
            kode_sampel: inst.kode_sampel,
          });
        }}
        onDelete={async (id, nama) => {
          if (!confirm(`Hapus instalasi "${nama}"?`)) return;
          try {
            await api.delete(`/master/instalasi/${id}`);
            toast.success("Instalasi berhasil dihapus");
            fetchInstalasi();
            fetchData();
          } catch (error) {
            toast.error(
              error.response?.data?.message || "Gagal menghapus instalasi",
            );
          }
        }}
      />

      <PemeriksaanModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        isEditing={isEditing}
        formData={formData}
        setFormData={setFormData}
        instalasiList={instalasiList}
        categoriesList={categoriesList}
        parameters={parameters}
        addParameter={addParameter}
        updateParameter={updateParameter}
        removeParameter={removeParameter}
        onSubmit={handleSubmit}
        submitLoading={submitLoading}
      />
    </div>
  );
}
