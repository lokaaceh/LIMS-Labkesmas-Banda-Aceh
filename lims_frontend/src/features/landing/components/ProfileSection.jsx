import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ShieldCheck, Microscope, Award } from "lucide-react";
import docter3d from "../../../assets/3d_doctor.png";
import { Button } from "@/components/ui/button";

export const ProfileSection = () => (
  <section id="profil" className="relative py-16 bg-slate-50 overflow-hidden">
    {/* Decorative */}
    <div
      className="
        absolute
        -top-40
        -right-40
        w-96
        h-96
        rounded-full
        bg-[#16b3ac]/10
        blur-3xl
      "
    />

    <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative">
      {/* Content */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <p
          className="
          text-[#16b3ac]
          font-semibold
          tracking-wide
          uppercase
          text-sm
          mb-2
        "
        >
          TENTANG KAMI
        </p>

        <h2
          className="
            text-3xl
            lg:text-4xl
            font-bold
            text-slate-900
            leading-tight
            mb-6
          "
        >
          Profil Balai Laboratorium
          <br />
          Kesehatan Masyarakat
          <span className="text-[#16b3ac]"> Banda Aceh</span>
        </h2>

        <div
          className="
            space-y-4
            text-slate-600
            leading-relaxed
          "
        >
          <p>
            Berdasarkan Peraturan Menteri Kesehatan Nomor 25 Tahun 2023, Balai
            Penelitian dan Pengembangan Kesehatan Aceh bertransformasi menjadi
            <span className="font-semibold text-slate-800">
              {" "}
              Balai Laboratorium Kesehatan Masyarakat Banda Aceh.
            </span>
          </p>

          <p>
            Dengan dukungan tenaga ahli dan fasilitas laboratorium modern, kami
            berkomitmen menyediakan layanan pemeriksaan kesehatan masyarakat
            yang berkualitas dan sesuai standar mutu.
          </p>
        </div>

        {/* Highlight */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          <Feature icon={ShieldCheck} text="Terakreditasi" />

          <Feature icon={Microscope} text="Laboratorium Modern" />

          <Feature icon={Award} text="Standar Mutu" />
        </div>

        <Button asChild className=" mt-8 px-8 py-6 ont-semibold shadow-lg">
          <a
            href="https://www.labkesmas-aceh.go.id/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2"
          >
            Selengkapnya
            <ArrowUpRight size={18} />
          </a>
        </Button>
      </motion.div>

      {/* Image */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7 }}
        viewport={{ once: true }}
        className="flex justify-center relative"
      >
        <div className=" absolute w-80 h-80 bg-[#16b3ac]/20 rounded-full blur-3xl" />

        <img
          src={docter3d}
          alt="Labkesmas Illustration"
          className=" relative z-10 max-w-[420px] drop-shadow-xl"
        />
      </motion.div>
    </div>
  </section>
);

const Feature = ({ icon: Icon, text }) => (
  <div className="bg-white border-slate-100 rounded-xl p-4 flex flex-col gap-2 shadow-sm">
    <Icon size={22} className="text-[#16b3ac]" />

    <span
      className="
        text-sm
        font-semibold
        text-slate-800
      "
    >
      {text}
    </span>
  </div>
);
