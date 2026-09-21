import React from "react";
import { useNavigate } from "react-router-dom";
import RegistrationForm from "../components/RegistrationsForm";

export default function RegistrationAddPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto py-6">
      <RegistrationForm 
        onSuccess={() => navigate("/registrations")} 
      />
    </div>
  );
}