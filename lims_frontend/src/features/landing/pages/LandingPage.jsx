import React from "react";
import { Navbar } from "../components/Navbar";
import { HeroSection } from "../components/HeroSection";
import { ServicesSection } from "../components/ServicesSection";
import { ProfileSection } from "../components/ProfileSection";
import { FaqSection } from "../components/FaqSection";
import { Footer } from "../components/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <ServicesSection />
      <ProfileSection />
      <FaqSection />
      <Footer />
    </div>
  );
}
