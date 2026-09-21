import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import gedung from "../../../assets/gedung.png";
import { Card } from "@/components/ui/card";

export const HeroSection = () => (
  <section
    id="beranda"
    className="relative min-h-screen flex items-center overflow-hidden pt-12"
  >
    {/* Background */}
    <div className="absolute inset-0">
      <img
        src={gedung}
        alt="Laboratorium Labkesmas"
        className="h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/30" />
    </div>

    <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="max-w-3xl"
      >
        <p className="text-[#16b3ac] text-[#16b3ac] font-semibold tracking-wide uppercase text-sm mb-2">
          RESMI & TERINTEGRASI
        </p>

        <h1 className="text-4xl md:text-2xl lg:text-5xl font-bold leading-tight text-slate 900">
          Selamat Datang di
          <br />
          LIMS Labkesmas
          <br />
          <span className="text-[#16b3ac]">Banda Aceh</span>
        </h1>

        <p className="mt-6 text-lg text-scale-600 max-w-xl leading-relaxed">
          Mengelola proses laboratorium secara digital mulai dari penerimaan
          sampel, pemeriksaan, hingga penerbitan hasil laboratorium yang cepat
          dan akurat.
        </p>

        <div className="flex gap-4 mt-8">
          <Link to="/login">
            <Button className="px-8 py-6 shadow-lg font-semibold">
              Mulai Sekarang
            </Button>
          </Link>
        </div>

        {/* TRUST SECTION */}

        <div className="mt-10 flex flex-wrap gap-x-1- gap-y-5 item-center">
          <Info title="Terakreditasi" desc="Mutu Laboratorium" />

          <Info title="Standar ISO" desc="Prosedur Terjamin" />

          <Info title="Realtime" desc="Monitoring Data" />

          <Info title="10.000+" desc="Total Sampel" />
        </div>
      </motion.div>
    </div>
  </section>
);

const Info = ({ title, desc }) => (
  <div className="flex gap-3 items-start">
    <CheckCircle size={22} className="text-[#16b3ac] mt-1" />

    <div>
      <p className="font-semibold text-slate-900">{title}</p>

      <p className="text-sm text-slate-500">{desc}</p>
    </div>
  </div>
);
