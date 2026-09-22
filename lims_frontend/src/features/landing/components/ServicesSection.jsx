import React from "react";
import { Link } from "react-router-dom";
import { FlaskConical, FileCheck, Search, Microscope } from "lucide-react";
import { ServiceCard } from "./ServiceCard";

export const ServicesSection = () => (
  <section id="layanan" className="py-16 bg-gray-50/50">
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Layanan Yang Tersedia
        </h2>
        <p className="text-gray-500">
          Laboratory Information Management System menghadirkan solusi digital
          untuk mempermudah akses layanan laboratorium untuk BLKM Banda Aceh
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <ServiceCard
          icon={FlaskConical}
          title="Manajemen Sampel"
          desc="Pengelolaan data sampel mulai dari penerimaan, pencatatan, hingga proses pemeriksaan laboratorium."
          delay={0.1}
        />

        <ServiceCard
          icon={Microscope}
          title="Pemeriksaan Laboratorium"
          desc="Mengelola proses pemeriksaan berdasarkan parameter uji, metode analisis, dan hasil pengujian laboratorium."
          delay={0.2}
        />

        <Link to="/cek-status">
          <ServiceCard
            icon={Search}
            title="Tracking Sampel"
            desc="Memantau status pengerjaan sampel secara realtime mulai dari penerimaan hingga hasil pemeriksaan tersedia."
            delay={0.3}
          />
        </Link>

        <ServiceCard
          icon={FileCheck}
          title="Laporan Hasil Uji"
          desc="Menghasilkan laporan hasil pemeriksaan laboratorium dalam format digital yang valid dan terdokumentasi."
          delay={0.4}
        />
      </div>
    </div>
  </section>
);
