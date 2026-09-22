import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const ServiceCard = ({ icon: Icon, title, desc, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    viewport={{ once: true }}
  >
    <Card
      className="
        group
        h-[320px]
        border
        border-slate-100
        bg-white
        rounded-2xl
        shadow-sm
        hover:shadow-xl
        transition-all
        duration-300
        hover:-translate-y-2
      "
    >
      <CardContent className="p-6">
        {/* Icon */}
        <div
          className="
            w-14
            h-14
            rounded-xl
            bg-[#16b3ac]/10
            flex
            items-center
            justify-center
            mb-6
            transition-all
            duration-300
            group-hover:bg-[#16b3ac]
          "
        >
          <Icon
            size={25}
            className="
              text-[#16b3ac]
              transition-colors
              duration-300
              group-hover:text-white
            "
          />
        </div>

        {/* Title */}
        <h3
          className="
            text-lg
            font-bold
            text-slate-900
            mb-3
          "
        >
          {title}
        </h3>

        {/* Description */}
        <p
          className="
            text-slate-500
            leading-relaxed
            line-clamp-3
          "
        >
          {desc}
        </p>

        {/* Action */}
        <div
          className="
            mt-6
            flex
            items-center
            text-[#16b3ac]
            font-semibold
            text-sm
            group-hover:translate-x-2
            transition-transform
            duration-300
            cursor-pointer
          "
        >
          Selengkapnya
          <ArrowRight size={16} className="ml-2" />
        </div>
      </CardContent>
    </Card>
  </motion.div>
);
