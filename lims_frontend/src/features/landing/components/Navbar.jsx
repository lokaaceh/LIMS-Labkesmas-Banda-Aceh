import React from "react";
import { Link } from "react-router-dom";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

const menu = [
  {
    name: "Beranda",
    href: "#beranda",
  },
  {
    name: "Layanan",
    href: "#layanan",
  },
  {
    name: "Profil",
    href: "#profil",
  },
  {
    name: "FAQ",
    href: "#faq",
  },
  {
    name: "Kontak",
    href: "#kontak",
  },
];

export const Navbar = () => (
  <nav
    className="
      fixed
      top-0
      w-full
      z-50
      bg-white/80
      backdrop-blur-xl
      border-b
      border-slate-100
    "
  >
    <div
      className="
        max-w-7xl
        mx-auto
        px-6
        h-20
        flex
        items-center
        justify-between
      "
    >
      {/* Logo */}
      <Link
        to="/"
        className="
          flex
          items-center
        "
      >
        <img
          src="/logo.svg"
          alt="Labkesmas Logo"
          className="
            h-11
            w-auto
          "
        />
      </Link>

      {/* Menu */}
      <div
        className="
          hidden
          md:flex
          items-center
          gap-8
        "
      >
        {menu.map((item) => (
          <a
            key={item.name}
            href={item.href}
            className="
                text-sm
                font-medium
                text-slate-600
                hover:text-[#C21818]
                transition-colors
                duration-300
              "
          >
            {item.name}
          </a>
        ))}
      </div>

      {/* Login */}
      <Link to="/login">
        <Button className="px-4 py-5 shadow-lg font-semibold">
          <LogIn size={18} />
          Masuk Sistem
        </Button>
      </Link>
    </div>
  </nav>
);
