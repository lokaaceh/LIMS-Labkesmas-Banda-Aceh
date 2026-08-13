// pages/RegistrationEdit.jsx
import { useState, useEffect, useMemo } from "react";
import api from "../api/axios";
import { toast } from "react-toastify";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  AlertCircle,
  Search,
  Clock,
  CalendarDays,
  FileSpreadsheet,
  Building2,
  Plus,
  Minus,
  Settings2,
  Loader2,
  User,
  FlaskConical,
} from "lucide-react";

// --- Reusable Components ---
const FormInput = ({
  label,
  icon: Icon,
  type = "text",
  disabled,
  ...props
}) => (
  <div className="space-y-1.5">
    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
      {Icon && <Icon size={14} className="text-cyan-600" />}
      {label}
    </label>
    <input
      type={type}
      disabled={disabled}
      className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all outline-none text-sm text-gray-800 placeholder-gray-400 ${
        disabled ? "opacity-60 cursor-not-allowed bg-gray-100" : ""
      }`}
      {...props}
    />
  </div>
);

const FormSelect = ({ label, children, ...props }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-semibold text-gray-700">{label}</label>
    <div className="relative">
      <select
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all outline-none text-sm appearance-none"
        {...props}
      >
        {children}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
        ▼
      </div>
    </div>
  </div>
);

const FormTextarea = ({ label, icon: Icon, ...props }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
      {Icon && <Icon size={14} className="text-cyan-600" />}
      {label}
    </label>
    <textarea
      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all outline-none text-sm min-h-[100px]"
      {...props}
    />
  </div>
);

// --- EXAMINATION SELECTOR ---
const ExaminationSelector = ({ selectedItems, onChange, masterData }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const groupedData = masterData.reduce((acc, item) => {
    const groupName = item.nama_instalasi
      ? item.nama_instalasi.toUpperCase()
      : "LAINNYA / UMUM";

    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(item);
    return acc;
  }, {});

  const sortedGroups = Object.entries(groupedData).sort((a, b) => {
    const groupA = a[0];
    const groupB = b[0];

    if (groupA === "LAINNYA / UMUM") return 1;
    if (groupB === "LAINNYA / UMUM") return -1;

    const kodeA = a[1][0]?.kode_sampel || "";
    const kodeB = b[1][0]?.kode_sampel || "";

    return kodeA.localeCompare(kodeB, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

  const getItemQty = (id) => {
    const found = selectedItems.find((i) => Number(i.id) === Number(id));
    return found ? found.qty : 0;
  };

  const handleAdd = (item) => {
    const existing = selectedItems.find(
      (i) => Number(i.id) === Number(item.id),
    );
    if (existing) {
      onChange(
        selectedItems.map((i) =>
          Number(i.id) === Number(item.id) ? { ...i, qty: i.qty + 1 } : i,
        ),
      );
    } else {
      onChange([...selectedItems, { ...item, qty: 1 }]);
    }
  };

  const handleRemove = (item) => {
    const existing = selectedItems.find(
      (i) => Number(i.id) === Number(item.id),
    );
    if (existing) {
      if (existing.qty > 1) {
        onChange(
          selectedItems.map((i) =>
            Number(i.id) === Number(item.id) ? { ...i, qty: i.qty - 1 } : i,
          ),
        );
      } else {
        onChange(selectedItems.filter((i) => Number(i.id) !== Number(item.id)));
      }
    }
  };

  const formatRupiah = (num) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 h-full">
      <div className="mb-4">
        <label className="text-sm font-semibold text-gray-700 mb-2 block">
          Pilih Item Pemeriksaan (Edit)
        </label>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Cari pemeriksaan (misal: Gula Darah, Nyamuk)..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-200 text-sm bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="max-h-[400px] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {sortedGroups.map(([groupName, items]) => {
          const filteredItems = items.filter((item) =>
            item.nama_pemeriksaan
              .toLowerCase()
              .includes(searchTerm.toLowerCase()),
          );
          if (filteredItems.length === 0) return null;
          return (
            <div key={groupName}>
              <h4 className="text-xs font-bold text-cyan-700 uppercase tracking-wider mb-2 sticky top-0 bg-gray-50 py-1 z-10">
                {groupName}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {filteredItems.map((item) => {
                  const qty = getItemQty(item.id);
                  const isSelected = qty > 0;
                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg border transition-all flex justify-between items-center ${
                        isSelected
                          ? "bg-cyan-50 border-cyan-500 shadow-sm"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <p
                          className="text-sm font-medium text-gray-800 truncate"
                          title={item.nama_pemeriksaan}
                        >
                          {item.nama_pemeriksaan}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatRupiah(item.harga)}
                          {item.kode_sampel && (
                            <span className="ml-2 text-emerald-600 font-medium">
                              ({item.kode_sampel})
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
                        <button
                          type="button"
                          onClick={() => handleRemove(item)}
                          disabled={!isSelected}
                          className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-30 transition"
                        >
                          <Minus size={12} />
                        </button>
                        <span
                          className={`text-xs font-bold w-4 text-center ${
                            isSelected ? "text-cyan-700" : "text-gray-300"
                          }`}
                        >
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAdd(item)}
                          className="w-6 h-6 flex items-center justify-center rounded bg-cyan-100 hover:bg-cyan-200 text-cyan-700 transition"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
export default function RegistrationEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // State Master Data
  const [isRestrictedMode, setIsRestrictedMode] = useState(false);
  const [masterPemeriksaan, setMasterPemeriksaan] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [totalBiaya, setTotalBiaya] = useState(0);

  // State Nomor Sampel
  const [baseSequence, setBaseSequence] = useState("");
  const [lastSampleString, setLastSampleString] = useState("");
  const [isSampleIdAvailable, setIsSampleIdAvailable] = useState(true);
  const [checkingSampleId, setCheckingSampleId] = useState(false);
  const [sampleIdMessage, setSampleIdMessage] = useState("");

  // --- STATE FORM UTAMA ---
  const [form, setForm] = useState({
    dokter: "",
    alamat_dokter: "",
    no_rekam_medik: "",
    nama_pasien: "",
    nik: "",
    tgl_lahir: "",
    umur: "",
    jenis_kelamin: "L",
    alamat: "",
    no_kontak: "",
    asal_sampel: "Mandiri",
    status_pembayaran: "berbayar",
    pengirim_instansi: "",
    tgl_daftar: "",
    waktu_daftar: "",
    tgl_pengambilan: "",
    no_reg: "",
    no_sampel_lab: "",
    petugas_input: "",
    catatan_tambahan: "",
  });

  // Load Master Data & Detail Registrasi
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const [masterRes, seqRes, res] = await Promise.all([
          api.get("/master/pemeriksaan"),
          api.get("/registrations/next-sample-seq"),
          api.get(`/registrations/${id}`),
        ]);

        let masterList = [];
        if (masterRes.data.success) {
          masterList = masterRes.data.data;
          setMasterPemeriksaan(masterList);
        }
        if (seqRes.data.success) {
          setLastSampleString(seqRes.data.last_sample_string);
        }
        const data = res.data.data;

        if (data.status !== "terdaftar") {
          setIsRestrictedMode(true);
        } else {
          setIsRestrictedMode(location.state?.restrictItems || false);
        }

        const formatDate = (d) =>
          d ? new Date(d).toISOString().split("T")[0] : "";
        const formatTime = (t) => {
          if (!t) return "";
          const dateObj = new Date(t);
          if (!isNaN(dateObj.getTime())) {
            const h = String(dateObj.getHours()).padStart(2, "0");
            const m = String(dateObj.getMinutes()).padStart(2, "0");
            return `${h}:${m}`;
          }
          return t.length >= 5 ? t.substring(0, 5) : "";
        };

        setForm({
          ...data,
          dokter: data.dokter || "",
          alamat_dokter: data.alamat_dokter || "",
          no_rekam_medik: data.no_rekam_medik || "",
          tgl_lahir: formatDate(data.tgl_lahir),
          tgl_daftar: formatDate(data.tgl_daftar),
          waktu_daftar: formatTime(data.waktu_daftar),
          tgl_pengambilan: formatDate(data.tgl_pengambilan),
          catatan_tambahan: data.catatan_tambahan || "",
          pengirim_instansi: data.pengirim_instansi || "",
          status_pembayaran: data.status_pembayaran || "berbayar",
          asal_sampel: data.asal_sampel || "Mandiri",
        });

        if (data.no_sampel_lab) {
          const firstSample = data.no_sampel_lab.split(",")[0].trim();
          const parts = firstSample.split(" ");
          if (parts.length >= 3) {
            setBaseSequence(parts[parts.length - 3]);
          }
        }

        if (data.details && Array.isArray(data.details)) {
          const grouped = {};
          data.details.forEach((detail) => {
            const pid = detail.pemeriksaan_id;
            if (!grouped[pid]) {
              const masterItem = masterList.find((m) => m.id === pid);
              grouped[pid] = {
                id: pid,
                qty: 0,
                nama_pemeriksaan: masterItem
                  ? masterItem.nama_pemeriksaan
                  : detail.nama_pemeriksaan,
                harga: Number(detail.harga_saat_ini),
                kode_sampel: masterItem ? masterItem.kode_sampel : "",
              };
            }
            grouped[pid].qty += 1;
          });
          setSelectedItems(Object.values(grouped));
        } else if (data.pemeriksaan_ids) {
          const items = data.pemeriksaan_ids
            .map((itemId) => {
              const master = masterList.find((m) => m.id === Number(itemId));
              return master ? { ...master, qty: 1 } : null;
            })
            .filter(Boolean);
          setSelectedItems(items);
        }
      } catch (err) {
        console.error(err);
        toast.error("Gagal memuat data registrasi");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [id, navigate]);

  // Kalkulasi Biaya
  useEffect(() => {
    if (form.status_pembayaran === "gratis") {
      setTotalBiaya(0);
    } else {
      const total = selectedItems.reduce(
        (sum, item) => sum + Number(item.harga) * item.qty,
        0,
      );
      setTotalBiaya(total);
    }
  }, [selectedItems, form.status_pembayaran]);

  // --- LOGIC PENOMORAN OTOMATIS BERDASARKAN BASE SEQUENCE ---
  const requiredInstallations = useMemo(() => {
    const codes = selectedItems
      .map((item) => item.kode_sampel || "UMUM")
      .filter(Boolean);
    const uniqueCodes = [...new Set(codes)];
    return uniqueCodes.sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
    );
  }, [selectedItems]);

  useEffect(() => {
    const bulan = new Date().getMonth() + 1;
    const tahun = new Date().getFullYear();

    if (requiredInstallations.length > 0 && baseSequence !== "") {
      const startNum = parseInt(baseSequence, 10) || 1;
      const parts = requiredInstallations.map((kode) => {
        return `${kode} ${startNum} ${bulan} ${tahun}`;
      });

      setForm((prev) => ({ ...prev, no_sampel_lab: parts.join(", ") }));
    } else {
      setForm((prev) => ({ ...prev, no_sampel_lab: "" }));
    }
  }, [baseSequence, requiredInstallations]);

  // --- CEK KETERSEDIAAN NOMOR SAMPEL (EXCLUDE CURRENT ID) ---
  useEffect(() => {
    const checkSampleId = async () => {
      const sampleId = form.no_sampel_lab?.trim();
      if (!sampleId) {
        setIsSampleIdAvailable(true);
        setSampleIdMessage("");
        return;
      }

      setCheckingSampleId(true);
      try {
        const safeId = encodeURIComponent(sampleId);
        const res = await api.get(
          `/registrations/check-sample-no/${safeId}?excludeId=${id}`,
        );

        if (res.data.available) {
          setIsSampleIdAvailable(true);
          setSampleIdMessage("Semua nomor sampel tersedia ✅");
        } else {
          setIsSampleIdAvailable(false);
          setSampleIdMessage(
            "Terdapat nomor sampel yang bentrok/sudah digunakan ❌",
          );
        }
      } catch (error) {
        console.error("Gagal cek nomor sampel", error);
      } finally {
        setCheckingSampleId(false);
      }
    };

    const timeoutId = setTimeout(() => {
      if (form.no_sampel_lab) {
        checkSampleId();
      }
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [form.no_sampel_lab, id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAsalSampelChange = (e) => {
    const val = e.target.value;    
    setForm((prev) => ({
      ...prev,
      asal_sampel: val,
      status_pembayaran: val === "Mandiri" ? "berbayar" : prev.status_pembayaran,
    }));
  };

  // Auto Calculate Age
  useEffect(() => {
    if (form.tgl_lahir) {
      const today = new Date();
      const birthDate = new Date(form.tgl_lahir);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      setForm((prev) => ({ ...prev, umur: Math.max(age, 0) }));
    }
  }, [form.tgl_lahir]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isSampleIdAvailable) {
      toast.error(
        "Nomor Sampel Lab sudah digunakan pasien lain! Ganti nomor urut start.",
      );
      return;
    }

    if (checkingSampleId) {
      toast.info("Sedang memverifikasi nomor sampel...");
      return;
    }

    if (selectedItems.length === 0) {
      toast.warning("Mohon pilih minimal satu jenis pemeriksaan");
      return;
    }

    setSaving(true);

    const {
      no_reg,
      id: _,
      created_at,
      updated_at,
      jenis_pemeriksaan,
      total_biaya,
      details,
      ...cleanForm
    } = form;

    const payload = {
      ...cleanForm,
      umur:
        cleanForm.umur !== "" && cleanForm.umur !== null
          ? Number(cleanForm.umur)
          : null,
      items: selectedItems.map((item) => ({ id: item.id, qty: item.qty })),
    };

    // Hanya kirim array items jika sedang TIDAK dalam mode terkunci
    if (!isRestrictedMode) {
      payload.items = selectedItems.map((item) => ({
        id: item.id,
        qty: item.qty,
      }));
    }

    Object.keys(payload).forEach((k) => {
      if (payload[k] === "") payload[k] = null;
    });

    try {
      await api.put(`/registrations/${id}`, payload);
      toast.success("Perubahan berhasil disimpan");
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      let errorMessage = "Gagal menyimpan perubahan";
      if (err.response?.data?.message) {
        errorMessage =
          typeof err.response.data.message === "string"
            ? err.response.data.message
            : JSON.stringify(err.response.data.message);
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      toast.error("Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const renderHighlightedSequence = (str) => {
    if (
      !str ||
      str === "Belum ada data registrasi" ||
      str === "Error memuat data terakhir"
    ) {
      return str;
    }

    const samples = str.split(",").map((s) => s.trim());

    return samples.map((sample, sIndex) => {
      const parts = sample.split(" ");
      if (parts.length >= 3) {
        const seqIndex = parts.length - 3;
        return (
          <span key={sIndex}>
            {sIndex > 0 && ", "}
            {parts.map((part, pIndex) => (
              <span key={pIndex}>
                {pIndex === seqIndex ? (
                  <span className="text-black font-black mx-0.5">{part}</span>
                ) : (
                  <span className="text-yellow-900">{part}</span>
                )}
                {pIndex < parts.length - 1 && " "}
              </span>
            ))}
          </span>
        );
      }

      return (
        <span key={sIndex}>
          {sIndex > 0 && ", "}
          {sample}
        </span>
      );
    });
  };

  const formatRupiah = (num) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-cyan-600" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20 animate-fade-in">
      <div className="max-w-6xl mx-auto py-10 px-6">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-800 font-medium transition"
          >
            <div className="p-2 bg-white rounded-lg border border-gray-200 hover:border-gray-300">
              <ArrowLeft size={18} />
            </div>
            Kembali ke Dashboard
          </button>
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">
              Mode Edit
            </p>
            <h1 className="text-xl font-bold text-gray-800">
              Ubah Data Registrasi
            </h1>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* HEADER (Disinkronkan dengan RegistrationForm) */}
          <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 border-b border-gray-100 pb-4 gap-4">
            <div>
              <p className="text-xs font-bold text-cyan-700 uppercase">
                No. Registrasi
              </p>
              <h2 className="text-xl font-mono font-bold text-gray-800">
                {form.no_reg}
              </h2>
            </div>

            <div className="flex flex-row items-end gap-2 p-2 rounded-xl">
              <FormSelect
                label="Asal Sampel"
                name="asal_sampel"
                value={form.asal_sampel}
                onChange={handleAsalSampelChange}
              >
                <option value="Mandiri">Mandiri (Umum)</option>
                <option value="Rujukan">Rujukan (Faskes/RS)</option>
              </FormSelect>

              {form.asal_sampel === "Rujukan" && (
                <FormSelect
                  label="Status Pembayaran"
                  name="status_pembayaran"
                  value={form.status_pembayaran}
                  onChange={handleChange}
                >
                  <option value="berbayar">Berbayar</option>
                  <option value="gratis">Tidak Berbayar / Program</option>
                </FormSelect>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
              <AlertCircle size={20} />
              <span>
                {typeof error === "object" ? JSON.stringify(error) : error}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* SECTION 1: IDENTITAS PASIEN */}
            <div>
              <h3 className="text-base font-bold text-cyan-700 mb-4 flex items-center gap-2">
                <User size={18} /> Identitas Pasien
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <FormInput
                  label="NIK"
                  name="nik"
                  value={form.nik}
                  type="text"
                  required
                  inputMode="numeric"
                  onChange={(e) => {
                    const rawValue = e.target.value;
                    const cleanValue = rawValue.replace(/\D/g, "");
                    if (cleanValue.length <= 16) {
                      handleChange({
                        target: { name: "nik", value: cleanValue },
                      });
                    }
                  }}
                  placeholder="16 digit NIK"
                />
                <FormInput
                  label="No. Rekam Medik (RM)"
                  name="no_rekam_medik"
                  value={form.no_rekam_medik}
                  onChange={handleChange}
                  placeholder="Contoh: RM-12345"
                />
                <FormInput
                  label="Dokter"
                  name="dokter"
                  value={form.dokter}
                  onChange={handleChange}
                  placeholder="Nama Dokter (opsional)"
                />
                <FormInput
                  label="Alamat Dokter"
                  name="alamat_dokter"
                  value={form.alamat_dokter}
                  onChange={handleChange}
                  placeholder="Asal Klinik/RS Dokter (opsional)"
                />
                <FormInput
                  label="Nama Lengkap"
                  name="nama_pasien"
                  value={form.nama_pasien}
                  onChange={handleChange}
                  required
                  placeholder="Nama sesuai KTP"
                />
                <div className="grid grid-cols-2 gap-3">
                  <FormInput
                    label="Tgl Lahir"
                    type="date"
                    name="tgl_lahir"
                    value={form.tgl_lahir}
                    onChange={handleChange}
                  />
                  <FormInput
                    label="Umur (Th)"
                    type="number"
                    name="umur"
                    value={form.umur}
                    onChange={handleChange}
                    placeholder="Otomatis"
                  />
                </div>
                <FormSelect
                  label="Jenis Kelamin"
                  name="jenis_kelamin"
                  value={form.jenis_kelamin}
                  onChange={handleChange}
                >
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </FormSelect>
                <FormInput
                  label="No. Kontak / HP"
                  name="no_kontak"
                  value={form.no_kontak}
                  onChange={handleChange}
                  placeholder="08..."
                />
                <div className="lg:col-span-3">
                  <FormTextarea
                    label="Alamat Lengkap"
                    name="alamat"
                    value={form.alamat}
                    onChange={handleChange}
                    placeholder="Jalan, Desa, Kecamatan..."
                  />
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* SECTION 2: DATA PEMERIKSAAN */}
            <div>
              <h3 className="text-base font-bold text-cyan-700 mb-4 flex items-center gap-2">
                <FlaskConical size={18} /> Pilih Pemeriksaan
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  {isRestrictedMode ? (
                    <div className="border border-gray-200 rounded-xl p-5 bg-gray-50/50 h-full">
                      <div className="mb-4 bg-blue-50 text-blue-700 p-3 rounded-lg text-xs font-medium border border-blue-100 flex items-start gap-2">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <p>
                          Anda sedang berada di mode Manajemen Data Akhir.
                          Penambahan atau pengurangan item uji sudah dikunci.
                          Anda hanya bisa mengubah data identitas pasien.
                        </p>
                      </div>
                      <div className="space-y-2">
                        {selectedItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg shadow-sm"
                          >
                            <div>
                              <p className="text-sm font-bold text-gray-800">
                                {item.nama_pemeriksaan}
                              </p>
                              <p className="text-[10px] text-gray-500">
                                {formatRupiah(item.harga)}
                              </p>
                            </div>
                            <span className="bg-cyan-100 text-cyan-800 px-2 py-1 rounded text-xs font-bold border border-cyan-200">
                              Qty: {item.qty}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <ExaminationSelector
                      masterData={masterPemeriksaan}
                      selectedItems={selectedItems}
                      onChange={setSelectedItems}
                    />
                  )}
                </div>

                <div className="space-y-4">
                  {/* PANEL ESTIMASI BIAYA */}
                  <div className="bg-cyan-50 p-4 rounded-xl border border-cyan-100 flex flex-col h-auto relative">
                    {totalBiaya === 0 &&
                      form.status_pembayaran === "gratis" && (
                        <span className="absolute top-4 right-4 bg-green-100 text-green-700 text-[10px] px-2 py-1 rounded-md font-bold border border-green-200">
                          GRATIS / SUBSIDI
                        </span>
                      )}
                    <div>
                      <p className="text-sm text-cyan-800 mb-1">
                        Total Estimasi Biaya
                      </p>
                      <p className="text-2xl font-bold text-cyan-700">
                        {formatRupiah(totalBiaya)}
                      </p>
                    </div>

                    {selectedItems.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-cyan-200/50">
                        <p className="text-[10px] uppercase font-bold text-cyan-800 mb-2">
                          Item Terpilih:
                        </p>
                        <ul className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                          {selectedItems.map((item) => (
                            <li
                              key={item.id}
                              className="text-xs text-cyan-900 flex justify-between border-b border-cyan-100 pb-1 last:border-0 items-center"
                            >
                              <span
                                className="truncate w-1/2"
                                title={item.nama_pemeriksaan}
                              >
                                {item.nama_pemeriksaan}
                              </span>
                              <div className="flex gap-2">
                                <span className="font-bold text-xs bg-white px-1.5 rounded border border-cyan-200 text-cyan-700">
                                  x{item.qty}
                                </span>
                                <span className="font-mono text-cyan-700">
                                  {
                                    formatRupiah(item.harga * item.qty).split(
                                      ",",
                                    )[0]
                                  }
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* INPUT PENGIRIM INSTANSI BERDIRI SENDIRI DI SINI */}
                  <FormInput
                    label="Pengirim/Instansi"
                    name="pengirim_instansi"
                    value={form.pengirim_instansi}
                    onChange={handleChange}
                    placeholder="Jika ada (Nama Dokter / RS / Klinik)"
                  />

                  {/* PANEL GENERATE NOMOR SAMPEL TERPUSAT */}
                  <div
                    className={`space-y-3 bg-white p-4 border border-gray-200 rounded-xl shadow-sm ${
                      isRestrictedMode ? "opacity-70 pointer-events-none" : ""
                    }`}
                  >
                    <label className="text-sm font-bold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-2">
                      <Settings2 size={16} className="text-cyan-600" />
                      Konfigurasi Nomor Sampel
                    </label>

                    {/* INFO NOMOR TERAKHIR */}
                    <div className="bg-yellow-50/80 border border-yellow-200 rounded-lg p-2.5 mb-2 shadow-sm">
                      <p className="text-[10px] text-yellow-700 font-bold uppercase mb-0.5">
                        Riwayat Nomor Terakhir Database:
                      </p>
                      <p className="text-xs font-mono font-medium wrap-break-word leading-tight items-center flex flex-wrap">
                        {renderHighlightedSequence(lastSampleString)}
                      </p>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-600">
                        Start Nomor Urut Baru (Bisa diubah manual)
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        disabled={isRestrictedMode}
                        className={`w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 outline-none text-sm font-bold ${
                          isRestrictedMode
                            ? "bg-gray-100 cursor-not-allowed text-gray-500"
                            : ""
                        }`}
                        value={baseSequence}
                        onChange={(e) =>
                          setBaseSequence(e.target.value.replace(/\D/g, ""))
                        }
                        placeholder="Masukkan Angka..."
                      />
                    </div>

                    {requiredInstallations.length === 0 ? (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-500 text-center italic">
                        Pilih item pemeriksaan di sebelah kiri untuk melihat
                        preview nomor
                      </div>
                    ) : (
                      <div className="space-y-2 mt-2">
                        <p className="text-[11px] font-medium text-gray-500">
                          Preview {requiredInstallations.length} Tabung/Sampel
                          Fisik (Otomatis):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {requiredInstallations.map((kode, index) => {
                            const startNum = parseInt(baseSequence, 10) || 1;
                            return (
                              <div
                                key={kode}
                                className="bg-cyan-50 border border-cyan-200 text-cyan-800 px-3 py-1.5 rounded-md text-xs font-bold font-mono shadow-sm"
                              >
                                {kode}{" "}
                                <span className="text-cyan-600">
                                  {startNum}
                                </span>{" "}
                                {new Date().getMonth() + 1}{" "}
                                {new Date().getFullYear()}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Pesan ketersediaan database */}
                    {form.no_sampel_lab && (
                      <div className="flex flex-col mt-2 pt-2 border-t border-gray-100">
                        <span
                          className={`text-xs font-medium flex items-center gap-1 ${
                            isSampleIdAvailable
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {checkingSampleId
                            ? "Memeriksa ketersediaan DB..."
                            : sampleIdMessage}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* SECTION 3: KETERANGAN TAMBAHAN & ADMIN */}
            <div>
              <h3 className="text-base font-bold text-gray-500 mb-4 flex items-center gap-2">
                <FileSpreadsheet size={18} /> Keterangan Tambahan & Admin
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormInput
                  label="Tgl Daftar"
                  type="date"
                  name="tgl_daftar"
                  value={form.tgl_daftar}
                  onChange={handleChange}
                  icon={CalendarDays}
                />
                <FormInput
                  label="Jam Daftar"
                  type="time"
                  name="waktu_daftar"
                  value={form.waktu_daftar}
                  onChange={handleChange}
                  icon={Clock}
                />
                <div className="md:col-span-2">
                  <FormTextarea
                    label="Catatan Tambahan"
                    name="catatan_tambahan"
                    value={form.catatan_tambahan}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
              <button
                type="submit"
                disabled={saving || !isSampleIdAvailable}
                className="flex items-center gap-2 px-6 py-3 bg-linear-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-cyan-200 hover:shadow-cyan-300 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  "Menyimpan..."
                ) : (
                  <>
                    <Save size={18} /> Simpan Perubahan
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
