// src/context/AuthContext.jsx

import {
  createContext,
  useState,
  useContext,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import api from "../api/axios";
import { toast } from "react-toastify";
import PropTypes from "prop-types";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cek apakah user sudah login saat aplikasi dibuka (refresh)
  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await api.get("/users/profile");
          setUser(res.data.data);
        } catch (error) {
          console.error("Gagal ambil profile", error);
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  // Gunakan useCallback agar referensi fungsi tidak berubah-ubah pada re-render
  const logout = useCallback((reason = "Berhasil logout") => {
    localStorage.removeItem("token");
    setUser(null);
    toast.info(reason);

    // Redirect paksa ke halaman login untuk memastikan UI tertutup
    // Gunakan ini jika tidak menghandle proteksi route secara ketat di root
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }, []);

  const login = async (username, password) => {
    try {
      const res = await api.post("/users/login", { username, password });
      const { token, user } = res.data.data;

      localStorage.setItem("token", token);
      setUser(user);
      // Toast sukses tetap dipertahankan sebagai feedback positif
      toast.success(`Selamat datang, ${user.fullname}!`);
      return { success: true };
    } catch (error) {
      // Tangkap pesan error dari backend
      const errorMessage =
        error.response?.data?.message ||
        "Terjadi kesalahan pada server. Silakan coba lagi.";

      // Hapus toast.error di sini agar UI form yang menghandle errornya secara visual
      return { success: false, message: errorMessage };
    }
  };

  // ==========================================
  // IDLE TIMER LOGIC (Sistem Auto-Logout 5 Menit)
  // ==========================================
  useEffect(() => {
    // Jika tidak ada user (belum login), hentikan logic timer
    if (!user) return;

    let timeoutId;

    // Fungsi untuk mereset timer setiap kali ada aktivitas
    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);

      // Set waktu idle 30 menit (1800000 ms) untuk auto-logout
      timeoutId = setTimeout(() => {
        logout("Sesi berakhir karena tidak ada aktivitas selama 30 menit.");
      }, 1800000);
    };

    // Jalankan timer pertama kali saat komponen dimount dan user login
    resetTimer();

    // Daftar event yang dianggap sebagai "aktivitas"
    // Best practice: Hindari 'mousemove' karena terlalu sering ter-trigger dan membebani CPU (Performance Issue).
    // Kombinasi mousedown, keydown, scroll, dan touchstart sudah lebih dari cukup.
    const events = ["mousedown", "keydown", "scroll", "touchstart"];

    const handleUserActivity = () => {
      resetTimer();
    };

    // Daftarkan event listener ke window
    events.forEach((event) => {
      window.addEventListener(event, handleUserActivity);
    });

    // Cleanup function: Hapus listener dan timer jika komponen unmount atau user di-set null (logout)
    // Ini krusial agar tidak terjadi memory leak!
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [user, logout]); // Effect ini akan bereaksi setiap kali state 'user' berubah

  const authContextValue = useMemo(
    () => ({ user, login, logout: () => logout(), loading }),
    [user, loading, logout],
  );

  return (
    <AuthContext.Provider value={authContextValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
