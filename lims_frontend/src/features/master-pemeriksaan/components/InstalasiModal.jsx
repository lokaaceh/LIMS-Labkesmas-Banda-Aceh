// UI modal untuk mengelola data instalasi atau departemen laboratorium (CRUD)

import React from "react";
import {
  Building2,
  X,
  Plus,
  Edit2,
  Trash2,
  Save,
  Loader2,
  Database,
} from "lucide-react";

export default function InstalasiModal({
  isOpen,
  onClose,
  instalasiList,
  instalasiForm,
  setInstalasiForm,
  isEditingInstalasi,
  setIsEditingInstalasi,
  onSubmit,
  loading,
  onEdit,
  onDelete,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-gray-200">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <h3 className="font-extrabold text-xl text-gray-800 flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Building2 size={20} />
            </div>
            Manajemen Instalasi
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full p-2 transition-all"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row overflow-hidden bg-gray-50/50 flex-1 h-[600px]">
          <div className="w-full lg:w-1/3 p-6 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col">
            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              {isEditingInstalasi ? (
                <Edit2 size={16} className="text-yellow-600" />
              ) : (
                <Plus size={16} className="text-blue-600" />
              )}
              {isEditingInstalasi ? "Edit Instalasi" : "Tambah Instalasi"}
            </h4>

            <form onSubmit={onSubmit} className="space-y-4 flex-1">
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1.5 block">
                  Kode Menu / Dropdown <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Cth: 1 IMB"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-500 bg-gray-50 focus:bg-white"
                  value={instalasiForm.kode_instalasi}
                  onChange={(e) =>
                    setInstalasiForm({
                      ...instalasiForm,
                      kode_instalasi: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1.5 block">
                  Nama Lengkap Instalasi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Cth: Instalasi Mikrobiologi..."
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-500 bg-gray-50 focus:bg-white"
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
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg outline-none font-mono font-bold text-blue-700 uppercase bg-gray-50 focus:bg-white"
                  value={instalasiForm.kode_sampel}
                  onChange={(e) =>
                    setInstalasiForm({
                      ...instalasiForm,
                      kode_sampel: e.target.value.toUpperCase(),
                    })
                  }
                />
              </div>

              <div className="pt-4 mt-auto">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-70 shadow-md shadow-blue-200"
                >
                  {loading ? (
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

          <div className="w-full lg:w-2/3 p-6 flex flex-col h-full bg-gray-50/50">
            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Database size={16} className="text-gray-500" /> Daftar Instalasi
              Aktif
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
                                onClick={() => onEdit(inst)}
                                className="text-yellow-600 hover:bg-yellow-50 p-1.5 rounded transition"
                                title="Edit"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() =>
                                  onDelete(inst.id, inst.nama_instalasi)
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
  );
}
