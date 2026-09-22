import React, { useState, useEffect } from "react";
import RegistrationList from "../components/RegistrationList";
import RegistrationDetail from "../components/RegistrationDetail";
import api from "../../../api/axios.js";

export default function RegistrationMainPage() {
  const [registrations, setRegistrations] = useState([]);
  const [selectedReg, setSelectedReg] = useState(null);

  const fetchRegistrations = async () => {
    try {
      const res = await api.get("/registrations");
      if (res.data.success) {
        setRegistrations(res.data.data);
      }
    } catch (err) {
      console.error("Gagal memuat data registrasi", err);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  return (
    <div>
      {selectedReg ? (
        <RegistrationDetail
          data={selectedReg}
          onBack={() => setSelectedReg(null)}
        />
      ) : (
        <RegistrationList
          data={registrations}
          onViewDetail={(item) => setSelectedReg(item)}
          onRefresh={fetchRegistrations}
        />
      )}
    </div>
  );
}
