import { useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

import {
  Menu,
  Users,
  Clock,
  CheckCircle2,
  Calendar,
  FileCheck,
  FlaskConical,
  PackageCheck,
  PlusCircle,
  Syringe,
  Settings,
  CheckSquare,
} from "lucide-react";

// Components
import Sidebar from "../components/Sidebar";
import RegistrationForm from "./RegistrationsForm";
import RegistrationList from "./RegistrationList";
import RegistrationDetail from "./RegistrationDetail";
import UserManagement from "./UserManagement";
import MasterPemeriksaan from "./MasterPemeriksaan";
import LabQueue from "./LabQueue";
import DataManagement from "./DataManagement";
import ValidationQueue from "./ValidationQueue";
import SamplerQueue from "./SamplerQueue";
import FinanceDashboard from "./FinanceDashboard";
import SystemSettings from "../components/SystemSettings";

const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
      {subtext && <p className="text-xs text-gray-400 mt-2">{subtext}</p>}
    </div>
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon size={24} className="text-white" />
    </div>
  </div>
);

// --- PERBAIKAN DI SINI (DashboardOverview) ---
// 1. Terima props 'userRole'
const DashboardOverview = ({
  data,
  stats,
  onChangeView,
  onRefresh,
  userRole,
}) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Registrasi"
          value={stats?.total || 0}
          icon={Users}
          color="bg-blue-600"
          subtext="Hari ini"
        />
        <StatCard
          title="Terdaftar"
          value={stats?.terdaftar || 0}
          icon={Clock}
          color="bg-gray-500"
          subtext="Menunggu sampel"
        />
        <StatCard
          title="Antrian Sampel"
          value={stats?.in_sampling || 0}
          icon={Syringe}
          color="bg-red-500"
          subtext="Sedang diambil"
        />
        <StatCard
          title="Diterima Lab"
          value={stats?.diterima_lab || 0}
          icon={PackageCheck}
          color="bg-indigo-500"
          subtext="Sampel diterima"
        />
        <StatCard
          title="Proses Lab"
          value={stats?.proses_lab || 0}
          icon={FlaskConical}
          color="bg-yellow-500"
          subtext="Sedang dianalisis"
        />
        <StatCard
          title="Verifikasi Lab"
          value={stats?.menunggu_verifikasi || 0}
          icon={CheckSquare}
          color="bg-teal-500"
          subtext="Menunggu ACC Verifikator"
        />
        <StatCard
          title="Selesai Uji"
          value={stats?.selesai_uji || 0}
          icon={FileCheck}
          color="bg-purple-500"
          subtext="Menunggu validasi dokter"
        />
        <StatCard
          title="Selesai"
          value={stats?.selesai || 0}
          icon={CheckCircle2}
          color="bg-green-500"
          subtext="Hasil keluar"
        />
      </div>

      {/* 2. LOGIC FIX: Sembunyikan List Pasien Terbaru jika role adalah 'lab'.
         Role 'lab' hanya boleh melihat statistik di atas, lalu bekerja via menu 'Antrian Lab'.
      */}
      {userRole !== "lab" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
              <FlaskConical size={20} className="text-cyan-600" /> Pasien
              Terbaru
            </h3>
            <button
              onClick={() => onChangeView("list")}
              className="text-sm text-cyan-600 font-medium hover:underline"
            >
              Lihat Semua
            </button>
          </div>
          <RegistrationList
            data={data}
            onViewDetail={(item) => onChangeView("detail", item)}
            onRefresh={onRefresh}
            isDashboard={true}
          />
        </div>
      )}
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const [view, setView] = useState("overview");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [registrations, setRegistrations] = useState([]);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMainData = useCallback(async () => {
    try {
      const resData = await api.get("/registrations");
      setRegistrations(
        Array.isArray(resData.data.data) ? resData.data.data : [],
      );

      const resStats = await api.get("/registrations/stats");

      if (resStats.data.success) {
        const d = resStats.data.data;
        const mappedStats = {
          total: Number(d.total || 0),
          terdaftar: Number(d.waiting_queue || 0),
          in_sampling: Number(d.in_sampling || 0),
          diterima_lab: Number(d.diterima_lab || 0),
          proses_lab: Number(d.in_testing || 0),
          menunggu_verifikasi: Number(d.waiting_verification || 0),
          selesai_uji: Number(d.waiting_validation || 0),
          selesai: Number(d.completed || 0),
        };

        setStats(mappedStats);
      }
    } catch (error) {
      console.error("Sinkronisasi gagal:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMainData();
  }, [fetchMainData]);

  const handleChangeView = useCallback(
    async (newView, item = null) => {
      // --- TAMBAHAN KEAMANAN ---
      // Mencegah user lab memaksa masuk ke view list/detail via console/bug
      if (
        user?.role === "lab" &&
        (newView === "list" || newView === "detail")
      ) {
        return;
      }

      if (newView === "detail" && item) {
        try {
          const res = await api.get(`/registrations/${item.id}`);
          if (res.data.success) {
            setSelectedRegistration(res.data.data);
          } else {
            setSelectedRegistration(item);
          }
        } catch (error) {
          console.error("Gagal mengambil rincian pasien:", error);
          setSelectedRegistration(item);
        }
      } else if (item) {
        setSelectedRegistration(item);
      } else {
        setSelectedRegistration(null);
      }

      setView(newView);
      setIsMobileOpen(false);
    },
    [user?.role],
  );

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      <Sidebar
        currentView={view}
        setView={setView}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />
      <div className="flex-1 md:ml-64">
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-20 px-6 py-4 flex justify-between items-center border-b border-gray-100">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              <Menu size={24} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-800 capitalize">
                {view === "overview" ? "Dashboard" : view.replace("-", " ")}
              </h2>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Calendar size={12} />{" "}
                {new Date().toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="block text-sm font-bold text-gray-700">
              {user?.fullname}
            </span>
            <span className="text-[10px] text-cyan-600 uppercase font-bold tracking-widest">
              {user?.role}
            </span>
          </div>
        </header>
        <main className="p-6 md:p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="w-10 h-10 border-4 border-gray-200 border-t-cyan-500 rounded-full animate-spin"></div>
              <p className="text-gray-400">Sinkronisasi Data...</p>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto">
              {view === "overview" && (
                <DashboardOverview
                  data={registrations}
                  stats={stats}
                  onChangeView={handleChangeView}
                  onRefresh={fetchMainData}
                  userRole={user?.role}
                />
              )}
              {view === "create" && (
                <RegistrationForm
                  onSuccess={() => {
                    fetchMainData();
                    setView("list");
                  }}
                />
              )}
              {view === "list" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">
                      Data Pasien
                    </h2>
                    {(user.role === "admin" || user.role === "input") && (
                      <button
                        onClick={() => setView("create")}
                        className="bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
                      >
                        <PlusCircle size={18} /> Tambah Baru
                      </button>
                    )}
                  </div>
                  <RegistrationList
                    data={registrations}
                    onViewDetail={(i) => handleChangeView("detail", i)}
                    onRefresh={fetchMainData}
                  />
                </div>
              )}
              {view === "finance" && <FinanceDashboard />}
              {view === "detail" && (
                <RegistrationDetail
                  data={selectedRegistration}
                  onBack={() => setView("list")}
                />
              )}
              {view === "lab-queue" && (
                <LabQueue onRefreshStats={fetchMainData} />
              )}
              {view === "sampler" && (
                <SamplerQueue onRefreshStats={fetchMainData} />
              )}
              {view === "validation" && (
                <ValidationQueue onRefreshStats={fetchMainData} />
              )}
              {view === "management" && (
                <DataManagement onRefreshStats={fetchMainData} />
              )}
              {view === "master" && <MasterPemeriksaan />}
              {view === "users" && <UserManagement />}
              {view === "settings" && <SystemSettings />}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
