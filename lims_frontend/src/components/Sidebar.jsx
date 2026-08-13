// src/components/Sidebar.jsx

import React, { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  LogOut,
  ChevronRight,
  PlusCircle,
  ShieldCheck,
  UserCog,
  Database,
  FlaskConical,
  FileBarChart,
  Syringe,
  FileCheck,
  Wallet,
  User, // Tambahan icon
  KeyRound, // Tambahan icon
  Loader2, // Tambahan icon
  X, // Tambahan icon
  Save, // Tambahan icon
  Settings, // Tambahan icon
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import SystemSettings from "./SystemSettings";
import api from "../api/axios"; // Sesuaikan path jika berbeda
import { toast } from "react-toastify";

export default function Sidebar({
  currentView,
  setView,
  isMobileOpen,
  setIsMobileOpen,
}) {
  const { user, logout } = useAuth();

  React.useEffect(() => {
    const fetchMyInstalasi = async () => {
      if (user?.instalasi_id && ["lab"].includes(user.role)) {
        try {
          const res = await api.get("/master/instalasi");
          if (res.data.success) {
            const myInst = res.data.data.find(
              (i) => String(i.id) === String(user.instalasi_id),
            );
            if (myInst) setUserInstalasiName(myInst.nama_instalasi);
          }
        } catch (error) {
          console.error("Gagal load nama instalasi", error);
        }
      }
    };
    fetchMyInstalasi();
  }, [user]);

  const [userInstalasiName, setUserInstalasiName] = useState("");

  // State untuk Modal Profile
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    username: "",
    fullname: "",
    password: "",
  });

  const handleLogout = () => {
    if (confirm("Yakin ingin keluar?")) logout();
  };

  const handleOpenProfile = () => {
    setProfileForm({
      username: user?.username || "",
      fullname: user?.fullname || "",
      password: "", 
    });
    setIsProfileModalOpen(true);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingProfile(true);

    try {
      const payload = {
        username: profileForm.username,
        fullname: profileForm.fullname,
      };
      // Hanya kirim password jika diisi
      if (profileForm.password) payload.password = profileForm.password;

      await api.put("/users/profile", payload);
      toast.success("Profil berhasil diperbarui. Halaman akan dimuat ulang.");
      setIsProfileModalOpen(false);

      // Reload untuk sinkronisasi ulang data user dari backend ke AuthContext
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal memperbarui profil");
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  let menuItems = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  ];

  if (user?.role === "input" || user?.role === "admin") {
    menuItems.push({
      id: "create",
      label: "Registrasi Baru",
      icon: PlusCircle,
    });
    menuItems.push({ id: "list", label: "Data Pasien", icon: FileText });
  }

  if (user?.role === "sampler" || user?.role === "admin") {
    menuItems.push({ id: "sampler", label: "Ambil Sampel", icon: Syringe });
  }

  if (user?.role === "lab" || user?.role === "admin") {
    menuItems.push({ id: "lab-queue", label: "Ruang Lab", icon: FlaskConical });
  }

  if (user?.role === "validator" || user?.role === "admin") {
    menuItems.push({
      id: "validation",
      label: "Validasi Dokter",
      icon: FileCheck,
    });
  }

  if (user?.role === "manajemen" || user?.role === "admin") {
    menuItems.push({
      id: "management",
      label: "Laporan & Data",
      icon: FileBarChart,
    });
  }

  if (user?.role === "kasir") {
    menuItems.push({ id: "list", label: "Data Pasien", icon: FileText });
  }

  if (user?.role === "kasir" || user?.role === "admin") {
    menuItems.push({ id: "finance", label: "Keuangan", icon: Wallet });
  }

  if (user?.role === "admin") {
    menuItems.push(
      { id: "master", label: "Master Data", icon: Database, isAdmin: true },
      { id: "users", label: "User Management", icon: UserCog, isAdmin: true },
      {
        id: "settings",
        label: "Pengaturan Sistem",
        icon: Settings,
        isAdmin: true,
      },
    );
  }

  if (user?.role === "lab" || user?.role === "validator" || user?.role === "manajemen") {
    menuItems.push({
      id: "master",
      label: "Master Data",
      icon: Database,
      isAdmin: true,
    });
  }

  return (
    <>
      {/* Overlay Mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-100 shadow-xl shadow-blue-100/50 transform transition-transform duration-300 ease-in-out md:translate-x-0 flex flex-col ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo Header */}
        <div className="h-20 flex items-center gap-3 px-6 border-b border-gray-50 flex-none">
          <img
            src="/logo.svg"
            alt="Labkesmas Logo"
            className="mx-auto h-12 w-auto"
          />
        </div>

        {/* Menu Items Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 mt-2 custom-scrollbar">
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Menu Utama
          </p>
          {menuItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setView(item.id);
                  setIsMobileOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group shrink-0 ${
                  isActive
                    ? "bg-cyan-50 text-cyan-700 shadow-sm"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                } ${
                  item.isAdmin
                    ? "border border-dashed border-cyan-100 mt-4 bg-cyan-50/30"
                    : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon
                    size={20}
                    className={
                      isActive
                        ? "text-cyan-600"
                        : "text-gray-400 group-hover:text-gray-600"
                    }
                  />
                  {item.label}
                </div>
                {isActive && (
                  <ChevronRight size={16} className="text-cyan-500" />
                )}
                {item.isAdmin && !isActive && (
                  <ShieldCheck size={14} className="text-cyan-300" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer dengan User Info */}
        <div className="w-full p-4 border-t border-gray-50 bg-white flex-none">
          <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100 transition-all duration-200 hover:shadow-md hover:border-blue-100 group">
            <div className="flex items-center gap-3 overflow-hidden">
              {/* === AVATAR DIBUAT BISA DIKLIK === */}
              <div
                onClick={handleOpenProfile}
                title="Update Profil"
                className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center font-bold border-2 border-white shadow-sm cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-cyan-500 transition-all ${
                  user?.role === "admin"
                    ? "bg-linear-to-br from-purple-100 to-purple-200 text-purple-700"
                    : user?.role === "validator"
                      ? "bg-linear-to-br from-emerald-100 to-emerald-200 text-emerald-700"
                      : "bg-linear-to-br from-cyan-100 to-blue-200 text-cyan-700"
                }`}
              >
                {user?.fullname?.charAt(0).toUpperCase() || "U"}
              </div>

              <div className="flex flex-col min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate leading-tight group-hover:text-cyan-600 transition-colors">
                  {user?.fullname}
                </p>

                <div className="flex flex-col mt-0.5 gap-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide truncate">
                      {user?.role || "Staff"}
                    </span>
                    {user?.role === "admin" && (
                      <ShieldCheck size={10} className="text-cyan-600" />
                    )}
                  </div>

                  {/* UX IMPROVEMENT: Badge Penempatan Instalasi */}
                  {["lab"].includes(user?.role) && (
                    <span
                      className="text-[9px] bg-cyan-50 text-cyan-700 border border-cyan-100 px-1.5 py-0.5 rounded flex items-center gap-1 w-fit truncate"
                      title={userInstalasiName}
                    >
                      <FlaskConical size={8} />{" "}
                      {userInstalasiName || "Menunggu Penempatan"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-gray-400 hover:bg-white hover:text-red-500 hover:shadow-sm transition-all duration-200 shrink-0 focus:outline-none focus:ring-2 focus:ring-red-100"
              title="Keluar Aplikasi"
            >
              <LogOut size={18} strokeWidth={2.5} />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-4 text-center">
            &copy; 2026 LIMS BLKM Banda Aceh
          </p>
        </div>
      </aside>

      {/* === MODAL UPDATE PROFILE === */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-lg text-gray-800">
                Update Profil Saya
              </h3>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleProfileSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <User size={16} className="text-cyan-600" /> Username
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none transition-all text-sm"
                  value={profileForm.username}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, username: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <User size={16} className="text-cyan-600" /> Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none transition-all text-sm"
                  value={profileForm.fullname}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, fullname: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <KeyRound size={16} className="text-cyan-600" /> Password Baru
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none transition-all text-sm"
                  value={profileForm.password}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, password: e.target.value })
                  }
                  placeholder="Kosongkan jika tidak ingin mengubah password"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProfile}
                  className="flex-1 py-2.5 rounded-xl bg-linear-to-r from-cyan-600 to-blue-600 text-white font-bold hover:shadow-lg hover:shadow-cyan-200 transition flex items-center justify-center gap-2"
                >
                  {isSubmittingProfile ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Save size={18} />
                  )}
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
