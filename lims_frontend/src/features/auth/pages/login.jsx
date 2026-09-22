import { motion } from "framer-motion";
import { LoginForm } from "../components/LoginForm";
import { LoginVisual } from "../components/LoginVisual";

export default function Login() {
  return (
    <main className="min-h-screen w-full flex bg-gradient-to-br from-slate-50 via-white to-cyan-50/30 font-sans overflow-hidden">
      {/* Bagian Kiri: Form Login dengan Container yang Lebih Elegan */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full lg:w-1/2 flex flex-col justify-center relative bg-white/80 backdrop-blur-xl shadow-2xl lg:shadow-none z-10"
      >
        <LoginForm />
      </motion.div>

      {/* Bagian Kanan: Visual Banner dengan Efek Modern */}
      <motion.div
        initial={{ opacity: 0, scale: 1.02 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
      >
        <LoginVisual />
      </motion.div>
    </main>
  );
}
