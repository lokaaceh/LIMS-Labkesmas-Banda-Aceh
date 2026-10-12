import { useState, useEffect, useMemo } from "react";
import api from "../../../api/axios.js";
import { toast } from "react-toastify";
import {
  Save,
  Building2,
  FlaskConical,
  Search,
  Plus,
  Minus,
  Settings2,
  CheckSquare,
  Wallet,
  Bug,
  Droplet,
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

// --- EXAMINATION SELECTOR KESLING ---
const KeslingExaminationSelector = ({
  selectedItems,
  onChange,
  masterData,
  kategori,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMaster = useMemo(() => {
    return masterData.filter((item) => {
      const nama = item.nama_pemeriksaan.toLowerCase();
      const inst = (item.nama_instalasi || "").toLowerCase();

      if (kategori.includes("vektor")) {
        return (
          inst.includes("vektor") ||
          nama.includes("nyamuk") ||
          nama.includes("plasmodium")
        );
      }

      return (
        (inst.includes("kesling") ||
          inst.includes("kesehatan lingkungan") ||
          inst.includes("kimia")) &&
        !inst.includes("klinik") // Pastikan tidak menarik data Patologi Klinik
      );
    });
  }, [masterData, kategori]);

  // Kelompokkan master data berdasarkan Nama Instalasi
  const groupedData = filteredMaster.reduce((acc, item) => {
    const groupName = item.nama_instalasi
      ? item.nama_instalasi.toUpperCase()
      : "LAINNYA / KESLING";

    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(item);
    return acc;
  }, {});

  const sortedGroups = Object.entries(groupedData).sort((a, b) => {
    const groupA = a[0];
    const groupB = b[0];
    if (groupA === "LAINNYA / KESLING") return 1;
    if (groupB === "LAINNYA / KESLING") return -1;
    return groupA.localeCompare(groupB);
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
          Pilih Item Pemeriksaan
        </label>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Cari parameter uji..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-200 text-sm bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="max-h-[380px] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {sortedGroups.map(([groupName, items]) => {
          const filteredItems = items.filter((item) =>
            item.nama_pemeriksaan
              .toLowerCase()
              .includes(searchTerm.toLowerCase()),
          );
          if (filteredItems.length === 0) return null;

          return (
            <div key={groupName}>
              <div className="mb-2 sticky top-0 bg-gray-50 py-1 z-10 border-b border-gray-200">
                <h4 className="text-xs font-bold text-cyan-700 uppercase tracking-wider">
                  {groupName}
                </h4>
              </div>

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

// Helper kecil untuk tombol plus
const AddItemSafely = (item, handleAdd) => {
  handleAdd(item);
};

// --- MAIN KESLING FORM ---
export default function KeslingForm({
  kategoriDefault = "kesling_ppc",
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [masterPemeriksaan, setMasterPemeriksaan] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [totalBiaya, setTotalBiaya] = useState(0);

  const [form, setForm] = useState({
    kategori: kategoriDefault,
    nama_pelanggan: "",
    alamat_pelanggan: "",
    no_telepon: "",
    nomor_sampel: "",
    kondisi_sampel: "Baik / Memenuhi Syarat",
    asal_sampel: "Mandiri",
    kode_laboratorium: "",
    tempat_analisa: "Laboratorium Kesling BLKM",
    tgl_penerimaan: new Date().toISOString().split("T")[0],
    petugas_pengambil_sampel: "",
    is_sample_picked_up: false,
    catatan: "",
  });

  const [baseSequence, setBaseSequence] = useState("1");
  const [lastSampleString, setLastSampleString] = useState("-");

  // Fetch Master Data & Seq Terakhir Kesling
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [masterRes, seqRes] = await Promise.all([
          api.get("/master/pemeriksaan"),
          api.get(`/kesling/next-sample-seq?kategori=${form.kategori}`),
        ]);
        if (masterRes.data.success) {
          setMasterPemeriksaan(masterRes.data.data);
        }
        if (seqRes.data.success) {
          setBaseSequence(seqRes.data.next_seq.toString());
          setLastSampleString(seqRes.data.last_sample_string);
        }
      } catch (error) {
        console.error("Gagal memuat data awal Kesling", error);
      }
    };
    fetchInitialData();
  }, [form.kategori]);

  // Hitung total estimasi biaya
  useEffect(() => {
    const total = selectedItems.reduce(
      (sum, item) => sum + Number(item.harga || 0) * item.qty,
      0,
    );
    setTotalBiaya(total);
  }, [selectedItems]);

  // Auto Generate Nomor Sampel Berdasarkan Base Sequence & Kategori
  useEffect(() => {
    const now = new Date();
    const tahun = now.getFullYear();
    const bulan = String(now.getMonth() + 1).padStart(2, "0");
    const hari = String(now.getDate()).padStart(2, "0");
    const datePart = `${tahun}${bulan}${hari}`; // Format YYYYMMDD

    if (baseSequence !== "") {
      const startNum = parseInt(baseSequence, 10) || 1;
      const seqString = String(startNum).padStart(3, "0");

      const prefix = form.kategori.includes("vektor") ? "VKT" : "KES";
      const generatedNumber = `${prefix}-${datePart}-${seqString}`;

      setForm((prev) => ({ ...prev, nomor_sampel: generatedNumber }));
    } else {
      setForm((prev) => ({ ...prev, nomor_sampel: "" }));
    }
  }, [baseSequence, form.kategori]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nama_pelanggan) {
      toast.warning("Nama Pelanggan wajib diisi!");
      return;
    }
    if (selectedItems.length === 0) {
      toast.warning("Mohon pilih minimal satu parameter pengujian!");
      return;
    }

    setLoading(true);
    try {
      let max_seq = parseInt(baseSequence, 10) || 0;
      const payload = {
        ...form,
        total_biaya: totalBiaya,
        last_sample_seq: max_seq,
        items: selectedItems.map((item) => ({
          parameter_uji: item.nama_pemeriksaan,
          nilai_rujukan: item.nilai_rujukan,
          satuan: item.satuan,
          metode: item.metode,
          harga: item.harga,
          qty: item.qty,
        })),
      };

      await api.post("/kesling", payload);
      toast.success(
        "Registrasi Kesling berhasil! Sampel langsung masuk ke Ruang Lab.",
      );
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || "Gagal menyimpan data Kesling",
      );
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (num) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-6xl mx-auto animate-fade-in">
      <div className="mb-6 border-b border-gray-100 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FlaskConical className="text-cyan-600" size={22} /> Form Registrasi
            — {form.kategori.replace("_", " ")}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Lengkapi data pelanggan, konfigurasi nomor sampel, dan parameter
            pengujian LHU Kesling.
          </p>
        </div>

        <div className="w-full md:w-72">
          <FormSelect
            label="Kategori Layanan Kesling"
            name="kategori"
            value={form.kategori}
            onChange={handleChange}
          >
            <option value="kesling_ppc">Kesling PPC</option>
            <option value="kesling_non_ppc">Kesling Non-PPC</option>
            <option value="vektor_nyamuk">Vektor Nyamuk </option>
            <option value="vektor_plasmodium">Vektor Plasmodium </option>
          </FormSelect>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identitas Pelanggan / Instansi */}
        <div>
          <h3 className="text-base font-bold text-cyan-700 mb-4 flex items-center gap-2">
            <Building2 size={18} /> Identitas Pelanggan / Instansi
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2">
              <FormInput
                label="Nama Pelanggan / Perusahaan"
                name="nama_pelanggan"
                required
                value={form.nama_pelanggan}
                onChange={handleChange}
                placeholder="Nama PT / Instansi / Perorangan"
              />
            </div>

            <div className="md:col-span-1">
              <FormInput
                label="No. Telepon / Kontak"
                name="no_telepon"
                value={form.no_telepon}
                onChange={handleChange}
                placeholder="08..."
              />
            </div>

            <div className="md:col-span-2">
              <FormTextarea
                label="Alamat Lengkap Pelanggan"
                name="alamat_pelanggan"
                value={form.alamat_pelanggan}
                onChange={handleChange}
                placeholder="Alamat instansi..."
              />
            </div>

            <div className="space-y-4 md:col-span-1">
              <FormInput
                label="Asal Sampel"
                name="asal_sampel"
                value={form.asal_sampel}
                onChange={handleChange}
                placeholder="Mandiri / Puskesmas / Dinas"
              />
              {form.kategori === "kesling_ppc" && (
                <FormInput
                  label="Petugas Pengambil Sampel (Opsional)"
                  name="petugas_pengambil_sampel"
                  value={form.petugas_pengambil_sampel}
                  onChange={handleChange}
                  placeholder="Nama petugas lapangan..."
                />
              )}
            </div>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* BAGIAN PEMERIKSAAN & KONFIGURASI NOMOR SAMPEL */}
        <div>
          <h3 className="text-base font-bold text-cyan-700 mb-4 flex items-center gap-2">
            {form.kategori.includes("vektor") ? (
              <Bug size={18} />
            ) : (
              <Droplet size={18} />
            )}
            Parameter & Konfigurasi Sampel (
            {form.kategori.replace("_", " ").toUpperCase()})
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <KeslingExaminationSelector
                masterData={masterPemeriksaan}
                selectedItems={selectedItems}
                onChange={setSelectedItems}
                kategori={form.kategori}
              />
            </div>

            <div className="space-y-4">
              {/* Total Estimasi Biaya */}
              <div className="bg-cyan-50 p-4 rounded-xl border border-cyan-100">
                <p className="text-sm text-cyan-800 mb-1 flex items-center gap-1 font-semibold">
                  <Wallet size={16} /> Total Estimasi Biaya
                </p>
                <p className="text-2xl font-bold text-cyan-700">
                  {formatRupiah(totalBiaya)}
                </p>
              </div>

              {/* Konfigurasi Nomor Sampel */}
              <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-sm space-y-3">
                <label className="text-sm font-bold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-2">
                  <Settings2 size={16} className="text-cyan-600" />
                  Konfigurasi Nomor Sampel
                </label>

                {/* RIWAYAT NOMOR TERAKHIR DATABASE */}
                <div className="bg-yellow-50/80 border border-yellow-200 rounded-lg p-2.5 shadow-sm">
                  <p className="text-[10px] text-yellow-700 font-bold uppercase mb-0.5">
                    Riwayat Nomor Terakhir Database:
                  </p>
                  <p className="text-xs font-mono font-bold text-gray-800">
                    {lastSampleString}
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
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-200 outline-none text-sm font-bold bg-white"
                    value={baseSequence}
                    onChange={(e) =>
                      setBaseSequence(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="Masukkan Angka..."
                  />
                </div>

                {/* Preview Nomor Sampel ala Patologi Klinik */}
                {selectedItems.length === 0 ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-500 text-center italic">
                    Pilih item pemeriksaan di sebelah kiri untuk melihat preview
                    nomor
                  </div>
                ) : (
                  <div className="space-y-2 mt-2 border-t border-gray-100 pt-3">
                    <p className="text-[11px] font-medium text-gray-500">
                      Preview Sampel Fisik Kesling (Otomatis):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <div className="bg-cyan-50 border border-cyan-200 text-cyan-800 px-3 py-1.5 rounded-md text-xs font-bold font-mono shadow-sm">
                        {form.nomor_sampel}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* TOMBOL CEKLIS KONFIRMASI PENGAMBILAN SAMPEL FISIK */}
        <div className="bg-cyan-50/60 border border-cyan-200 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckSquare className="text-cyan-600" size={24} />
            <div>
              <p className="text-sm font-bold text-gray-800">
                Konfirmasi Penyerahan / Pengambilan Sampel Fisik
              </p>
              <p className="text-xs text-gray-500">
                Centang jika sampel fisik telah diterima dan siap langsung
                dimasukkan ke Ruang Lab.
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            name="is_sample_picked_up"
            checked={form.is_sample_picked_up}
            onChange={handleChange}
            className="w-5 h-5 accent-cyan-600 rounded cursor-pointer"
          />
        </div>

        {/* Tombol Simpan */}
        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-linear-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-cyan-300 transition-all disabled:opacity-50"
          >
            {loading ? (
              "Menyimpan..."
            ) : (
              <>
                <Save size={18} /> Simpan & Kirim ke Ruang Lab
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
