import React from "react";
import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqData = [
  {
    question: "Apa itu LIMS Labkesmas Banda Aceh?",
    answer:
      "LIMS (Laboratory Information Management System) merupakan sistem digital yang digunakan untuk membantu pengelolaan proses laboratorium mulai dari penerimaan sampel, pemeriksaan, hingga penerbitan laporan hasil uji.",
  },
  {
    question: "Siapa yang dapat menggunakan sistem LIMS?",
    answer:
      "Sistem LIMS digunakan oleh petugas internal laboratorium untuk mengelola proses pemeriksaan. Masyarakat atau pengguna eksternal dapat menggunakan fitur tertentu seperti tracking sampel.",
  },
  {
    question: "Bagaimana cara melakukan tracking sampel?",
    answer:
      "Pengguna dapat memasukkan nomor sampel melalui fitur Tracking Sampel untuk melihat status proses pemeriksaan laboratorium.",
  },
  {
    question: "Bagaimana mendapatkan hasil pemeriksaan?",
    answer:
      "Hasil pemeriksaan dapat diperoleh melalui dokumen Laporan Hasil Uji (LHU) yang diterbitkan oleh laboratorium setelah proses validasi selesai pada halaman tracking.",
  },
];

export const FaqSection = () => (
  <section id="faq" className="relative py-16 bg-slate-50 overflow-hidden">
    <div className="max-w-4xl mx-auto px-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="text-center max-w-2xl mx-auto mb-14"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2  text-[#16b3ac] text-sm font-semibold tracking-wide mb-2">
          <HelpCircle size={14} />
          INFORMASI UMUM
        </div>

        <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 leading-tight mb-4">
          Pertanyaan yang Sering Diajukan
        </h2>

        <p className="text-slate-500">
          Temukan jawaban cepat seputar layanan, alur pendaftaran, dan
          pengecekan hasil sampel di LIMS Labkesmas Banda Aceh.
        </p>
      </motion.div>

      {/* FAQ */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
      >
        <Accordion type="single" collapsible className="space-y-4">
          {faqData.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="
                rounded-2xl
                border
                border-slate-100
                bg-white
                shadow-sm
                px-6
                transition-all
                hover:shadow-md
                data-[state=open]:border-[#16b3ac]/30
              "
            >
              <AccordionTrigger
                className="
                  py-5
                  text-left
                  text-base
                  md:text-lg
                  font-semibold
                  text-slate-800
                  hover:no-underline
                "
              >
                {faq.question}
              </AccordionTrigger>

              <AccordionContent
                className="
                  pb-6
                  text-slate-600
                  leading-relaxed
                  text-sm
                  md:text-base
                "
              >
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </div>
  </section>
);
