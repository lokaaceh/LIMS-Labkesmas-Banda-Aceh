// UI modal form untuk menambah atau mengedit data pemeriksaan lab

import React from "react";
import {
  X,
  Plus,
  Edit2,
  Save,
  Loader2,
  Tag,
  Beaker,
  DollarSign,
  Scale,
  FileText,
  Package,
  Activity,
  ClipboardList,
  Building2,
  Trash2
} from "lucide-react";
import ReferenceValueBuilder from "./ReferenceValueBuilder";

export default function PemeriksaanModal({
  isOpen,
  onClose,
  isEditing,
  formData,
  setFormData,
  instalasiList,
  categoriesList,
  parameters,
  addParameter,
  updateParameter,
  removeParameter,
  onSubmit,
  submitLoading,
}) {
  if (!isOpen) return null;

  const handlePriceChange = (e) =>
    setFormData({ ...formData, harga: e.target.value.replaceAll(/\D/g, "") });
  const getFormattedPrice = (price) =>
    !price && price !== 0 ? "" : new Intl.NumberFormat("id-ID").format(price);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[850px] overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-gray-200">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <h3 className="font-extrabold text-xl text-gray-800 flex items-center gap-3">
            <div className="p-2 bg-cyan-50 text-cyan-600 rounded-xl">
              {isEditing ? <Edit2 size={20} /> : <Plus size={20} />}
            </div>
            {isEditing ? "Edit Data Pemeriksaan" : "Tambah Pemeriksaan Baru"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full p-2 transition-all"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 md:p-8 custom-scrollbar bg-gray-50/50">
          <form id="masterForm" onSubmit={onSubmit} className="space-y-8">
            <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-2">
              <div
                onClick={() => setFormData({ ...formData, tipe: "tunggal" })}
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
                  <Building2 size={16} className="text-cyan-600" /> Instalasi
                  Tujuan
                </label>
                <select
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-white focus:border-cyan-500 outline-none text-sm font-medium text-gray-700 cursor-pointer"
                  value={formData.instalasi_id}
                  onChange={(e) =>
                    setFormData({ ...formData, instalasi_id: e.target.value })
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
                  <Tag size={16} className="text-cyan-600" /> Kategori Kelompok
                </label>
                <input
                  type="text"
                  required
                  list="kategori-list"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-white focus:border-cyan-500 outline-none text-sm font-medium text-gray-700"
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
                  <Beaker size={16} className="text-cyan-600" /> Nama / Judul
                  Pemeriksaan
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-white focus:border-cyan-500 outline-none text-sm font-bold text-gray-900"
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-white focus:border-cyan-500 outline-none text-sm font-mono font-bold text-cyan-700"
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
                      <Scale size={16} className="text-cyan-600" /> Satuan Ukur
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-white focus:border-cyan-500 outline-none text-sm text-gray-700"
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
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-white focus:border-cyan-500 outline-none text-sm text-gray-700"
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
                    <Activity size={16} className="text-cyan-600" /> Pengaturan
                    Nilai Rujukan / Normal
                  </label>
                  <ReferenceValueBuilder
                    value={formData.nilai_rujukan}
                    onChange={(val) =>
                      setFormData({ ...formData, nilai_rujukan: val })
                    }
                  />
                </div>

                <div className="space-y-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <FileText size={16} className="text-cyan-600" /> Deskripsi Teks
                Rujukan (Untuk Cetak PDF)
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-white focus:border-cyan-500 outline-none text-sm text-gray-700"
                value={formData.deskripsi_rujukan}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    deskripsi_rujukan: e.target.value,
                  })
                }
                placeholder="Cth: < 200 mg/dL atau 6.5 - 8.5"
              />
              <p className="text-[11px] text-gray-400">
                Teks ini akan langsung dicetak pada kolom Nilai Rujukan di LHU
                pasien.
              </p>
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
                      Atur satuan, nilai rujukan, dan deskripsi untuk
                      masing-masing parameter uji.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addParameter}
                    className="text-sm flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-xl hover:bg-purple-700 font-bold transition-all shadow-md shadow-purple-200 w-full sm:w-auto"
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
                              className="w-full text-base border-b border-gray-200 focus:border-purple-500 outline-none font-bold text-gray-800 bg-transparent pb-1"
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
                            title="Hapus"
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
                              className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 rounded-lg border border-gray-200 focus:bg-white focus:border-purple-400 outline-none"
                              value={param.satuan}
                              onChange={(e) =>
                                updateParameter(index, "satuan", e.target.value)
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
                              className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 rounded-lg border border-gray-200 focus:bg-white focus:border-purple-400 outline-none"
                              value={param.metode}
                              onChange={(e) =>
                                updateParameter(index, "metode", e.target.value)
                              }
                            />
                          </div>
                        </div>

                        <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                          <label className="text-xs font-bold text-gray-600 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                            <Activity size={14} className="text-purple-500" />{" "}
                            Nilai Rujukan Logika:
                          </label>
                          <ReferenceValueBuilder
                            value={param.nilai_rujukan}
                            onChange={(val) =>
                              updateParameter(index, "nilai_rujukan", val)
                            }
                          />
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <label className="text-xs font-bold text-gray-700 mb-1.5 block flex items-center gap-1.5">
                            <FileText size={14} className="text-purple-500" />{" "}
                            Deskripsi Rujukan (Untuk Cetak PDF)
                          </label>
                          <input
                            type="text"
                            placeholder="Cth: < 200 mg/dL atau Negatif"
                            className="w-full px-3 py-2 text-sm bg-gray-50 rounded-lg border border-gray-200 focus:bg-white focus:border-purple-400 outline-none font-medium text-gray-700"
                            value={param.deskripsi_rujukan || ""}
                            onChange={(e) =>
                              updateParameter(
                                index,
                                "deskripsi_rujukan",
                                e.target.value,
                              )
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
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-100 transition-all"
          >
            Batal
          </button>
          <button
            type="submit"
            form="masterForm"
            disabled={submitLoading}
            className={`w-full sm:w-auto px-8 py-3 rounded-xl text-white font-extrabold shadow-lg transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 disabled:opacity-70 ${formData.tipe === "paket" ? "bg-purple-600 hover:bg-purple-700 shadow-purple-600/30" : "bg-cyan-600 hover:bg-cyan-700 shadow-cyan-600/30"}`}
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
  );
}
