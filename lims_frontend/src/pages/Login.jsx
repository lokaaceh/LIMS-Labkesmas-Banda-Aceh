// pages/Login.jsx

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import labBg from "../assets/image.png";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  LogIn,
  Loader2,
  AlertCircle, // Tambahkan icon ini
} from "lucide-react";

export default function Login() {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(""); // State baru untuk Error UI

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(""); // Reset error setiap kali submit ulang

    const result = await login(formData.username, formData.password);

    if (result.success) {
      navigate("/dashboard");
    } else {
      // Tampilkan error dan reset field password
      setErrorMessage(result.message);
      setFormData((prev) => ({ ...prev, password: "" }));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans overflow-hidden">
      {/* --- BAGIAN KIRI: FORM LOGIN --- */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full lg:w-1/2 flex flex-col justify-center p-8 sm:p-16 relative z-10"
      >
        <Link
          to="/"
          className="absolute top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-cyan-600 transition font-medium text-sm group"
        >
          <div className="p-2 bg-gray-100 rounded-full group-hover:bg-cyan-50 transition">
            <ArrowLeft size={16} />
          </div>
          Kembali ke Beranda
        </Link>

        <div className="max-w-md w-full mx-auto space-y-8 mt-10 lg:mt-6">
          <div className="text-center lg:text-left">
            <img
              src="/logo.svg"
              alt="Labkesmas Logo"
              className="h-16 w-auto mb-6 mx-auto lg:mx-0"
            />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Selamat Datang Kembali
            </h1>
            <p className="text-gray-500">
              Silahkan masukkan kredensial Anda untuk mengakses LIMS BLKM Banda
              Aceh.
            </p>
          </div>

          {/* Animasi Inline Error Message */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-start gap-3 shadow-sm"
              >
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{errorMessage}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Input Username */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 ml-1">
                Username
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User
                    className={`h-5 w-5 transition-colors ${errorMessage ? "text-red-400" : "text-gray-400 group-focus-within:text-cyan-600"}`}
                  />
                </div>
                <input
                  type="text"
                  // Dinamis border color berdasarkan state error
                  className={`block w-full pl-10 pr-3 py-3 border rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:bg-white transition-all duration-200 ${
                    errorMessage
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-200 focus:ring-cyan-500 focus:border-transparent"
                  }`}
                  placeholder="Masukkan username Anda"
                  value={formData.username}
                  onChange={(e) => {
                    setFormData({ ...formData, username: e.target.value });
                    if (errorMessage) setErrorMessage(""); // Reset error saat mulai ngetik lagi
                  }}
                  required
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-semibold text-gray-700">
                  Password
                </label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock
                    className={`h-5 w-5 transition-colors ${errorMessage ? "text-red-400" : "text-gray-400 group-focus-within:text-cyan-600"}`}
                  />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className={`block w-full pl-10 pr-10 py-3 border rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:bg-white transition-all duration-200 ${
                    errorMessage
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-200 focus:ring-cyan-500 focus:border-transparent"
                  }`}
                  placeholder="Masukkan password Anda"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    if (errorMessage) setErrorMessage(""); // Reset error saat mulai ngetik lagi
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Button Login */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-cyan-200 text-sm font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Memproses...
                </>
              ) : (
                <>
                  Masuk Sistem <LogIn className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Copyright */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              &copy; 2026 LIMS BLKM Banda Aceh. <br /> All rights reserved.
            </p>
          </div>
        </div>
      </motion.div>

      {/* --- BAGIAN KANAN: GAMBAR / VISUAL (TIDAK ADA PERUBAHAN) --- */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-gray-900"
      >
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-10000 hover:scale-110"
          style={{ backgroundImage: `url(${labBg})` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-900/90 to-blue-900/40 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

        <div className="absolute bottom-0 left-0 right-0 p-16 text-white z-20">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-2xl max-w-lg">
            <div className="flex gap-1 mb-3">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
            <h2 className="text-2xl font-bold mb-2">
              Laboratory Information Management System
            </h2>
            <p className="text-cyan-100 text-sm leading-relaxed">
              Mengelola ribuan sampel dengan akurasi tinggi dan standar keamanan
              data terbaik untuk pelayanan kesehatan masyarakat Aceh.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
