import React from "react";
import { FlaskConical, MapPin, Phone, Mail } from "lucide-react";
import { Card } from "@/components/ui/card";

const ContactItem = ({ icon: Icon, children }) => (
  <div
    className="
      flex
      items-start
      gap-4
    "
  >
    <div
      className="
        w-10
        h-10
        rounded-xl
        bg-[#16b3ac]/10
        flex
        items-center
        justify-center
        shrink-0
      "
    >
      <Icon size={20} className="text-[#16b3ac]" />
    </div>

    <div
      className="
        text-slate-600
        leading-relaxed
      "
    >
      {children}
    </div>
  </div>
);

export const Footer = () => (
  <footer
    id="kontak"
    className="
      bg-white
      pt-20
      pb-10
    "
  >
    <div
      className="
        max-w-7xl
        mx-auto
        px-6
      "
    >
      <div
        className="
          grid
          lg:grid-cols-2
          gap-14
          mb-16
        "
      >
        {/* Brand & Contact */}
        <div>
          <div
            className="
              flex
              items-center
              gap-3
              mb-6
            "
          >
            <div
              className="
                w-10
                h-10
                rounded-xl
                bg-[#16b3ac]
                flex
                items-center
                justify-center
                text-white
              "
            >
              <FlaskConical size={22} />
            </div>

            <div>
              <h3
                className="
                  font-bold
                  text-xl
                  text-slate-900
                "
              >
                LIMS Labkesmas
              </h3>

              <p
                className="
                  text-xs
                  text-slate-500
                "
              >
                Banda Aceh
              </p>
            </div>
          </div>

          <p
            className="
              text-slate-500
              max-w-md
              leading-relaxed
              mb-8
            "
          >
            Sistem informasi terpadu untuk mendukung pengelolaan laboratorium
            kesehatan secara digital, terintegrasi, dan akurat.
          </p>

          <div
            className="
              space-y-5
            "
          >
            <ContactItem icon={MapPin}>
              Jl. Bandara SIM Blang Bintang Lr. Biomedis No. 9,
              <br />
              Kecamatan Ingin Jaya Kabupaten Aceh Besar,
              <br />
              Provinsi Aceh 23317
            </ContactItem>

            <ContactItem icon={Phone}>
              0651-8070189 (Telepon)
              <br />
              0811-6107-253 (Whatsapp)
            </ContactItem>

            <ContactItem icon={Mail}>labkesmasaceh@kemkes.go.id</ContactItem>
          </div>
        </div>

        {/* Map */}
        <Card className="overflow-hidden p-0 h-[380px]">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3971.493245603183!2d95.3614462!3d5.5095249!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x30403845a4f33693%3A0xb07da876428a0d32!2sBalai%20Labkesmas%20Banda%20Aceh!5e0!3m2!1sid!2sid!4v1733730000000"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Balai Labkesmas Banda Aceh"
          />
        </Card>
      </div>

      {/* Bottom */}
      <div
        className="
          border-t
          border-slate-100
          pt-8
          flex
          flex-col
          md:flex-row
          justify-between
          items-center
          gap-4
          text-sm
          text-slate-500
        "
      >
        <p>© 2026 LIMS Labkesmas Banda Aceh. All rights reserved.</p>

        <div
          className="
            flex
            gap-6
          "
        >
          <a
            href="#"
            className="
              hover:text-[#16b3ac]
              transition
            "
          >
            Privacy Policy
          </a>

          <a
            href="#"
            className="
              hover:text-[#16b3ac]
              transition
            "
          >
            Terms of Service
          </a>
        </div>
      </div>
    </div>
  </footer>
);
