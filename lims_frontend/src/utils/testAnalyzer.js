export const parseRefConfig = (rujukanString) => {
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

    if (minified.jenis) return minified; // Format Unminified

    if (minified.j === "kan" || minified.jenis === "kuantitatif") {
      const parsed = {
        jenis: "kuantitatif",
        is_multi: minified.m || minified.bg || minified.is_multi || false,
        kuantitatif: {
          umum: minified.u ||
            minified.kuantitatif?.umum || { min: "", max: "" },
          custom_refs: [],
        },
      };

      const rawRefs = minified.r || minified.kuantitatif?.custom_refs;
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
      } else if (rawRefs && Array.isArray(rawRefs)) {
        parsed.kuantitatif.custom_refs = rawRefs.map((ref) => ({
          label: ref.l || ref.label,
          min: ref.mn !== undefined ? ref.mn : ref.min,
          max: ref.mx !== undefined ? ref.mx : ref.max,
        }));
      }
      return parsed;
    } else if (minified.j === "kal" || minified.jenis === "kualitatif") {
      return {
        jenis: "kualitatif",
        kualitatif: {
          opsi: minified.o || minified.kualitatif?.opsi || "Negatif, Positif",
          normal: minified.n || minified.kualitatif?.normal || "Negatif",
        },
      };
    } else if (minified.j === "txt" || minified.jenis === "teks") {
      return {
        jenis: "teks",
        teks_bebas: minified.v || minified.teks_bebas || "-",
      };
    }

    return { jenis: "teks", teks_bebas: "-" };
  } catch {
    return { jenis: "teks", teks_bebas: "Format tidak valid" };
  }
};

export const getDisplayRefRange = (configInput, gender) => {
  const config = parseRefConfig(configInput);
  if (!config) return "-";
  if (config.jenis === "teks") return config.teks_bebas || "-";
  if (config.jenis === "kualitatif")
    return `Normal: ${config.kualitatif?.normal || "-"}`;

  if (config.jenis === "kuantitatif") {
    if (config.is_multi && config.kuantitatif?.custom_refs?.length > 0) {
      return config.kuantitatif.custom_refs
        .map((ref) => `${ref.label}: ${ref.min}-${ref.max}`)
        .join(" | ");
    }

    const target = config.kuantitatif?.umum;
    if (target && target.min !== "" && target.max !== "") {
      return `${target.min} - ${target.max}`;
    }
  }
  return "-";
};

export const smartAnalyzeResult = (nilai, configInput, gender) => {
  if (!nilai || nilai.toString().trim() === "") return "normal";

  const config = parseRefConfig(configInput);

  // Analisis Kualitatif
  if (config.jenis === "kualitatif") {
    const valStr = String(nilai).trim().toLowerCase();
    const expected = String(config.kualitatif?.normal || "")
      .trim()
      .toLowerCase();
    return valStr !== expected ? "abnormal" : "normal";
  }

  // Analisis Kuantitatif
  if (config.jenis === "kuantitatif") {
    const valNum = parseFloat(String(nilai).replace(/,/g, "."));
    if (isNaN(valNum)) return "normal";

    let target = config.kuantitatif?.umum;

    if (config.is_multi && config.kuantitatif?.custom_refs) {
      const refs = config.kuantitatif.custom_refs;
      const mappedRef = refs.find((r) => {
        const lbl = (r.label || "").toLowerCase();
        if (
          gender === "L" &&
          (lbl.includes("laki") || lbl.includes("pria") || lbl === "l")
        )
          return true;
        if (
          gender === "P" &&
          (lbl.includes("perem") || lbl.includes("wanita") || lbl === "p")
        )
          return true;
        return false;
      });
      if (mappedRef) target = mappedRef;
    }

    if (target && target.min !== "" && target.max !== "") {
      if (valNum < parseFloat(target.min)) return "low";
      if (valNum > parseFloat(target.max)) return "high";
    }
  }

  // Analisis Teks Bebas (Support Operator <, <=, ≤, >, >=, ≥, dan Rentang -)
  if (config.jenis === "teks" && config.teks_bebas) {
    const rujukanStr = String(config.teks_bebas).trim();
    const valNum = parseFloat(String(nilai).replace(/,/g, "."));

    if (isNaN(valNum)) return "normal";

    // Operator ≤ atau <=
    if (rujukanStr.startsWith("≤") || rujukanStr.startsWith("<=")) {
      const maxVal = parseFloat(rujukanStr.replace(/^<=|^≤/, "").trim());
      if (!isNaN(maxVal) && valNum > maxVal) return "high";
    }

    // Operator <
    else if (rujukanStr.startsWith("<")) {
      const maxVal = parseFloat(rujukanStr.replace("<", "").trim());
      if (!isNaN(maxVal) && valNum >= maxVal) return "high";
    }

    // Operator ≥ atau >=
    else if (rujukanStr.startsWith("≥") || rujukanStr.startsWith(">=")) {
      const minVal = parseFloat(rujukanStr.replace(/^>=|^≥/, "").trim());
      if (!isNaN(minVal) && valNum < minVal) return "low";
    }

    // Operator >
    else if (rujukanStr.startsWith(">")) {
      const minVal = parseFloat(rujukanStr.replace(">", "").trim());
      if (!isNaN(minVal) && valNum <= minVal) return "low";
    }

    // Range dengan tanda -
    else if (rujukanStr.includes("-")) {
      const parts = rujukanStr.split("-").map((v) => parseFloat(v.trim()));

      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        if (valNum < parts[0]) return "low";
        if (valNum > parts[1]) return "high";
      }
    }
  }

  return "normal";
};
