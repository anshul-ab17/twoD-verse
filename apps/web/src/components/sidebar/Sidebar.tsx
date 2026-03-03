"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import SidebarContent from "./SidebarContent";
import SidebarRail from "./SidebarRail";
import { Menu } from "lucide-react";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 
                   bg-[#3b2a1a] border border-[#6b4b2a] 
                   p-2 rounded"
      >
        <Menu size={20} className="text-yellow-200" />
      </button>

      {/* DESKTOP SIDEBAR */}
      <div className="hidden lg:flex h-screen">

        <div className="w-20 bg-[#2b1a10] border-r-4 border-[#6b4b2a]">
          <SidebarRail
            isOpen={isOpen}
            toggle={() => setIsOpen(!isOpen)}
          />
        </div>

        <motion.div
          animate={{ width: isOpen ? 280 : 0 }}
          transition={{ type: "spring", stiffness: 160, damping: 22 }}
          className="
            bg-[#3b2a1a]
            border-r-4 border-[#6b4b2a]
            overflow-hidden
          "
        >
          {isOpen && (
            <SidebarContent toggle={() => setIsOpen(false)} />
          )}
        </motion.div>
      </div>

      {/* MOBILE DRAWER */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsMobileOpen(false)}
          />

          <div className="relative w-72 bg-[#3b2a1a] border-r-4 border-[#6b4b2a]">
            <SidebarContent toggle={() => setIsMobileOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}