// --- ANIMATION VARIANTS ---
export const containerVar = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, staggerChildren: 0.1 },
  },
};

export const itemVar = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
};

// --- HELPER FUNCTION ---
export const getActiveIndex = (status) => {
  if (!status) return 0;
  const s = status.toLowerCase();
  const map = {
    terdaftar: 0,
    proses_sampling: 1,
    diterima_lab: 2,
    proses_lab: 3,
    selesai_uji: 3,
    selesai: 4,
  };
  return map[s] ?? 0;
};
