import labBg from "@/assets/image.png";

export function LoginVisual() {
  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950 flex items-end">
      {/* Background Image dengan efek halus */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-105 transition-transform duration-10000 hover:scale-110 opacity-80"
        style={{ backgroundImage: `url(${labBg})` }}
      ></div>

      {/* Modern Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-tr from-cyan-950/95 via-blue-950/60 to-slate-900/40 mix-blend-multiply"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent"></div>

      {/* Floating Glassmorphism Card */}
      <div className="relative p-12 lg:p-16 w-full z-20">
        <div className="bg-white/10 backdrop-blur-xl border border-white/15 p-8 rounded-3xl shadow-2xl max-w-xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-red-400/90 shadow-sm"></div>
            <div className="w-3 h-3 rounded-full bg-amber-400/90 shadow-sm"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-400/90 shadow-sm"></div>
          </div>
          <h2 className=" text-3xl lg:text-2xl font-bold text-white tracking-tight mb-3">
            Laboratory Information Management System
          </h2>
          <p className="text-cyan-100/90 text-xs lg:text-base leading-relaxed font-normal">
            Mengelola ribuan sampel dengan akurasi tinggi dan standar keamanan
            data terbaik untuk pelayanan kesehatan masyarakat Aceh.
          </p>
        </div>
      </div>
    </div>
  );
}
