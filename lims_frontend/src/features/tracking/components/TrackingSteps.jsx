import React from "react";
import { motion } from "framer-motion";
import {
  FileText,
  CheckCircle,
  Clock,
  FlaskConical,
  Syringe,
} from "lucide-react";
import { itemVar } from "../utils/trackingHelper.js";

export default function TrackingSteps({ activeIndex, asalSampel }) {
  const isRujukan = asalSampel === "Rujukan";

  const stepsConfig = [
    {
      id: 0,
      title: "Terdaftar",
      desc: "Administrasi Terverifikasi",
      icon: FileText,
    },
    {
      id: 1,
      title: isRujukan ? "Penyerahan" : "Sampling",
      desc: isRujukan ? "Sampel Diserahkan" : "Pengambilan Sampel",
      icon: isRujukan ? CheckCircle : Syringe,
    },
    { id: 2, title: "Antrian Lab", desc: "Sampel Diterima Lab", icon: Clock },
    {
      id: 3,
      title: "Analisis",
      desc: "Sedang Diuji Analis",
      icon: FlaskConical,
    },
    {
      id: 4,
      title: "Selesai",
      desc: "Validasi Dokter Selesai",
      icon: CheckCircle,
    },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="relative">
        {stepsConfig.map((step, index) => {
          const isCompleted = index < activeIndex;
          const isCurrent = index === activeIndex;
          const isLast = index === stepsConfig.length - 1;

          return (
            <motion.div
              key={step.id}
              variants={itemVar}
              className="relative pb-10 last:pb-0 flex items-start gap-6"
            >
              {!isLast && (
                <div className="absolute top-10 left-5 w-[2px] h-full bg-slate-100 -translate-x-1/2">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: isCompleted ? "100%" : "0%" }}
                    className="bg-cyan-500 w-full"
                    transition={{ duration: 0.8 }}
                  />
                </div>
              )}

              <div className="relative z-10">
                <motion.div
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1.2 : 1,
                    backgroundColor:
                      isCompleted || (isLast && isCurrent)
                        ? "#10b981"
                        : isCurrent
                          ? "#0891b2"
                          : "#f1f5f9",
                    color: isCurrent || isCompleted ? "#ffffff" : "#94a3b8",
                  }}
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg border-4 border-white transition-all duration-500"
                >
                  <step.icon size={isCurrent ? 20 : 18} />
                </motion.div>

                {isCurrent && !isLast && (
                  <span className="absolute inset-0 rounded-2xl bg-cyan-400 animate-ping opacity-20 -z-10" />
                )}
              </div>

              <div className="flex flex-col">
                <h4
                  className={`text-sm font-bold tracking-tight transition-colors duration-500 ${
                    isCurrent
                      ? "text-cyan-700"
                      : isCompleted
                        ? "text-slate-800"
                        : "text-slate-400"
                  }`}
                >
                  {step.title}
                </h4>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
