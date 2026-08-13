// pages/LandingPage.jsx

import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion"; // Animasi halus
import lab3d from "../assets/3d.png";
import docter3d from "../assets/3d_doctor.png";
import {
  FlaskConical,
  Activity,
  Search,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  CheckCircle2,
  LogIn,
} from "lucide-react";

// Komponen Card Layanan
const ServiceCard = ({ icon: Icon, title, desc, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    viewport={{ once: true }}
    className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 group hover:-translate-y-2"
  >
    <div className="w-14 h-14 bg-cyan-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-cyan-500 transition-colors duration-300">
      <Icon
        className="text-cyan-600 group-hover:text-white transition-colors duration-300"
        size={28}
      />
    </div>
    <h3 className="text-xl font-bold text-gray-800 mb-3">{title}</h3>
    <p className="text-gray-500 leading-relaxed">{desc}</p>
    <div className="mt-6 flex items-center text-cyan-600 font-semibold text-sm group-hover:translate-x-2 transition-transform cursor-pointer">
      Selengkapnya <ArrowRight size={16} className="ml-2" />
    </div>
  </motion.div>
);

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">
      {/* --- NAVBAR --- */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {/* Logo Placeholder */}
            <img
              src="/logo.svg"
              alt="Labkesmas Logo"
              className="mx-auto h-10 w-auto mb-4 space-y-10"
            />
          </div>

          <div className="hidden md:flex gap-8 text-sm font-medium text-gray-600">
            <a href="#beranda" className="hover:text-cyan-600 transition">
              Beranda
            </a>
            <a href="#layanan" className="hover:text-cyan-600 transition">
              Layanan
            </a>
            <a href="#profil" className="hover:text-cyan-600 transition">
              Profil
            </a>
            <a href="#kontak" className="hover:text-cyan-600 transition">
              Kontak
            </a>
          </div>

          <Link to="/login">
            <button className="flex items-center gap-2 bg-linear-to-r from-cyan-600 to-teal-500 text-white px-6 py-2.5 rounded-full font-medium text-sm shadow-lg shadow-cyan-200 hover:shadow-cyan-300 hover:scale-105 transition-all duration-300">
              <LogIn size={16} /> Masuk Sistem
            </button>
          </Link>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section
        id="beranda"
        className="relative pt-32 pb-20 lg:pt-32 lg:pb-32 overflow-hidden"
      >
        {/* Background Blob/Gradient */}
        <div className="absolute top-0 right-0 -z-10 w-[800px] h-[800px] bg-cyan-50 rounded-full blur-3xl opacity-70 translate-x-1/3 -translate-y-1/4"></div>
        <div className="absolute bottom-0 left-0 -z-10 w-[600px] h-[600px] bg-blue-50 rounded-full blur-3xl opacity-70 -translate-x-1/4 translate-y-1/4"></div>

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block py-1 px-3 rounded-full bg-cyan-100 text-cyan-700 text-xs font-bold tracking-wide mb-6">
              RESMI & TERINTEGRASI
            </span>
            <h1 className="text-4xl lg:text-6xl font-extrabold text-gray-900 leading-[1.15] mb-6">
              Selamat datang di LIMS Labkesmas{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-500 to-teal-500">
                Banda Aceh
              </span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-lg">
              Sistem Informasi Manajemen Laboratorium Kesehatan Masyarakat Banda
              Aceh. Memudahkan pendaftaran, pelacakan sampel, hingga akses hasil
              pemeriksaan secara digital.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/login"
                className="px-8 py-4 bg-gray-900 text-white rounded-xl font-semibold shadow-xl hover:bg-gray-800 hover:-translate-y-1 transition-all text-center"
              >
                Mulai Sekarang
              </Link>
              <button className="px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-center">
                Hubungi Admin IT
              </button>
            </div>

            <div className="mt-10 flex items-center gap-6 text-sm font-medium text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-green-500" size={18} />{" "}
                Terakreditasi
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-green-500" size={18} /> Standar
                ISO
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-green-500" size={18} /> Hasil
                Realtime
              </div>
            </div>
          </motion.div>

          {/* Illustration Area */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative z-10 bg-white p-2 rounded-3xl shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500 border-4 w-6/7 border-white">
              <img
                src={lab3d}
                alt="Laboratorium Modern"
                className="rounded-2xl w-full h-auto object-cover"
              />

              {/* Floating Card UI Element */}
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-lg flex items-center gap-4 animate-bounce-slow">
                <div className="bg-green-100 p-3 rounded-full text-green-600">
                  <Activity size={24} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Sampel</p>
                  <p className="text-lg font-bold text-gray-800">1,240+</p>
                </div>
              </div>
            </div>
            {/* Decorative dots */}
            <div className="absolute -top-10 -right-10 grid grid-cols-4 gap-2 opacity-20">
              {[...Array(16)].map((_, i) => (
                <div key={i} className="w-2 h-2 bg-cyan-600 rounded-full"></div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- SERVICES / FEATURES --- */}
      <section id="layanan" className="py-20 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Layanan Yang Tersedia
            </h2>
            <p className="text-gray-500">
              Labolatory Information Management System menghadirkan solusi
              digital untuk mempermudah akses layanan laboratorium untuk BLKM
              Banda Aceh
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <ServiceCard
              icon={Activity}
              title="Pendaftaran Sampel"
              desc="Mendaftarkan sampel dengan mudah dan efisien dengan formulir digital yang terintegrasi dengan database."
              delay={0.1}
            />
            <Link to="/cek-status">
              <ServiceCard
                icon={Search}
                title="Tracking Sampel"
                desc="Pantau status pengerjaan sampel secara realtime. Rincian detail proses dari penerimaan hingga hasil keluar."
                delay={0.2}
              />
            </Link>
            <ServiceCard
              icon={FlaskConical}
              title="Hasil Pemeriksaan"
              desc="Unduh hasil pemeriksaan laboratorium secara digital (PDF) yang valid dan dapat dipertanggungjawabkan."
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* --- PROFILE SECTION --- */}
      <section
        id="profil"
        className="py-24 bg-linear-to-br from-cyan-600 to-teal-500 text-white relative overflow-hidden"
      >
        {/* Background Pattern - Diperhalus agar tidak mengganggu keterbacaan */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        ></div>

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-6 leading-tight">
              Profil Balai Labkesmas Banda Aceh
            </h2>
            <div className="space-y-4 text-cyan-50 leading-relaxed text-lg">
              <p>
                <span className="font-semibold text-white text-xl">
                  Assalamualaikum Wr. Wb.
                </span>
                <br />
                Berdasarkan Peraturan Menteri Kesehatan Nomor 25 Tahun 2023,
                Balai Penelitian dan Pengembangan Kesehatan Aceh kini
                bertransformasi menjadi
                <span className="text-white font-medium">
                  {" "}
                  Balai Laboratorium Kesehatan Masyarakat Banda Aceh.
                </span>
              </p>
              <p className="opacity-90">
                Didukung oleh tenaga ahli yang kompeten dan peralatan modern,
                kami siap memberikan pelayanan prima sesuai standar mutu
                internasional demi peningkatan derajat kesehatan masyarakat.
              </p>
            </div>

            <a
              href="https://www.labkesmas-aceh.go.id/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-8 bg-white text-cyan-700 px-10 py-3.5 rounded-xl font-bold hover:bg-cyan-50 transition-all shadow-xl hover:shadow-cyan-900/20 active:scale-95"
            >
              Selengkapnya
            </a>
          </motion.div>

          {/* Illustration Area - Fixed with Glow Effect */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
            viewport={{ once: true }}
            className="relative flex justify-center items-center"
          >
            {/* Decorative Glow */}
            <div className="absolute w-72 h-72 bg-cyan-400 rounded-full blur-[100px] opacity-30 animate-pulse"></div>

            <img
              src={docter3d}
              alt="3D Lab Illustration"
              className="w-full max-w-[450px] h-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-10 hover:translate-y-[-10px] transition-transform duration-500"
              onError={(e) => {
                e.target.src =
                  "https://illustrations.popsy.co/white/medical-research.svg"; // Fallback jika link utama mati
              }}
            />
          </motion.div>
        </div>

        {/* Curved Divider Bottom - Fixed Path & Anti-Gap */}
        <div className="absolute top-0 left-0 w-full overflow-hidden leading-none">
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="relative block w-[calc(100%+1.3px)] h-20"
            fill="white"
          >
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
          </svg>
        </div>
      </section>

      {/* --- FOOTER & MAP --- */}
      <footer id="kontak" className="bg-white pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            {/* Contact Info */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center text-white">
                  <FlaskConical size={18} />
                </div>
                <span className="font-bold text-xl text-gray-800">
                  LIMS Labkesmas
                </span>
              </div>
              <p className="text-gray-500 mb-8 max-w-sm">
                Sistem informasi terpadu untuk pelayanan laboratorium kesehatan
                yang lebih baik.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <MapPin className="text-cyan-600 mt-1" />
                  <p className="text-gray-600">
                    Jl. Bandara SIM Blang Bintang Lr. Biomedis No. 9,
                    <br />
                    Kecamatan Ingin Jaya Kabupaten Aceh Besar Provinsi Aceh{" "}
                    <br />
                    Kode Pos 23317
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Phone className="text-cyan-600" />
                  <p className="text-gray-600">
                    0651-8070189 (Telepon)
                    <br /> 0811-6107-253 (Whatsapp)
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Mail className="text-cyan-600" />
                  <p className="text-gray-600">labkesmasaceh@kemkes.go.id</p>
                </div>
              </div>
            </div>

            {/* Map Embed */}
            <div className="bg-gray-200 rounded-2xl overflow-hidden h-74 shadow-inner">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3971.493245603183!2d95.3614462!3d5.5095249!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30403845a4f33693%3A0xb07da876428a0d32!2sBalai%20Labkesmas%20Banda%20Aceh!5e0!3m2!1sid!2sid!4v1733730000000"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Balai Labkesmas Banda Aceh"
              />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
            <p>&copy; 2026 All rights reserved by LIMS Labkesmas Banda Aceh.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-cyan-600">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-cyan-600">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
