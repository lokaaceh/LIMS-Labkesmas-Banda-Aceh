import React from "react";
import { AlertCircle, ArrowUp, ArrowDown } from "lucide-react";
import {
  parseRefConfig,
  getDisplayRefRange,
  smartAnalyzeResult,
} from "../utils/testAnalyzer";

export default function TestResultRow({ test, saving, onInputChange }) {
  // 1. Panggil fungsi analitik
  const config = parseRefConfig(test.nilai_rujukan || test.range_normal);
  const gender = test.jenis_kelamin || "L";
  const displayRef = getDisplayRefRange(config, gender);
  const status = smartAnalyzeResult(test.nilai, config, gender);
  const isAbnormal = status !== "normal" && test.nilai;

  // 2. Tentukan warna input
  const inputClass = `w-full border rounded-lg px-3 py-2 outline-none transition-all font-medium ${
    isAbnormal
      ? "border-red-400 bg-red-50 text-red-700 focus:ring-2 focus:ring-red-500 shadow-sm"
      : "border-gray-300 bg-white focus:ring-2 focus:ring-cyan-500"
  }`;

  return (
    <tr
      className={`hover:bg-cyan-50/30 transition-colors ${isAbnormal ? "bg-red-50/20" : ""}`}
    >
      {/* Kolom 1: Nama Parameter */}
      <td className="py-3 pl-8 font-semibold text-gray-700">
        {test.parameter_name}
        {config.beda_gender && (
          <span className="block text-[10px] text-gray-400 mt-0.5">
            *Nilai rujukan {gender === "L" ? "Pria" : "Wanita"}
          </span>
        )}
      </td>

      {/* Kolom 2: Metode */}
      <td className="py-3 text-gray-500 text-[10px] text-center uppercase tracking-wider">
        {test.metode || "-"}
      </td>

      {/* Kolom 3: Nilai Rujukan */}
      <td className="py-3 text-gray-600 text-xs font-medium">{displayRef}</td>

      {/* Kolom 4: Input Hasil (Kualitatif / Kuantitatif) */}
      <td className="py-3 relative px-4">
        {config.jenis === "kualitatif" ? (
          <select
            className={inputClass}
            value={test.nilai || ""}
            onChange={(e) => onInputChange(test.id, e.target.value)}
            disabled={saving}
          >
            <option value="" disabled>
              -- Pilih Hasil --
            </option>
            {config.kualitatif.opsi.split(",").map((opt) => (
              <option key={opt.trim()} value={opt.trim()}>
                {opt.trim()}
              </option>
            ))}
          </select>
        ) : (
          <div className="relative">
            <input
              type={config.jenis === "kuantitatif" ? "number" : "text"}
              step="any"
              className={`${inputClass} pr-8`}
              value={test.nilai || ""}
              onChange={(e) => onInputChange(test.id, e.target.value)}
              placeholder="Input hasil..."
              disabled={saving}
            />
            {status === "high" && (
              <ArrowUp
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600 font-bold"
              />
            )}
            {status === "low" && (
              <ArrowDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600 font-bold"
              />
            )}
            {status === "abnormal" && config.jenis !== "kuantitatif" && (
              <AlertCircle
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600"
              />
            )}
          </div>
        )}
      </td>

      {/* Kolom 5: Satuan */}
      <td className="py-3 text-gray-500 text-center text-xs font-mono">
        {test.satuan || "-"}
      </td>

      {/* Kolom 6: Status Penyimpanan */}
      <td className="py-3 text-center pr-6">
        <span
          className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
            test.status === "completed"
              ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
              : "bg-gray-100 text-gray-500 border border-gray-200"
          }`}
        >
          {test.status === "completed" ? "Selesai" : "Draft"}
        </span>
      </td>
    </tr>
  );
}
