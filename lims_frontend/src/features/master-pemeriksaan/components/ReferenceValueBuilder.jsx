// komponen UI interaktif untuk membangun dan mengatur format nilai rujukan (kuantitatif angka, kualitatif pilihan, atau teks bebas).

import React from "react";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import {
  expandConfig,
  minifyConfig,
  hasMinMaxError,
} from "../utils/referenceConfig";

export default function ReferenceValueBuilder({ value, onChange }) {
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
                        className="w-full text-sm border-gray-300 border rounded-lg px-3 py-2 outline-none focus:border-cyan-500"
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
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1">
              Hasil Normal <AlertCircle size={12} className="text-amber-500" />
            </label>
            <input
              type="text"
              placeholder="Contoh: Negatif"
              value={config.kualitatif.normal}
              onChange={(e) =>
                handleChange("kualitatif", e.target.value, "normal")
              }
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-cyan-500"
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
            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-cyan-500"
          />
        </div>
      )}
    </div>
  );
}
