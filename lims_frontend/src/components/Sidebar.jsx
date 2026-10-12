import React, { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  LogOut,
  ChevronRight,
  ChevronDown,
  PlusCircle,
  ShieldCheck,
  UserCog,
  Database,
  FlaskConical,
  FileBarChart,
  Syringe,
  FileCheck,
  Wallet,
  User,
  KeyRound,
  Save,
  Settings,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { toast } from "react-toastify";

// Import komponen Shadcn UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

function SidebarDevButton({ label }) {
  const handleClick = () => {
    toast.info(`Fitur ${label} sedang dalam masa pengembangan 🚀`);
  };
  return (
    <button
      onClick={handleClick}
      className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all text-gray-500 hover:text-gray-800 hover:bg-gray-50 flex items-center justify-between group"
    >
      <span>{label}</span>
      <span className="text-[10px] text-amber-600 font-bold bg-amber-100/80 px-1.5 py-0.5 rounded border border-amber-200 group-hover:bg-amber-200 transition-colors">
        Dev
      </span>
    </button>
  );
}

export default function Sidebar({
  currentView,
  setView,
  isMobileOpen,
  setIsMobileOpen,
}) {
  const { user, logout } = useAuth();
  const [userInstalasiName, setUserInstalasiName] = useState("");

  // State untuk Shadcn Collapsible Menu Registrasi
  const [isRegistrasiOpen, setIsRegistrasiOpen] = useState(false);

  // State untuk Modal Profile
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    username: "",
    fullname: "",
    password: "",
  });

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
      if (profileForm.password) payload.password = profileForm.password;

      await api.put("/users/profile", payload);
      toast.success("Profil berhasil diperbarui. Halaman akan dimuat ulang.");
      setIsProfileModalOpen(false);

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      toast.error(error.response?.data?.message || "Gagal memperbarui profil");
    } finally {
      setIsSubmittingProfile(false);
    }
  };

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
        {/* Logo Header (Mempertahankan gambar dari file sebelumnya) */}
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

          {/* Dashboard */}
          <button
            onClick={() => {
              setView("overview");
              setIsMobileOpen(false);
            }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group shrink-0 ${
              currentView === "overview"
                ? "bg-cyan-50 text-cyan-700 shadow-sm"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard
                size={20}
                className={
                  currentView === "overview"
                    ? "text-cyan-600"
                    : "text-gray-400 group-hover:text-gray-600"
                }
              />
              Dashboard
            </div>
            {currentView === "overview" && (
              <ChevronRight size={16} className="text-cyan-500" />
            )}
          </button>

          {/* --- SHADCN COLLAPSIBLE MENU REGISTRASI --- */}
          {(user?.role === "input" || user?.role === "admin") && (
            <Collapsible
              open={isRegistrasiOpen}
              onOpenChange={setIsRegistrasiOpen}
              className="space-y-1"
            >
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 group shrink-0">
                  <div className="flex items-center gap-3">
                    <PlusCircle
                      size={20}
                      className="text-gray-400 group-hover:text-gray-600"
                    />
                    Registrasi Baru
                  </div>
                  {isRegistrasiOpen ? (
                    <ChevronDown size={16} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-400" />
                  )}
                </button>
              </CollapsibleTrigger>

              <CollapsibleContent className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-cyan-100 ml-4 data-[state=open]:animate-slide-down data-[state=closed]:animate-slide-up">
                {/* Patologi Klinik */}
                <button
                  onClick={() => {
                    setView("create-klinis");
                    setIsMobileOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    currentView === "create-klinis"
                      ? "text-cyan-700 bg-cyan-50"
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  Patologi Klinik
                </button>

                {/* Kesehatan Lingkungan (Kesling)
                <button
                  onClick={() => {
                    setView("create-kesling");
                    setIsMobileOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    currentView === "create-kesling"
                      ? "text-cyan-700 bg-cyan-50"
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  Kesehatan Lingkungan
                </button> */}

                {/* Mikrobiologi */}
                <SidebarDevButton label="Kesehatan Lingkungan" />
                <SidebarDevButton label="Mikrobiologi" />
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Data Pasien / List */}
          {(user?.role === "input" ||
            user?.role === "admin" ||
            user?.role === "kepala_labkesmas" ||
            user?.role === "kasir") && (
            <button
              onClick={() => {
                setView("list");
                setIsMobileOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group shrink-0 ${
                currentView === "list"
                  ? "bg-cyan-50 text-cyan-700 shadow-sm"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText
                  size={20}
                  className={
                    currentView === "list"
                      ? "text-cyan-600"
                      : "text-gray-400 group-hover:text-gray-600"
                  }
                />
                Data Pasien
              </div>
              {currentView === "list" && (
                <ChevronRight size={16} className="text-cyan-500" />
              )}
            </button>
          )}

          {(user?.role === "sampler" ||
            user?.role === "kepala_labkesmas" ||
            user?.role === "admin") && (
            <button
              onClick={() => {
                setView("sampler");
                setIsMobileOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group shrink-0 ${
                currentView === "sampler"
                  ? "bg-cyan-50 text-cyan-700 shadow-sm"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <Syringe
                  size={20}
                  className="text-gray-400 group-hover:text-gray-600"
                />
                Ambil Sampel
              </div>
              {currentView === "sampler" && (
                <ChevronRight size={16} className="text-cyan-500" />
              )}
            </button>
          )}

          {(user?.role === "lab" || user?.role === "admin") && (
            <button
              onClick={() => {
                setView("lab-queue");
                setIsMobileOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group shrink-0 ${
                currentView === "lab-queue"
                  ? "bg-cyan-50 text-cyan-700 shadow-sm"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <FlaskConical
                  size={20}
                  className="text-gray-400 group-hover:text-gray-600"
                />
                Ruang Lab
              </div>
              {currentView === "lab-queue" && (
                <ChevronRight size={16} className="text-cyan-500" />
              )}
            </button>
          )}

          {(user?.role === "validator" || user?.role === "admin") && (
            <button
              onClick={() => {
                setView("validation");
                setIsMobileOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group shrink-0 ${
                currentView === "validation"
                  ? "bg-cyan-50 text-cyan-700 shadow-sm"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <FileCheck
                  size={20}
                  className="text-gray-400 group-hover:text-gray-600"
                />
                Validasi Dokter
              </div>
              {currentView === "validation" && (
                <ChevronRight size={16} className="text-cyan-500" />
              )}
            </button>
          )}

          {(user?.role === "manajemen" || user?.role === "admin") && (
            <button
              onClick={() => {
                setView("management");
                setIsMobileOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group shrink-0 ${
                currentView === "management"
                  ? "bg-cyan-50 text-cyan-700 shadow-sm"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <FileBarChart
                  size={20}
                  className="text-gray-400 group-hover:text-gray-600"
                />
                Laporan & Data
              </div>
              {currentView === "management" && (
                <ChevronRight size={16} className="text-cyan-500" />
              )}
            </button>
          )}

          {(user?.role === "kasir" ||
            user?.role === "kepala_labkesmas" ||
            user?.role === "admin") && (
            <button
              onClick={() => {
                setView("finance");
                setIsMobileOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group shrink-0 ${
                currentView === "finance"
                  ? "bg-cyan-50 text-cyan-700 shadow-sm"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <Wallet
                  size={20}
                  className="text-gray-400 group-hover:text-gray-600"
                />
                Keuangan
              </div>
              {currentView === "finance" && (
                <ChevronRight size={16} className="text-cyan-500" />
              )}
            </button>
          )}

          {user?.role === "admin" && (
            <>
              <button
                onClick={() => {
                  setView("master");
                  setIsMobileOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group shrink-0 border border-dashed border-cyan-100 mt-4 bg-cyan-50/30 ${
                  currentView === "master"
                    ? "bg-cyan-50 text-cyan-700 shadow-sm"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Database size={20} className="text-cyan-600" />
                  Master Data
                </div>
                <ShieldCheck size={14} className="text-cyan-300" />
              </button>

              <button
                onClick={() => {
                  setView("users");
                  setIsMobileOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group shrink-0 ${
                  currentView === "users"
                    ? "bg-cyan-50 text-cyan-700 shadow-sm"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <UserCog size={20} className="text-gray-400" />
                  User Management
                </div>
              </button>

              <button
                onClick={() => {
                  setView("settings");
                  setIsMobileOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group shrink-0 ${
                  currentView === "settings"
                    ? "bg-cyan-50 text-cyan-700 shadow-sm"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Settings size={20} className="text-gray-400" />
                  Pengaturan Sistem
                </div>
              </button>
            </>
          )}
        </div>

        {/* Footer dengan User Info */}
        <div className="w-full p-4 border-t border-gray-50 bg-white flex-none">
          <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100 transition-all duration-200 hover:shadow-md hover:border-blue-100 group">
            <div className="flex items-center gap-3 overflow-hidden">
              <div
                onClick={handleOpenProfile}
                title="Update Profil"
                className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center font-bold border-2 border-white shadow-sm cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-cyan-500 transition-all ${
                  user?.role === "admin"
                    ? "bg-linear-to-br from-purple-100 to-purple-200 text-purple-700"
                    : "bg-linear-to-br from-cyan-100 to-blue-200 text-cyan-700"
                }`}
              >
                {user?.fullname?.charAt(0).toUpperCase() || "U"}
              </div>

              <div className="flex flex-col min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate leading-tight group-hover:text-cyan-600 transition-colors">
                  {user?.fullname}
                </p>
                <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide truncate">
                  {user?.role || "Staff"}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-gray-400 hover:bg-white hover:text-red-500 hover:shadow-sm transition-all duration-200 shrink-0"
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

      {/* Modal Profile Menggunakan Shadcn UI Dialog */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-800">
              Update Profil Saya
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleProfileSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <User size={16} className="text-cyan-600" /> Username
              </Label>
              <Input
                type="text"
                required
                className="bg-gray-50 focus:bg-white focus-visible:ring-cyan-500"
                value={profileForm.username}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, username: e.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <User size={16} className="text-cyan-600" /> Nama Lengkap
              </Label>
              <Input
                type="text"
                required
                className="bg-gray-50 focus:bg-white focus-visible:ring-cyan-500"
                value={profileForm.fullname}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, fullname: e.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <KeyRound size={16} className="text-cyan-600" /> Password Baru
              </Label>
              <Input
                type="password"
                className="bg-gray-50 focus:bg-white focus-visible:ring-cyan-500"
                value={profileForm.password}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, password: e.target.value })
                }
                placeholder="Kosongkan jika tidak ingin mengubah password"
              />
            </div>

            <DialogFooter className="pt-4 flex gap-3 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsProfileModalOpen(false)}
                className="flex-1 sm:flex-none"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingProfile}
                className="flex-1 sm:flex-none bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold hover:opacity-90 flex items-center justify-center gap-2"
              >
                {isSubmittingProfile ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <Save size={18} />
                )}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
