import React, { useState, useEffect, useMemo } from "react";
import api from "../api/axios";
import { toast } from "react-toastify";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Database,
  X,
  Save,
  Loader2,
  Tag,
  Beaker,
  DollarSign,
  Scale,
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  FileText,
  Package,
  Activity,
  ClipboardList,
  AlertCircle,
  Building2,
  CheckCircle2,
  Settings, // <-- Tambahan icon
} from "lucide-react";

// --- SMART MINIFIER FIX ---
const minifyConfig = (cfg) => {
  if (cfg.jenis === "teks")
    return JSON.stringify({ j: "txt", v: cfg.teks_bebas });

  const minified = { j: cfg.jenis === "kuantitatif" ? "kan" : "kal" };
  if (cfg.jenis === "kuantitatif") {
    minified.m = cfg.is_multi; // .m untuk is_multi
    if (cfg.is_multi) {
      minified.r = cfg.kuantitatif.custom_refs.map((ref) => ({
        l: ref.label,
        mn: ref.min,
        mx: ref.max,
      }));
    } else {
      minified.u = {
        min: cfg.kuantitatif.umum?.min || "",
        max: cfg.kuantitatif.umum?.max || "",
      };
    }
  } else {
    minified.o = cfg.kualitatif.opsi;
    minified.n = cfg.kualitatif.normal;
  }
  return JSON.stringify(minified);
};

const expandConfig = (value) => {
  const defaultCfg = {
    jenis: "kuantitatif",
    teks_bebas: "",
    is_multi: false,
    kuantitatif: {
      umum: { min: "", max: "" },
      custom_refs: [
        { label: "Laki-laki", min: "", max: "" },
        { label: "Perempuan", min: "", max: "" },
      ],
    },
    kualitatif: { opsi: "Negatif, Positif", normal: "Negatif" },
  };

  if (value === undefined || value === null) return defaultCfg;

  try {
    if (typeof value === "string" && !value.trim().startsWith("{")) {
      return { ...defaultCfg, jenis: "teks", teks_bebas: value };
    }
    const minified = typeof value === "string" ? JSON.parse(value) : value;
    if (minified.jenis) return { ...defaultCfg, ...minified };

    if (minified.j === "kan") {
      defaultCfg.jenis = "kuantitatif";

      // Deteksi Format Lama (bg = beda_gender) untuk migrasi
      if (minified.bg !== undefined) {
        defaultCfg.is_multi = minified.bg;
        defaultCfg.kuantitatif.custom_refs = [];
        if (minified.L)
          defaultCfg.kuantitatif.custom_refs.push({
            label: "Laki-laki",
            min: minified.L.min,
            max: minified.L.max,
          });
        if (minified.P)
          defaultCfg.kuantitatif.custom_refs.push({
            label: "Perempuan",
            min: minified.P.min,
            max: minified.P.max,
          });
      } else {
        // Format Baru
        defaultCfg.is_multi = minified.m || false;
        if (minified.m && minified.r) {
          defaultCfg.kuantitatif.custom_refs = minified.r.map((r) => ({
            label: r.l,
            min: r.mn,
            max: r.mx,
          }));
        }
      }
      defaultCfg.kuantitatif.umum = minified.u || defaultCfg.kuantitatif.umum;
    } else if (minified.j === "kal") {
      defaultCfg.jenis = "kualitatif";
      defaultCfg.kualitatif.opsi = minified.o || "Negatif, Positif";
      defaultCfg.kualitatif.normal = minified.n || "Negatif";
    } else if (minified.j === "txt") {
      defaultCfg.jenis = "teks";
      defaultCfg.teks_bebas = minified.v || "";
    }
    return defaultCfg;
  } catch {
    return { ...defaultCfg, jenis: "teks", teks_bebas: value.toString() };
  }
};

const hasMinMaxError = (min, max) => {
  if (min !== "" && max !== "" && parseFloat(min) > parseFloat(max))
    return true;
  return false;
};

// --- UI BUILDER REFERENCE VALUE ---
const ReferenceValueBuilder = ({ value, onChange }) => {
  const config = expandConfig(value);

  const handleChange = (key, val, nestedKey = null, deepKey = null) => {
    let newConfig = JSON.parse(JSON.stringify(config));
    if (deepKey) newConfig[key][nestedKey][deepKey] = val;
    else if (nestedKey) newConfig[key][nestedKey] = val;
    else newConfig[key] = val;
    onChange(minifyConfig(newConfig));
  };

  const handleCustomRefChange = (index, field, val) => {
    let newConfig = JSON.parse(JSON.stringify(config));
    newConfig.kuantitatif.custom_refs[index][field] = val;
    onChange(minifyConfig(newConfig));
  };

  const addCustomRef = () => {
    let newConfig = JSON.parse(JSON.stringify(config));
    newConfig.kuantitatif.custom_refs.push({ label: "", min: "", max: "" });
    onChange(minifyConfig(newConfig));
  };

  const removeCustomRef = (index) => {
    let newConfig = JSON.parse(JSON.stringify(config));
    newConfig.kuantitatif.custom_refs.splice(index, 1);
    onChange(minifyConfig(newConfig));
  };

  const renderMinMaxInputs = (minVal, maxVal, label, nestedKey, colorClass) => {
    const isError = hasMinMaxError(minVal, maxVal);
    return (
      <div className="flex flex-col gap-1 w-full">
        {label && (
          <span
            className={`text-[11px] font-bold ${colorClass} uppercase tracking-wider mb-1`}
          >
            {label}
          </span>
        )}
        <div className="flex items-center gap-2 w-full">
          <div className="relative w-1/2">
            <span
              className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold ${isError ? "text-red-400" : "text-gray-400"}`}
            >
              Min
            </span>
            <input
              type="number"
              step="any"
              placeholder="0"
              value={minVal}
              onChange={(e) =>
                handleChange("kuantitatif", e.target.value, nestedKey, "min")
              }
              className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg outline-none transition-all ${isError ? "border-red-400 bg-red-50 text-red-700 ring-2 ring-red-100" : "border-gray-200 bg-white focus:border-cyan-500"}`}
            />
          </div>
          <span className="text-gray-300 font-bold">-</span>
          <div className="relative w-1/2">
            <span
              className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold ${isError ? "text-red-400" : "text-gray-400"}`}
            >
              Max
            </span>
            <input
              type="number"
              step="any"
              placeholder="0"
              value={maxVal}
              onChange={(e) =>
                handleChange("kuantitatif", e.target.value, nestedKey, "max")
              }
              className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg outline-none transition-all ${isError ? "border-red-400 bg-red-50 text-red-700 ring-2 ring-red-100" : "border-gray-200 bg-white focus:border-cyan-500"}`}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50/80 border border-gray-200 p-5 rounded-xl mt-1 space-y-5">
      <div className="flex p-1 bg-gray-200/60 rounded-xl overflow-hidden">
        {["kuantitatif", "kualitatif", "teks"].map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => handleChange("jenis", type)}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all capitalize ${config.jenis === type ? "bg-white shadow-sm text-cyan-700" : "text-gray-500 hover:text-gray-700"}`}
          >
            {type === "kuantitatif"
              ? "Angka (Kuantitatif)"
              : type === "kualitatif"
                ? "Pilihan (Kualitatif)"
                : "Formula / Teks Bebas"}
          </button>
        ))}
      </div>

      {config.jenis === "kuantitatif" && (
        <div className="space-y-4 animate-fade-in bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-gray-50">
            <label className="text-sm text-gray-700 font-bold cursor-pointer">
              Gunakan Multi-Kategori Rujukan?
            </label>
            <div
              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${config.is_multi ? "bg-cyan-500" : "bg-gray-300"}`}
              onClick={() => handleChange("is_multi", !config.is_multi)}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${config.is_multi ? "translate-x-6" : ""}`}
              />
            </div>
          </div>

          {!config.is_multi ? (
            renderMinMaxInputs(
              config.kuantitatif.umum.min,
              config.kuantitatif.umum.max,
              "Semua Gender/Usia",
              "umum",
              "text-gray-500",
            )
          ) : (
            <div className="space-y-3">
              {config.kuantitatif.custom_refs.map((ref, idx) => {
                const isError = hasMinMaxError(ref.min, ref.max);
                return (
                  <div
                    key={idx}
                    className={`flex flex-col sm:flex-row gap-3 items-end p-3 rounded-xl border ${isError ? "bg-red-50/50 border-red-200" : "bg-gray-50 border-gray-200"}`}
                  >
                    <div className="w-full sm:w-[40%]">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">
                        Kategori Label
                      </label>
                      <input
                        type="text"
                        value={ref.label}
                        placeholder="Cth: Dewasa, Anak, Pria..."
                        onChange={(e) =>
                          handleCustomRefChange(idx, "label", e.target.value)
                        }
                        className="w-full text-sm border-gray-300 border rounded-lg px-3 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200"
                      />
                    </div>
                    <div className="w-full sm:w-[60%] flex items-center gap-2">
                      <div className="relative w-1/2">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
                          Min
                        </span>
                        <input
                          type="number"
                          step="any"
                          value={ref.min}
                          onChange={(e) =>
                            handleCustomRefChange(idx, "min", e.target.value)
                          }
                          className={`w-full pl-9 pr-2 py-2 text-sm border rounded-lg outline-none ${isError ? "border-red-400" : "border-gray-300 focus:border-cyan-500"}`}
                        />
                      </div>
                      <span className="text-gray-400 font-bold">-</span>
                      <div className="relative w-1/2">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
                          Max
                        </span>
                        <input
                          type="number"
                          step="any"
                          value={ref.max}
                          onChange={(e) =>
                            handleCustomRefChange(idx, "max", e.target.value)
                          }
                          className={`w-full pl-9 pr-2 py-2 text-sm border rounded-lg outline-none ${isError ? "border-red-400" : "border-gray-300 focus:border-cyan-500"}`}
                        />
                      </div>
                      <button
                        onClick={() => removeCustomRef(idx)}
                        className="p-2 text-red-500 hover:bg-red-100 rounded-lg ml-1"
                        title="Hapus"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={addCustomRef}
                className="mt-2 text-xs font-bold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 px-3 py-2 rounded-lg flex items-center gap-1 transition-colors w-fit"
              >
                <Plus size={14} /> Tambah Kategori
              </button>
            </div>
          )}
        </div>
      )}

      {/* Bagian kualitatif & teks tetap sama seperti sebelumnya */}
      {config.jenis === "kualitatif" && (
        <div className="space-y-4 animate-fade-in bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div>
                      <label className="text-xs font-bold text-gray-700 mb-1.5 block">
                        Opsi Pilihan Dropdown{" "}
                        <span className="text-gray-400 font-normal">
                          (Pisahkan dengan koma)
                        </span>
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Negatif, Positif, Invalid"
                        value={config.kualitatif.opsi}
                        onChange={(e) =>
                          handleChange("kualitatif", e.target.value, "opsi")
                        }
                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1">
                        Hasil Normal{" "}
                        <AlertCircle
                          size={12}
                          className="text-amber-500"
                          title="Hasil selain ini akan ditandai merah otomatis"
                        />
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Negatif"
                        value={config.kualitatif.normal}
                        onChange={(e) =>
                          handleChange("kualitatif", e.target.value, "normal")
                        }
                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 transition-all"
                      />
                    </div>
                  </div>
                )}
      {config.jenis === "teks" && (
        <div className="animate-fade-in bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <label className="text-xs font-bold text-gray-700 mb-1.5 block">
            Rujukan Manual / Formula Khusus
          </label>
          <input
            type="text"
            placeholder="Contoh: < 200 mg/dL, Tidak Terdeteksi"
            value={config.teks_bebas}
            onChange={(e) => handleChange("teks_bebas", e.target.value)}
            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 transition-all"
          />
        </div>
      )}
    </div>
  );
};

// ------------------------------------------------
// MAIN COMPONENT
// ------------------------------------------------

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

  // --- STATE BARU: MANAJEMEN INSTALASI ---
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

  const handlePriceChange = (e) =>
    setFormData({ ...formData, harga: e.target.value.replaceAll(/\D/g, "") });
  const getFormattedPrice = (price) =>
    !price && price !== 0 ? "" : new Intl.NumberFormat("id-ID").format(price);
  const formatRupiahDisplay = (num) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);

  const addParameter = () =>
    setParameters([
      ...parameters,
      { parameter_name: "", satuan: "", nilai_rujukan: "", metode: "" },
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

  // --- HANDLERS: MANAJEMEN PEMERIKSAAN ---
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

  const checkConfigErrors = (configString) => {
    const cfg = expandConfig(configString);
    if (cfg.jenis === "kuantitatif") {
      if (cfg.is_multi) {
        for (let i = 0; i < cfg.kuantitatif.custom_refs.length; i++) {
          const r = cfg.kuantitatif.custom_refs[i];
          if (!r.label || r.label.trim() === "")
            return "Label kategori rujukan tidak boleh kosong.";
          if (hasMinMaxError(r.min, r.max))
            return `Rujukan "${r.label}" tidak valid.`;
        }
      } else {
        if (hasMinMaxError(cfg.kuantitatif.umum.min, cfg.kuantitatif.umum.max))
          return "Rujukan Umum tidak valid.";
      }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.tipe === "tunggal") {
      const err = checkConfigErrors(formData.nilai_rujukan);
      if (err) {
        toast.error(err + " Pastikan Min tidak lebih besar dari Max.");
        return;
      }
    } else {
      if (parameters.length === 0) {
        toast.error("Paket pemeriksaan harus memiliki minimal 1 parameter");
        return;
      }
      for (let i = 0; i < parameters.length; i++) {
        const err = checkConfigErrors(parameters[i].nilai_rujukan);
        if (err) {
          toast.error(`Parameter ${parameters[i].parameter_name}: ${err}`);
          return;
        }
      }
    }

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

  // --- HANDLERS: MANAJEMEN INSTALASI ---
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
      // Reset form tp biarkan modal terbuka
      setInstalasiForm({
        id: null,
        kode_instalasi: "",
        nama_instalasi: "",
        kode_sampel: "",
      });
      setIsEditingInstalasi(false);
      fetchInstalasi(); // Refresh list instalasi
      fetchData(); // Refresh list pemeriksaan jaga-jaga kalau nama update
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal menyimpan instalasi");
    } finally {
      setInstalasiSubmitLoading(false);
    }
  };

  const handleEditInstalasi = (inst) => {
    setIsEditingInstalasi(true);
    setInstalasiForm({
      id: inst.id,
      kode_instalasi: inst.kode_instalasi,
      nama_instalasi: inst.nama_instalasi,
      kode_sampel: inst.kode_sampel,
    });
  };

  const handleDeleteInstalasi = async (id, nama) => {
    if (
      !confirm(
        `Hapus instalasi "${nama}"? Pastikan instalasi ini tidak sedang digunakan pada Master Pemeriksaan.`,
      )
    )
      return;
    try {
      await api.delete(`/master/instalasi/${id}`);
      toast.success("Instalasi berhasil dihapus");
      fetchInstalasi();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal menghapus instalasi");
    }
  };

  const renderNilaiRujukan = (item) => {
    if (item.tipe === "paket")
      return (
        <div className="flex items-center gap-1 text-gray-400">
          <Package size={12} />{" "}
          <span className="text-xs italic">Multi nilai</span>
        </div>
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
          <span className="text-[13px] text-gray-700 font-medium text-emerald-700">
            Normal: {config.kualitatif.normal}
          </span>
        );

      if (config.jenis === "kuantitatif") {
        // --- FIX: Logic baru untuk merender Multi-Kategori Rujukan ---
        if (config.is_multi && config.kuantitatif?.custom_refs?.length > 0) {
          return (
            <div className="text-[11px] text-gray-700 bg-gray-50 p-1.5 rounded border border-gray-100 w-fit max-h-24 overflow-y-auto custom-scrollbar">
              {config.kuantitatif.custom_refs.map((ref, idx) => (
                <div key={idx} className="whitespace-nowrap">
                  <span className="font-bold text-cyan-700">{ref.label}:</span>{" "}
                  {ref.min || "-"} - {ref.max || "-"}
                </div>
              ))}
            </div>
          );
        }

        // Render untuk nilai rujukan tunggal (Umum)
        return (
          <span className="text-[13px] text-gray-700 bg-gray-50 px-2 py-1 rounded border border-gray-100 font-mono">
            {config.kuantitatif.umum.min || "-"} -{" "}
            {config.kuantitatif.umum.max || "-"}
          </span>
        );
      }
    } catch {
      return (
        <span className="text-[13px] text-gray-700 line-clamp-2 break-words">
          {item.nilai_rujukan}
        </span>
      );
    }
  };

  const renderMetode = (item) => {
    if (item.tipe === "paket")
      return (
        <div className="flex items-center gap-1 text-gray-400">
          <AlertCircle size={12} />{" "}
          <span className="text-xs italic">Beragam</span>
        </div>
      );
    return item.metode ? (
      <div className="max-w-[150px]" title={item.metode}>
        <span className="text-[13px] text-gray-700 line-clamp-2 break-words">
          {item.metode}
        </span>
      </div>
    ) : (
      <span className="text-gray-400 text-sm">-</span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* HEADER UTAMA */}
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
          {/* TOMBOL KELOLA INSTALASI */}
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
            className="flex-1 md:flex-none bg-white text-gray-700 border border-gray-300 px-5 py-2.5 rounded-xl font-semibold hover:bg-gray-50 hover:text-cyan-700 hover:border-cyan-300 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Settings size={18} /> Kelola Instalasi
          </button>

          <button
            onClick={handleAddNew}
            className="flex-1 md:flex-none bg-cyan-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-cyan-200 hover:shadow-cyan-300 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
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
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm transition-all"
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
            className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${selectedInstalasiFilter === "" ? "bg-cyan-50 border-cyan-200 text-cyan-700 shadow-sm" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}
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
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border flex items-center gap-2 ${selectedInstalasiFilter === inst.id ? "bg-cyan-50 border-cyan-200 text-cyan-700 shadow-sm" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${selectedInstalasiFilter === inst.id ? "bg-cyan-200 text-cyan-800" : "bg-gray-100 text-gray-500"}`}
              >
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
                  className="px-4 py-4 cursor-pointer hover:bg-gray-100 transition-colors group min-w-[200px]"
                  onClick={() => handleSort("nama_pemeriksaan")}
                >
                  <div className="flex items-center gap-2">
                    Nama Pemeriksaan{" "}
                    <ArrowUpDown
                      size={14}
                      className="text-gray-400 group-hover:text-cyan-600"
                    />
                  </div>
                </th>
                <th className="px-4 py-4 min-w-[100px]">Tipe</th>
                <th
                  className="px-4 py-4 cursor-pointer hover:bg-gray-100 transition-colors group min-w-[120px]"
                  onClick={() => handleSort("nama_instalasi")}
                >
                  <div className="flex items-center gap-2">
                    Instalasi{" "}
                    <ArrowUpDown
                      size={14}
                      className="text-gray-400 group-hover:text-cyan-600"
                    />
                  </div>
                </th>
                <th
                  className="px-4 py-4 cursor-pointer hover:bg-gray-100 transition-colors group min-w-[150px]"
                  onClick={() => handleSort("kategori")}
                >
                  <div className="flex items-center gap-2">
                    Kategori{" "}
                    <ArrowUpDown
                      size={14}
                      className="text-gray-400 group-hover:text-cyan-600"
                    />
                  </div>
                </th>
                <th className="px-4 py-4 min-w-[100px]">Satuan</th>
                <th className="px-4 py-4 min-w-[160px]">Nilai Rujukan</th>
                <th className="px-4 py-4 min-w-[140px]">Metode</th>
                <th
                  className="px-4 py-4 cursor-pointer hover:bg-gray-100 transition-colors group min-w-[120px]"
                  onClick={() => handleSort("harga")}
                >
                  <div className="flex items-center gap-2">
                    Harga{" "}
                    <ArrowUpDown
                      size={14}
                      className="text-gray-400 group-hover:text-cyan-600"
                    />
                  </div>
                </th>
                <th className="px-4 py-4 text-center min-w-[100px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="9"
                    className="text-center py-12 text-gray-400 flex flex-col items-center"
                  >
                    <Loader2 className="animate-spin mb-2" /> Memuat data...
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
                    <td className="px-4 py-3 align-top">
                      <div
                        className="font-bold text-gray-800 line-clamp-2 max-w-[200px]"
                        title={item.nama_pemeriksaan}
                      >
                        {item.nama_pemeriksaan}
                      </div>
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
                        <span
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap"
                          title={item.nama_instalasi}
                        >
                          {item.kode_sampel}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div
                        className="inline-block px-2 py-1 rounded text-[10px] sm:text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-200 max-w-[160px] whitespace-normal break-words leading-tight"
                        title={item.kategori}
                      >
                        <span className="line-clamp-2">{item.kategori}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      {item.tipe === "paket" ? (
                        <span className="text-gray-500 text-xs">
                          {item.total_parameters || 0} param
                        </span>
                      ) : (
                        <div className="flex items-center gap-1 text-gray-700">
                          <Scale size={12} className="shrink-0" />{" "}
                          <span className="text-[13px]">
                            {item.satuan || "-"}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {renderNilaiRujukan(item)}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {renderMetode(item)}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="font-mono font-medium text-[13px] text-cyan-700 whitespace-nowrap">
                        {formatRupiahDisplay(item.harga)}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors border border-transparent hover:border-yellow-200"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(item.id, item.nama_pemeriksaan)
                          }
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                          title="Hapus"
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
        {processedData.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/50">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>
                Menampilkan {indexOfFirstItem + 1}-
                {Math.min(indexOfLastItem, processedData.length)} dari{" "}
                {processedData.length} data
              </span>
              <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
                <span>Tampilkan:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-gray-300 text-gray-700 text-xs rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-1.5"
                >
                  <option value={10}>10</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-medium text-gray-600 px-2">
                Halaman {currentPage}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =========================================
          MODAL 1: KELOLA DATA INSTALASI
      ============================================= */}
      {showInstalasiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-gray-200">
            {/* Header Modal */}
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <h3 className="font-extrabold text-xl text-gray-800 flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Building2 size={20} />
                </div>
                Manajemen Instalasi
              </h3>
              <button
                onClick={() => setShowInstalasiModal(false)}
                className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full p-2 transition-all"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Body Modal - Split Layout */}
            <div className="flex flex-col lg:flex-row overflow-hidden bg-gray-50/50 flex-1 h-[600px]">
              {/* Kolom Kiri: Form Input Instalasi */}
              <div className="w-full lg:w-1/3 p-6 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  {isEditingInstalasi ? (
                    <Edit2 size={16} className="text-yellow-600" />
                  ) : (
                    <Plus size={16} className="text-blue-600" />
                  )}
                  {isEditingInstalasi ? "Edit Instalasi" : "Tambah Instalasi"}
                </h4>

                <form
                  onSubmit={handleInstalasiSubmit}
                  className="space-y-4 flex-1"
                >
                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-1.5 block">
                      Kode Menu / Dropdown{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Cth: 1 IMB"
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-gray-50 focus:bg-white"
                      value={instalasiForm.kode_instalasi}
                      onChange={(e) =>
                        setInstalasiForm({
                          ...instalasiForm,
                          kode_instalasi: e.target.value,
                        })
                      }
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      Digunakan untuk urutan di Dropdown (Cth: 1 IMB)
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-1.5 block">
                      Nama Lengkap Instalasi{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Cth: Instalasi Mikrobiologi dan..."
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-gray-50 focus:bg-white"
                      value={instalasiForm.nama_instalasi}
                      onChange={(e) =>
                        setInstalasiForm({
                          ...instalasiForm,
                          nama_instalasi: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-1.5 block">
                      Kode Sampel Fisik <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Cth: IMB"
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-mono font-bold text-blue-700 uppercase bg-gray-50 focus:bg-white"
                      value={instalasiForm.kode_sampel}
                      onChange={(e) =>
                        setInstalasiForm({
                          ...instalasiForm,
                          kode_sampel: e.target.value.toUpperCase(),
                        })
                      }
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      Prefix huruf awal penomoran di tabung sampel
                    </p>
                  </div>

                  <div className="pt-4 mt-auto">
                    <button
                      type="submit"
                      disabled={instalasiSubmitLoading}
                      className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-70 shadow-md shadow-blue-200"
                    >
                      {instalasiSubmitLoading ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Save size={18} />
                      )}
                      Simpan Instalasi
                    </button>
                    {isEditingInstalasi && (
                      <button
                        type="button"
                        onClick={() => {
                          setInstalasiForm({
                            id: null,
                            kode_instalasi: "",
                            nama_instalasi: "",
                            kode_sampel: "",
                          });
                          setIsEditingInstalasi(false);
                        }}
                        className="w-full mt-2 bg-white text-gray-600 border border-gray-300 py-2.5 rounded-xl font-bold hover:bg-gray-50 transition text-sm"
                      >
                        Batal Edit
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Kolom Kanan: Daftar Instalasi */}
              <div className="w-full lg:w-2/3 p-6 flex flex-col h-full bg-gray-50/50">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Database size={16} className="text-gray-500" />
                  Daftar Instalasi Aktif
                </h4>
                <div className="bg-white border border-gray-200 rounded-xl flex-1 overflow-hidden flex flex-col">
                  <div className="overflow-y-auto custom-scrollbar flex-1">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase">
                            Kode/Dropdown
                          </th>
                          <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase">
                            Nama Instalasi
                          </th>
                          <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase text-center">
                            Kode Tabung
                          </th>
                          <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase text-center w-24">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {instalasiList.length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="text-center py-10 text-gray-400"
                            >
                              Belum ada instalasi
                            </td>
                          </tr>
                        ) : (
                          instalasiList.map((inst) => (
                            <tr key={inst.id} className="hover:bg-blue-50/30">
                              <td className="px-4 py-3 font-medium text-gray-700 whitespace-nowrap">
                                {inst.kode_instalasi}
                              </td>
                              <td className="px-4 py-3 text-gray-600 leading-tight min-w-[200px]">
                                {inst.nama_instalasi}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="bg-blue-100 text-blue-700 font-mono font-bold px-2 py-0.5 rounded text-xs border border-blue-200">
                                  {inst.kode_sampel}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleEditInstalasi(inst)}
                                    className="text-yellow-600 hover:bg-yellow-50 p-1.5 rounded transition"
                                    title="Edit"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteInstalasi(
                                        inst.id,
                                        inst.nama_instalasi,
                                      )
                                    }
                                    className="text-red-600 hover:bg-red-50 p-1.5 rounded transition"
                                    title="Hapus"
                                  >
                                    <Trash2 size={14} />
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
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          MODAL 2: KELOLA PEMERIKSAAN (KODE ASLI)
      ============================================= */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[850px] overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-gray-200">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <h3 className="font-extrabold text-xl text-gray-800 flex items-center gap-3">
                <div className="p-2 bg-cyan-50 text-cyan-600 rounded-xl">
                  {isEditing ? <Edit2 size={20} /> : <Plus size={20} />}
                </div>
                {isEditing
                  ? "Edit Data Pemeriksaan"
                  : "Tambah Pemeriksaan Baru"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full p-2 transition-all"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <div className="overflow-y-auto p-6 md:p-8 custom-scrollbar bg-gray-50/50">
              <form
                id="masterForm"
                onSubmit={handleSubmit}
                className="space-y-8"
              >
                <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-2">
                  <div
                    onClick={() =>
                      setFormData({ ...formData, tipe: "tunggal" })
                    }
                    className={`cursor-pointer rounded-xl p-4 flex items-center gap-4 transition-all flex-1 ${formData.tipe === "tunggal" ? "bg-cyan-50 border-cyan-500 ring-2 ring-cyan-500/20" : "hover:bg-gray-50 border border-transparent"}`}
                  >
                    <div
                      className={`p-3 rounded-full transition-colors ${formData.tipe === "tunggal" ? "bg-cyan-600 text-white shadow-md" : "bg-gray-100 text-gray-400"}`}
                    >
                      <FileText size={24} />
                    </div>
                    <div>
                      <p
                        className={`font-bold text-base transition-colors ${formData.tipe === "tunggal" ? "text-cyan-900" : "text-gray-600"}`}
                      >
                        Pemeriksaan Tunggal
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        Satu jenis parameter hasil uji
                      </p>
                    </div>
                  </div>
                  <div className="hidden sm:block w-px bg-gray-100 my-2"></div>
                  <div
                    onClick={() => setFormData({ ...formData, tipe: "paket" })}
                    className={`cursor-pointer rounded-xl p-4 flex items-center gap-4 transition-all flex-1 ${formData.tipe === "paket" ? "bg-purple-50 border-purple-500 ring-2 ring-purple-500/20" : "hover:bg-gray-50 border border-transparent"}`}
                  >
                    <div
                      className={`p-3 rounded-full transition-colors ${formData.tipe === "paket" ? "bg-purple-600 text-white shadow-md" : "bg-gray-100 text-gray-400"}`}
                    >
                      <Package size={24} />
                    </div>
                    <div>
                      <p
                        className={`font-bold text-base transition-colors ${formData.tipe === "paket" ? "text-purple-900" : "text-gray-600"}`}
                      >
                        Paket Pemeriksaan
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        Terdiri dari multi-parameter
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <Building2 size={16} className="text-cyan-600" />{" "}
                      Instalasi Tujuan
                    </label>
                    <select
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-white focus:bg-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all text-sm font-medium text-gray-700 cursor-pointer"
                      value={formData.instalasi_id}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          instalasi_id: e.target.value,
                        })
                      }
                      required
                    >
                      <option value="" disabled>
                        -- Pilih Instalasi --
                      </option>
                      {instalasiList.map((inst) => (
                        <option key={inst.id} value={inst.id}>
                          {inst.kode_sampel} - {inst.nama_instalasi}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <Tag size={16} className="text-cyan-600" /> Kategori
                      Kelompok
                    </label>
                    <input
                      type="text"
                      required
                      list="kategori-list"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-white focus:bg-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all text-sm font-medium text-gray-700 placeholder-gray-400"
                      value={formData.kategori}
                      onChange={(e) =>
                        setFormData({ ...formData, kategori: e.target.value })
                      }
                      placeholder="Cth: IMUNOLOGI"
                    />
                    <datalist id="kategori-list">
                      {categoriesList.map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <Beaker size={16} className="text-cyan-600" /> Nama /
                      Judul Pemeriksaan
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-white focus:bg-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all text-sm font-bold text-gray-900 placeholder-gray-400"
                      value={formData.nama_pemeriksaan}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          nama_pemeriksaan: e.target.value,
                        })
                      }
                      placeholder={
                        formData.tipe === "paket"
                          ? "Cth: Paket MCU Dasar"
                          : "Cth: Trigliserida"
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <DollarSign size={16} className="text-cyan-600" /> Harga /
                      Tarif (Rp)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-white focus:bg-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all text-sm font-mono font-bold text-cyan-700 placeholder-gray-400"
                      value={getFormattedPrice(formData.harga)}
                      onChange={handlePriceChange}
                      placeholder="0"
                    />
                  </div>
                </div>

                {formData.tipe === "tunggal" ? (
                  <div className="animate-fade-in bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                          <Scale size={16} className="text-cyan-600" /> Satuan
                          Ukur
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all text-sm text-gray-700 placeholder-gray-400"
                          value={formData.satuan}
                          onChange={(e) =>
                            setFormData({ ...formData, satuan: e.target.value })
                          }
                          placeholder="Cth: mg/dL, /uL"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                          <ClipboardList size={16} className="text-cyan-600" />{" "}
                          Metode Uji
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all text-sm text-gray-700 placeholder-gray-400"
                          value={formData.metode}
                          onChange={(e) =>
                            setFormData({ ...formData, metode: e.target.value })
                          }
                          placeholder="Cth: Hexokinase, Strip Test"
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <Activity size={16} className="text-cyan-600" />{" "}
                        Pengaturan Nilai Rujukan / Normal
                      </label>
                      <ReferenceValueBuilder
                        value={formData.nilai_rujukan}
                        onChange={(val) =>
                          setFormData({ ...formData, nilai_rujukan: val })
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-fade-in bg-white p-6 rounded-2xl border border-purple-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-purple-500"></div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-2 pl-4">
                      <div>
                        <label className="text-base font-extrabold text-purple-900 flex items-center gap-2 mb-1">
                          <Package size={18} className="text-purple-600" />{" "}
                          Parameter Dalam Paket
                        </label>
                        <p className="text-xs text-gray-500 font-medium">
                          Atur satuan, nilai rujukan, dan metode untuk
                          masing-masing parameter uji.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={addParameter}
                        className="text-sm flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-xl hover:bg-purple-700 font-bold transition-all shadow-md shadow-purple-200 hover:shadow-purple-300 hover:-translate-y-0.5 active:scale-95 w-full sm:w-auto"
                      >
                        <Plus size={16} /> Tambah Parameter
                      </button>
                    </div>

                    {parameters.length === 0 ? (
                      <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 flex flex-col items-center justify-center gap-3">
                        <Package size={40} className="text-gray-300" />
                        <p className="text-sm font-medium">
                          Belum ada parameter yang ditambahkan.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[450px] overflow-y-auto custom-scrollbar pr-2 pl-4 pb-2">
                        {parameters.map((param, index) => (
                          <div
                            key={index}
                            className="flex flex-col p-5 bg-white rounded-xl border border-gray-200 shadow-sm relative group hover:border-purple-300 transition-colors"
                          >
                            <div className="flex justify-between items-start mb-4 gap-4">
                              <div className="flex items-center gap-3 w-full">
                                <span className="bg-purple-100 text-purple-800 font-black text-xs px-2 py-1 rounded border border-purple-200">
                                  {index + 1}
                                </span>
                                <input
                                  type="text"
                                  placeholder="Nama Parameter (Wajib diisi)"
                                  className="w-full text-base border-b border-gray-200 focus:border-purple-500 outline-none font-bold text-gray-800 bg-transparent pb-1 placeholder-gray-300 transition-colors"
                                  value={param.parameter_name}
                                  onChange={(e) =>
                                    updateParameter(
                                      index,
                                      "parameter_name",
                                      e.target.value,
                                    )
                                  }
                                  required
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeParameter(index)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Hapus Parameter"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                  <Scale size={14} />
                                </span>
                                <input
                                  type="text"
                                  placeholder="Satuan (Opsional)"
                                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 rounded-lg border border-gray-200 focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all font-medium text-gray-700"
                                  value={param.satuan}
                                  onChange={(e) =>
                                    updateParameter(
                                      index,
                                      "satuan",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                  <ClipboardList size={14} />
                                </span>
                                <input
                                  type="text"
                                  placeholder="Metode (Opsional)"
                                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 rounded-lg border border-gray-200 focus:bg-white focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none transition-all font-medium text-gray-700"
                                  value={param.metode}
                                  onChange={(e) =>
                                    updateParameter(
                                      index,
                                      "metode",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                            </div>

                            <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                              <label className="text-xs font-bold text-gray-600 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                                <Activity
                                  size={14}
                                  className="text-purple-500"
                                />{" "}
                                Nilai Rujukan Parameter:
                              </label>
                              <ReferenceValueBuilder
                                value={param.nilai_rujukan}
                                onChange={(val) =>
                                  updateParameter(index, "nilai_rujukan", val)
                                }
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>

            <div className="p-6 border-t border-gray-100 flex flex-col-reverse sm:flex-row justify-end items-center gap-3 bg-gray-50 rounded-b-3xl">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-100 hover:text-gray-800 transition-all"
              >
                Batal
              </button>
              <button
                type="submit"
                form="masterForm"
                disabled={submitLoading}
                className={`w-full sm:w-auto px-8 py-3 rounded-xl text-white font-extrabold shadow-lg transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none ${formData.tipe === "paket" ? "bg-purple-600 hover:bg-purple-700 shadow-purple-600/30 hover:shadow-purple-600/40" : "bg-cyan-600 hover:bg-cyan-700 shadow-cyan-600/30 hover:shadow-cyan-600/40"}`}
              >
                {submitLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Save size={18} />
                )}{" "}
                Simpan Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
