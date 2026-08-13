// components/LHUPrintTemplate.jsx

import React, { useState, useEffect } from "react";
import kopMailImg from "../assets/kop_mail.png";
import QRCode from "react-qr-code";
import api from "../api/axios";
import { formatDate, formatTime } from "../utils/dateHelper";

// --- SMART PARSER V2 ---
const parseRefConfig = (rujukanString) => {
  try {
    if (!rujukanString) return { jenis: "teks", teks_bebas: "-" };

    let minified;
    if (typeof rujukanString === "string") {
      if (!rujukanString.trim().startsWith("{")) {
        return { jenis: "teks", teks_bebas: rujukanString };
      }
      try {
        minified = JSON.parse(rujukanString);
      } catch (e) {
        return { jenis: "teks", teks_bebas: "Format terpotong / Data Lama" };
      }
    } else {
      minified = rujukanString;
    }

    if (minified.jenis) return minified;

    if (minified.j === "kan") {
      // Struktur baru dengan custom_refs
      const parsed = {
        jenis: "kuantitatif",
        is_multi: minified.m || minified.bg || false,
        kuantitatif: {
          umum: minified.u || { min: "", max: "" },
          custom_refs: [],
        },
      };

      // Handle data lama (Backward compatibility)
      if (minified.bg !== undefined) {
        if (minified.L)
          parsed.kuantitatif.custom_refs.push({
            label: "Laki-laki",
            min: minified.L.min,
            max: minified.L.max,
          });
        if (minified.P)
          parsed.kuantitatif.custom_refs.push({
            label: "Perempuan",
            min: minified.P.min,
            max: minified.P.max,
          });
      }
      // Handle data dinamis baru
      else if (minified.r && Array.isArray(minified.r)) {
        parsed.kuantitatif.custom_refs = minified.r.map((ref) => ({
          label: ref.l,
          min: ref.mn,
          max: ref.mx,
        }));
      }
      return parsed;
    } else if (minified.j === "kal") {
      return {
        jenis: "kualitatif",
        kualitatif: {
          opsi: minified.o || "Negatif, Positif",
          normal: minified.n || "Negatif",
        },
      };
    } else if (minified.j === "txt") {
      return {
        jenis: "teks",
        teks_bebas: minified.v || "-",
      };
    }

    return { jenis: "teks", teks_bebas: "-" };
  } catch {
    return { jenis: "teks", teks_bebas: "Format tidak valid" };
  }
};

// --- UI/UX RENDERER KHUSUS LHU ---
const renderLhuReference = (config, satuan) => {
  if (!config) return "-";

  const unitText =
    satuan && satuan !== "-" && satuan.trim() !== "" ? ` ${satuan}` : "";

  if (config.jenis === "teks") return config.teks_bebas || "-";
  if (config.jenis === "kualitatif") return config.kualitatif?.normal || "-";

  if (config.jenis === "kuantitatif") {
    // RENDER MULTI KATEGORI
    if (config.is_multi && config.kuantitatif?.custom_refs?.length > 0) {
      return (
        <div className="text-left inline-block text-[11px] leading-snug whitespace-nowrap">
          {config.kuantitatif.custom_refs.map((ref, idx) => (
            <div key={idx}>
              <span className="font-semibold">{ref.label}</span> :{" "}
              {ref.min || "-"} - {ref.max || "-"} {unitText}
            </div>
          ))}
        </div>
      );
    } else {
      // RENDER UMUM (SATU BARIS)
      const umum = config.kuantitatif?.umum;
      if (
        umum &&
        umum.min !== undefined &&
        umum.max !== undefined &&
        umum.min !== "" &&
        umum.max !== ""
      ) {
        return `${umum.min} - ${umum.max}${unitText}`;
      }
    }
  }
  return "-";
};
// ---------------------------------

export default function LHUPrintTemplate({ data }) {
  const [appSettings, setAppSettings] = useState({
    signatureMode: "qr",
    kodeLaboratorium: "",
    useKopSurat: true,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get("/settings");
        if (res.data.success) {
          setAppSettings({
            signatureMode: res.data.data.signature_mode || "qr",
            kodeLaboratorium: res.data.data.kode_laboratorium || "-",
            // Default true jika belum di set
            useKopSurat: res.data.data.use_kop_surat !== "false",
          });
        }
      } catch (error) {
        console.error("Gagal mengambil pengaturan LHU", error);
      }
    };
    fetchSettings();
  }, []);

  if (!data) return null;

  const extractTestCategory = () => {
    if (!data.jenis_pemeriksaan) return "PEMERIKSAAN LABORATORIUM";
    return data.jenis_pemeriksaan
      .replace(/\(\d+\)/g, "")
      .replace(/,/g, " & ")
      .trim()
      .toUpperCase();
  };

  const masterCategoryName = extractTestCategory();
  const validatorName = data.validator || "dr. Uzi Mardha Phoenna, Sp.PK";

  const qrValidationData = JSON.stringify({
    rs: "BLKM Banda Aceh",
    reg: data.no_reg,
    lab_id: data.no_sampel_lab,
    pasien: data.nama_pasien,
    status: "VALIDATED",
    verifikator: data.verifikator || "-",
    validator: validatorName,
    date: data.validated_at || new Date().toISOString(),
  });

  const formatTimeStr = (dateString) => {
    if (!dateString) return "-";
    const dateObj = new Date(dateString);
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return "-";
  };

  return (
    <div className="lhu-print font-sans text-black max-w-[21cm] mx-auto print:w-full print:max-w-none relative">
      {/* HEADER KOP SURAT (Render Bersyarat) */}
      {appSettings.useKopSurat && (
        <div className="flex justify-between items-center mb-2">
          <img
            src={kopMailImg}
            alt="Kop Surat"
            className="w-auto object-contain"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        </div>
      )}

      {/* Jika kop surat disembunyikan, berikan sedikit padding atas pengganti ruang agar tidak mentok ujung kertas */}
      {!appSettings.useKopSurat && <div className="pt-10"></div>}

      <h3 className="text-center font-bold text-lg mb-2 mt-4">
        LAPORAN HASIL PEMERIKSAAN LABORATORIUM
      </h3>

      {/* INFO PASIEN TABLE */}
      <div className="grid grid-cols-2 gap-8 text-sm mb-4 break-inside-avoid">
        {/* TABEL KIRI */}
        <table className="w-full">
          <tbody>
            <tr>
              <td className="w-32 align-top pb-1">Dokter</td>
              <td className="w-2 align-top pb-1 px-1">:</td>
              <td className="align-top pb-1">{data.dokter || "-"}</td>
            </tr>
            <tr>
              <td className="w-32 align-top pb-1">Alamat Dokter</td>
              <td className="w-2 align-top pb-1 px-1">:</td>
              <td className="align-top pb-1">{data.alamat_dokter || "-"}</td>
            </tr>
            <tr>
              <td className="align-top pb-1">Nama Pasien</td>
              <td className="align-top pb-1 px-1">:</td>
              <td className="align-top pb-1 font-bold">{data.nama_pasien}</td>
            </tr>
            <tr>
              <td className="align-top pb-1">Tanggal Lahir</td>
              <td className="align-top pb-1 px-1">:</td>
              <td className="align-top pb-1">{formatDate(data.tgl_lahir)}</td>
            </tr>
            <tr>
              <td className="align-top pb-1">Jenis Kelamin</td>
              <td className="align-top pb-1 px-1">:</td>
              <td className="align-top pb-1">
                {data.jenis_kelamin === "L"
                  ? "Laki-laki"
                  : data.jenis_kelamin === "P"
                    ? "Perempuan"
                    : data.jenis_kelamin || "-"}
              </td>
            </tr>
            <tr>
              <td className="align-top pb-1">NIK</td>
              <td className="align-top pb-1 px-1">:</td>
              <td className="align-top pb-1">{data.nik || "-"}</td>
            </tr>
            <tr>
              <td className="align-top pb-1">No. HP/Telepon</td>
              <td className="align-top pb-1 px-1">:</td>
              <td className="align-top pb-1">{data.no_kontak || "-"}</td>
            </tr>
            <tr>
              <td className="align-top">Alamat Pasien</td>
              <td className="align-top px-1">:</td>
              <td className="align-top">{data.alamat || "-"}</td>
            </tr>
          </tbody>
        </table>

        {/* TABEL KANAN */}
        <table className="w-full">
          <tbody>
            <tr>
              <td className="w-40 align-top pb-1">No. Registrasi</td>
              <td className="w-2 align-top pb-1 px-1">:</td>
              <td className="align-top pb-1">{data.no_reg}</td>
            </tr>
            <tr>
              <td className="align-top pb-1">No. Rekam Medik</td>
              <td className="align-top pb-1 px-1">:</td>
              <td className="align-top pb-1">{data.no_rekam_medik || "-"}</td>
            </tr>
            <tr>
              <td className="align-top pb-1 whitespace-nowrap">
                Kode Laboratorium
              </td>
              <td className="align-top pb-1 px-1">:</td>
              <td className="align-top pb-1">
                {appSettings.kodeLaboratorium || "-"}
              </td>
            </tr>
            <tr>
              <td className="align-top pb-1 whitespace-nowrap">
                Jenis Spesimen/Sampel
              </td>
              <td className="align-top pb-1 px-1">:</td>
              <td className="align-top pb-1">{data.jenis_spesimen || "-"}</td>
            </tr>
            <tr>
              <td className="align-top pb-1 whitespace-nowrap">
                Kode Spesimen/Sampel
              </td>
              <td className="align-top pb-1 px-1">:</td>
              <td className="align-top pb-1">{data.no_sampel_lab}</td>
            </tr>
            <tr>
              <td className="align-top pb-1">Tgl/Jam Daftar</td>
              <td className="align-top pb-1 px-1">:</td>
              <td className="align-top pb-1">
                {formatDate(data.tgl_daftar)} -{" "}
                {formatTimeStr(data.waktu_daftar)} WIB
              </td>
            </tr>
            <tr>
              <td className="align-top pb-1">Jam Terima/Sampling</td>
              <td className="align-top pb-1 px-1">:</td>
              <td className="align-top pb-1">
                {data.waktu_pengambilan
                  ? formatTimeStr(data.waktu_pengambilan) + " WIB"
                  : "-"}
              </td>
            </tr>
            <tr>
              <td className="align-top">Jam Terbit Hasil</td>
              <td className="align-top px-1">:</td>
              <td className="align-top">
                {data.validated_at
                  ? formatTimeStr(data.validated_at) + " WIB"
                  : "Belum terbit"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* HASIL TABLE */}
      <table className="w-full border-collapse border border-black text-sm mb-4">
        <thead className="bg-gray-100 print:table-header-group">
          <tr>
            <th className="border border-black p-2 text-left">
              JENIS PEMERIKSAAN
            </th>
            <th className="border border-black p-2 text-center">HASIL</th>
            <th className="border border-black p-2 text-center">
              NILAI RUJUKAN
            </th>
            <th className="border border-black p-2 text-center">SATUAN</th>
            <th className="border border-black p-2 text-center">METODE</th>
          </tr>
        </thead>
        <tbody>
          <tr className="bg-gray-50/50 print:bg-gray-50">
            <td className="border border-black px-2 py-1.5 font-bold uppercase text-left tracking-wide">
              {masterCategoryName}
            </td>
            <td className="border border-black px-2 py-1.5"></td>
            <td className="border border-black px-2 py-1.5"></td>
            <td className="border border-black px-2 py-1.5"></td>
            <td className="border border-black px-2 py-1.5"></td>
          </tr>
          {data.tests &&
            data.tests.map((test, idx) => {
              const config = parseRefConfig(
                test.nilai_rujukan || test.range_normal,
              );

              return (
                <tr
                  key={idx}
                  className="break-inside-avoid page-break-inside-avoid"
                >
                  <td className="border border-black p-2">
                    {test.parameter_name}
                  </td>
                  <td className="border border-black p-2 text-center font-bold">
                    {test.nilai}
                  </td>
                  <td className="border border-black p-2 text-center align-middle">
                    {renderLhuReference(config, test.satuan)}
                  </td>
                  <td className="border border-black p-2 text-center">
                    {test.satuan}
                  </td>
                  <td className="border border-black p-2 text-center text-[11px] uppercase">
                    {test.metode}
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>

      {/* FOOTER TTD & QR CODE */}
      <div className="flex w-full justify-between break-inside-avoid page-break-inside-avoid mt-4">
        {/* KIRI: INFO VALIDATOR */}
        <div className="text-sm mb-6">
          <table>
            <tbody>
              <tr>
                <td className="pr-4 whitespace-nowrap">Pemeriksa</td>
                <td>: {data.pemeriksa || "-"}</td>
              </tr>
              <tr>
                <td className="pr-4 whitespace-nowrap">Verifikator</td>
                <td>: {data.verifikator || "-"}</td>
              </tr>
              <tr>
                <td className="pr-4 whitespace-nowrap">Validator</td>
                <td>: {data.validator || "Belum divalidasi"}</td>
              </tr>
              <tr>
                <td className="pr-4 whitespace-nowrap">Tanggal Validasi</td>
                <td>
                  : {data.validated_at ? formatDate(data.validated_at) : "-"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* KANAN: KOTAK TTD */}
        <div className="flex flex-col items-center justify-center text-center w-64">
          <p className="">
            Aceh Besar,{" "}
            {data.validated_at
              ? formatDate(data.validated_at)
              : new Date().toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
            <br />
            Dokter Penanggung Jawab
          </p>

          <div className="py-2">
            {appSettings.signatureMode === "qr" ? (
              <QRCode
                value={qrValidationData}
                size={90}
                level="M"
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              />
            ) : (
              <div className="h-16 w-full"></div>
            )}
          </div>

          {appSettings.signatureMode === "qr" && (
            <span className="text-[9px] text-gray-400 mb-1 block">
              Dokumen ini ditandatangani secara elektronik
            </span>
          )}
          <p className="font-bold text-sm underline">{validatorName}</p>
        </div>
      </div>

      {/* <div className="lhu-page-number"></div> */}
    </div>
  );
}
