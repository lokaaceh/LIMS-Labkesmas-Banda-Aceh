// pages/RegistrationForm.jsx
import { useState, useEffect, useMemo } from "react";
import api from "../api/axios";
import { toast } from "react-toastify";
import {
  Save,
  User,
  FlaskConical,
  FileSpreadsheet,
  Search,
  Plus,
  Loader2,
  Minus,
  Settings2,
} from "lucide-react";

// --- Reusable Components ---
const FormInput = ({ label, icon: Icon, type = "text", ...props }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
      {Icon && <Icon size={14} className="text-cyan-600" />}
      {label}
    </label>
    <input
      type={type}
      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all outline-none text-sm text-gray-800 placeholder-gray-400"
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

const FormTextarea = ({ label, ...props }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-semibold text-gray-700">{label}</label>
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
    const found = selectedItems.find((i) => i.id === id);
    return found ? found.qty : 0;
  };

  const handleAdd = (item) => {
    const existing = selectedItems.find((i) => i.id === item.id);
    if (existing) {
      onChange(
        selectedItems.map((i) =>
          i.id === item.id ? { ...i, qty: i.qty + 1 } : i,
        ),
      );
    } else {
      onChange([...selectedItems, { ...item, qty: 1 }]);
    }
  };

  const handleRemove = (item) => {
    const existing = selectedItems.find((i) => i.id === item.id);
    if (existing) {
      if (existing.qty > 1) {
        onChange(
          selectedItems.map((i) =>
            i.id === item.id ? { ...i, qty: i.qty - 1 } : i,
          ),
        );
      } else {
        onChange(selectedItems.filter((i) => i.id !== item.id));
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
    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
      <div className="mb-4">
        <label className="text-sm font-semibold text-gray-700 mb-2 block">
          Pilih Item Pemeriksaan (SK Retribusi)
        </label>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Cari pemeriksaan (misal: Gula Darah, Nyamuk)..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-200 text-sm"
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
export default function RegistrationForm({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [masterPemeriksaan, setMasterPemeriksaan] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [totalBiaya, setTotalBiaya] = useState(0);

  const [form, setForm] = useState({
    dokter: "",
    alamat_dokter: "",
    no_rekam_medik: "",
    nama_pasien: "",
    nik: "",
    no_sampel_lab: "",
    tgl_lahir: "",
    umur: "",
    jenis_kelamin: "L",
    alamat: "",
    no_kontak: "",
    asal_sampel: "Mandiri",
    status_pembayaran: "berbayar",
    pengirim_instansi: "",
    tgl_pengambilan: "",
    catatan_tambahan: "",
  });

  const [checkingNik, setCheckingNik] = useState(false);
  const [isSampleIdAvailable, setIsSampleIdAvailable] = useState(true);
  const [checkingSampleId, setCheckingSampleId] = useState(false);
  const [sampleIdMessage, setSampleIdMessage] = useState("");

  // --- STATE BARU: Base Sequence untuk Penomoran Master ---
  const [baseSequence, setBaseSequence] = useState("");
  const [lastSampleString, setLastSampleString] = useState("");

  const [lastRmString, setLastRmString] = useState("-");
  const [checkingRm, setCheckingRm] = useState(false);

  // Fetch Master Data & Inisialisasi Base Sequence HANYA SEKALI saat awal render
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [masterRes, seqRes, rmRes] = await Promise.all([
          api.get("/master/pemeriksaan"),
          api.get("/registrations/next-sample-seq"),
          api.get("/registrations/next-rm"),
        ]);

        if (masterRes.data.success) setMasterPemeriksaan(masterRes.data.data);
        if (seqRes.data.success) {
          setBaseSequence(seqRes.data.next_seq.toString());
          setLastSampleString(seqRes.data.last_sample_string);
        }
        if (rmRes.data.success) {
          setForm((prev) => ({
            ...prev,
            no_rekam_medik: rmRes.data.data.next_rm,
          }));
          setLastRmString(rmRes.data.data.last_rm);
        }
      } catch (err) {
        console.error("Gagal load initial data", err);
        toast.error("Gagal memuat data dari server");
      }
    };
    fetchInitialData();
  }, []);

  // HITUNG TOTAL BIAYA
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

  // CARI INSTALASI YANG DIBUTUHKAN (Unique)
  const requiredInstallations = useMemo(() => {
    const codes = selectedItems
      .map((item) => item.kode_sampel || "UMUM")
      .filter(Boolean);

    // Sort agar urutannya konsisten 1 IMB, 2 IPK, dst.
    const uniqueCodes = [...new Set(codes)];
    return uniqueCodes.sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
    );
  }, [selectedItems]);

  // --- LOGIC PENOMORAN OTOMATIS BERDASARKAN BASE SEQUENCE ---
  useEffect(() => {
    const bulan = new Date().getMonth() + 1;
    const tahun = new Date().getFullYear();

    if (requiredInstallations.length > 0 && baseSequence !== "") {
      const startNum = parseInt(baseSequence, 10) || 1;

      const parts = requiredInstallations.map((kode) => {
        const urut = startNum;
        return `${kode} ${urut} ${bulan} ${tahun}`;
      });

      setForm((prev) => ({ ...prev, no_sampel_lab: parts.join(", ") }));
    } else {
      setForm((prev) => ({ ...prev, no_sampel_lab: "" }));
    }
  }, [baseSequence, requiredInstallations]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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

  const handleCheckNik = async (nikValue) => {
    if (nikValue?.length !== 16) return;
    setCheckingNik(true);
    try {
      const res = await api.get(`/registrations/check-nik/${nikValue}`);
      if (res.data.success) {
        if (res.data.found) {
          const patient = res.data.data;
          setForm((prev) => {
            let calculatedAge = "";
            if (patient.tgl_lahir) {
              const today = new Date();
              const birthDate = new Date(patient.tgl_lahir);
              let age = today.getFullYear() - birthDate.getFullYear();
              const m = today.getMonth() - birthDate.getMonth();
              if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
              }
              calculatedAge = Math.max(age, 0);
            }

            return {
              ...prev,
              nama_pasien: patient.nama_pasien || "",
              tgl_lahir: patient.tgl_lahir
                ? new Date(patient.tgl_lahir).toISOString().split("T")[0]
                : "",
              umur: calculatedAge,
              jenis_kelamin: patient.jenis_kelamin || "L",
              alamat: patient.alamat || "",
              no_kontak: patient.no_kontak || "",
              no_rekam_medik: patient.no_rekam_medik || prev.no_rekam_medik,
            };
          });

          toast.success(`Data pasien lama ditemukan: ${patient.nama_pasien}`);
        } else {
          setForm((prev) => ({
            ...prev,
            nama_pasien: "",
            tgl_lahir: "",
            umur: "",
            jenis_kelamin: "L",
            alamat: "",
            no_kontak: "",
          }));
          toast.info("Pasien belum terdaftar. Silakan isi manual.");
        }
      }
    } catch (error) {
      console.error("Gagal cek NIK", error);
    } finally {
      setCheckingNik(false);
    }
  };

  const handleCheckRm = async (rmValue) => {
    if (!rmValue) return;
    setCheckingRm(true);
    try {
      const res = await api.get(`/registrations/check-rm/${rmValue}`);
      if (res.data.success) {
        if (res.data.found) {
          const patient = res.data.data;
          setForm((prev) => {
            // ... logic kalkulasi umur (sama seperti di NIK)
            let calculatedAge = "";
            if (patient.tgl_lahir) {
              const today = new Date();
              const birthDate = new Date(patient.tgl_lahir);
              let age = today.getFullYear() - birthDate.getFullYear();
              const m = today.getMonth() - birthDate.getMonth();
              if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate()))
                age--;
              calculatedAge = Math.max(age, 0);
            }

            return {
              ...prev,
              nik: patient.nik || "", // <-- Ambil NIK lama
              nama_pasien: patient.nama_pasien || "",
              tgl_lahir: patient.tgl_lahir
                ? new Date(patient.tgl_lahir).toISOString().split("T")[0]
                : "",
              umur: calculatedAge,
              jenis_kelamin: patient.jenis_kelamin || "L",
              alamat: patient.alamat || "",
              no_kontak: patient.no_kontak || "",
            };
          });
          toast.success(
            `Data pasien ditemukan dari No. RM: ${patient.nama_pasien}`,
          );
        }
        // Jika RM tidak ditemukan, anggap RM baru (manual override), jangan clear form
      }
    } catch (error) {
      console.error("Gagal cek RM", error);
    } finally {
      setCheckingRm(false);
    }
  };

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
        const res = await api.get(`/registrations/check-sample-no/${safeId}`);

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
  }, [form.no_sampel_lab]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.nik && form.nik.length !== 16) {
      toast.error("NIK harus berjumlah tepat 16 digit!");
      return;
    }

    if (!isSampleIdAvailable) {
      toast.error("Nomor Sampel Lab sudah digunakan! Ganti nomor urut start.");
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

    if (!baseSequence || baseSequence === "") {
      toast.warning("Mohon isi Nomor Start Urutan Sampel");
      return;
    }

    const payload = {
      ...form,
      items: selectedItems.map((item) => ({ id: item.id, qty: item.qty })),
    };

    Object.keys(payload).forEach((key) => {
      if (payload[key] === "") payload[key] = null;
    });

    try {
      await api.post("/registrations", payload);
      toast.success("Registrasi berhasil dibuat!");
      if (onSuccess) onSuccess();

      const [seqRes, rmRes] = await Promise.all([
        api.get("/registrations/next-sample-seq"),
        api.get("/registrations/next-rm"),
      ]);

      if (seqRes.data.success) {
        setBaseSequence(seqRes.data.next_seq.toString());
        setLastSampleString(seqRes.data.last_sample_string);
      }
      if (rmRes.data.success) {
        setLastRmString(rmRes.data.data.last_rm);
      }

      setForm({
        ...form,
        dokter: "",
        alamat_dokter: "", // <-- clear
        no_rekam_medik: rmRes.data?.data?.next_rm || "",
        nama_pasien: "",
        nik: "",
        no_sampel_lab: "",
        waktu_daftar: new Date().toLocaleTimeString("it-IT", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
      setSelectedItems([]);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Gagal menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  // --- HELPER UNTUK HIGHLIGHT NOMOR TERAKHIR ---
  const renderHighlightedSequence = (str) => {
    // Abaikan jika string kosong atau berupa pesan error dari backend
    if (
      !str ||
      str === "Belum ada data registrasi" ||
      str === "Error memuat data terakhir"
    ) {
      return str;
    }

    // Pisah berdasarkan koma jika ada lebih dari 1 sampel (misal: "1 IMB 5 2 2026, 2 IPK 5 2 2026")
    const samples = str.split(",").map((s) => s.trim());

    return samples.map((sample, sIndex) => {
      const parts = sample.split(" ");

      // Nomor urut selalu berada di posisi ke-3 dari belakang (Kode URUT Bulan Tahun)
      if (parts.length >= 3) {
        const seqIndex = parts.length - 3;

        return (
          <span key={sIndex}>
            {sIndex > 0 && ", "}
            {parts.map((part, pIndex) => (
              <span key={pIndex}>
                {pIndex === seqIndex ? (
                  // Style angka urutan disamakan dengan preview (cyan-600 & ditebalkan)
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

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
      {/* HEADER YANG SUDAH DIUPDATE - Asal Sampel & Status dipindah ke sini */}
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 border-b border-gray-100 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Registrasi Pasien Baru (BLKM)
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Lengkapi formulir dan pilih jenis pemeriksaan sesuai SK Retribusi.
          </p>
        </div>

        <div className="flex flex-row items-end gap-2 p-2 rounded-xl">
          <FormSelect
            label="Asal Sampel"
            name="asal_sampel"
            value={form.asal_sampel}
            onChange={(e) => {
              const newVal = e.target.value;
              setForm((prev) => ({
                ...prev,
                asal_sampel: newVal,
                status_pembayaran:
                  newVal === "Mandiri" ? "berbayar" : prev.status_pembayaran,
              }));
            }}
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

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <h3 className="text-base font-bold text-cyan-700 mb-4 flex items-center gap-2">
            <User size={18} /> Identitas Pasien
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="relative">
              <FormInput
                label="NIK"
                name="nik"
                value={form.nik}
                type="text"
                required
                inputMode="numeric"
                onBlur={(e) => handleCheckNik(e.target.value)}
                onChange={(e) => {
                  const rawValue = e.target.value;
                  const cleanValue = rawValue.replace(/\D/g, "");
                  if (cleanValue.length <= 16) {
                    handleChange({
                      target: { name: "nik", value: cleanValue },
                    });
                    if (cleanValue.length === 16) {
                      handleCheckNik(cleanValue);
                    }
                  }
                }}
                placeholder="16 digit NIK"
              />
              {checkingNik && (
                <div className="absolute top-[34px] right-3">
                  <Loader2 className="animate-spin text-cyan-600" size={18} />
                </div>
              )}
            </div>
            <div className="relative">
              <FormInput
                label="No. Rekam Medik (RM)"
                name="no_rekam_medik"
                value={form.no_rekam_medik}
                onChange={handleChange}
                onBlur={(e) => handleCheckRm(e.target.value)}
                placeholder="Contoh: 0001"
              />
              <span className="absolute left-0 -top-5 text-[10px] text-cyan-600 font-medium">
                No. RM Terakhir: {lastRmString}
              </span>
              {checkingRm && (
                <div className="absolute top-[34px] right-3">
                  <Loader2 className="animate-spin text-cyan-600" size={18} />
                </div>
              )}
            </div>
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
              <ExaminationSelector
                masterData={masterPemeriksaan}
                selectedItems={selectedItems}
                onChange={setSelectedItems}
              />
            </div>

            <div className="space-y-4">
              <div className="bg-cyan-50 p-4 rounded-xl border border-cyan-100 flex flex-col h-auto">
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

              {/* INPUT PENGIRIM INSTANSI SEKARANG BERDIRI SENDIRI DI SINI */}
              <FormInput
                label="Pengirim/Instansi"
                name="pengirim_instansi"
                value={form.pengirim_instansi}
                onChange={handleChange}
                placeholder="Jika ada"
              />

              {/* === PANEL GENERATE NOMOR SAMPEL TERPUSAT === */}
              <div className="space-y-3 bg-white p-4 border border-gray-200 rounded-xl shadow-sm">
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

                {/* Input Khusus Start Nomor Urut */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">
                    Start Nomor Urut Baru (Bisa diubah manual)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 outline-none text-sm font-bold"
                    value={baseSequence}
                    onChange={(e) =>
                      setBaseSequence(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="Masukkan Angka..."
                  />
                </div>

                {requiredInstallations.length === 0 ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-500 text-center italic">
                    Pilih item pemeriksaan di sebelah kiri untuk melihat preview
                    nomor
                  </div>
                ) : (
                  <div className="space-y-2 mt-2">
                    <p className="text-[11px] font-medium text-gray-500">
                      Preview {requiredInstallations.length} Tabung/Sampel Fisik
                      (Otomatis):
                    </p>

                    {/* Hasil Generate Label (Read-Only UI) */}
                    <div className="flex flex-wrap gap-2">
                      {requiredInstallations.map((kode, index) => {
                        const startNum = parseInt(baseSequence, 10) || 1;
                        return (
                          <div
                            key={kode}
                            className="bg-cyan-50 border border-cyan-200 text-cyan-800 px-3 py-1.5 rounded-md text-xs font-bold font-mono shadow-sm"
                          >
                            {kode}{" "}
                            <span className="text-cyan-600">{startNum}</span>{" "}
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
                        isSampleIdAvailable ? "text-green-600" : "text-red-600"
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

        <div>
          <h3 className="text-base font-bold text-gray-500 mb-4 flex items-center gap-2">
            <FileSpreadsheet size={18} /> Keterangan Tambahan
          </h3>
          <div className="lg:col-span-3">
            <FormTextarea
              label="Catatan Tambahan"
              name="catatan_tambahan"
              value={form.catatan_tambahan}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-linear-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-cyan-200 hover:shadow-cyan-300 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              "Menyimpan..."
            ) : (
              <>
                <Save size={18} /> Simpan Registrasi
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
