// fungsi utilitas murni untuk memproses, memformat, mengubah (minify/expand), serta memvalidasi aturan konfigurasi nilai rujukan.

export const minifyConfig = (cfg) => {
  if (cfg.jenis === "teks")
    return JSON.stringify({ j: "txt", v: cfg.teks_bebas });

  const minified = { j: cfg.jenis === "kuantitatif" ? "kan" : "kal" };
  if (cfg.jenis === "kuantitatif") {
    minified.m = cfg.is_multi;
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

export const expandConfig = (value) => {
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

export const hasMinMaxError = (min, max) => {
  if (min !== "" && max !== "" && parseFloat(min) > parseFloat(max))
    return true;
  return false;
};
