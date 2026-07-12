"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import SidebarContent from "./SidebarContent";
import SidebarRail from "./SidebarRail";
import { Menu } from "lucide-react";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const railStyle = {
    background: "var(--bg-card)",
    borderRight: "1px solid var(--card-border)",
  }

  const panelStyle = {
    background: "var(--bg-card)",
    borderRight: "1px solid var(--card-border)",
  }

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg border"
        style={{ background: "var(--bg-card)", borderColor: "var(--card-border)", color: "var(--text)" }}
      >
        <Menu size={20} />
      </button>

      {/* COMPACT SIDEBAR (tablet) */}
      <div className="hidden md:flex lg:hidden fixed left-0 top-0 z-40 h-screen">
        <div className="w-20" style={railStyle}>
          <SidebarRail
            isOpen={false}
            toggle={() => setIsMobileOpen(true)}
            onIconAction={() => setIsMobileOpen(true)}
          />
        </div>
      </div>

      {/* DESKTOP SIDEBAR */}
      <div className="hidden lg:flex fixed left-0 top-0 z-40 h-screen">
        <div className="w-20" style={railStyle}>
          <SidebarRail
            isOpen={isOpen}
            toggle={() => setIsOpen(!isOpen)}
            onIconAction={() => { if (!isOpen) setIsOpen(true) }}
          />
        </div>

        <motion.div
          animate={{ width: isOpen ? 280 : 0 }}
          transition={{ type: "spring", stiffness: 160, damping: 22 }}
          className="overflow-hidden"
          style={panelStyle}
        >
          {isOpen && <SidebarContent toggle={() => setIsOpen(false)} />}
        </motion.div>
      </div>

      {/* MOBILE DRAWER */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative w-72" style={panelStyle}>
            <SidebarContent toggle={() => setIsMobileOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
