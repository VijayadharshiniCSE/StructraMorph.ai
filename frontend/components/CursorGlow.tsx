"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/lib/theme";

export default function CursorGlow() {
  const { theme } = useTheme();
  const [position, setPosition] = useState({ x: -1000, y: -1000 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let animationFrameId: number;

    function handleMouseMove(e: MouseEvent) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        setPosition({ x: e.clientX, y: e.clientY });
        if (!isVisible) setIsVisible(true);
      });
    }

    function handleMouseLeave() {
      setIsVisible(false);
    }

    window.addEventListener("mousemove", handleMouseMove);
    document.body.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      document.body.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const isDark = theme === "dark";

  return (
    <div
      className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300 overflow-hidden"
      style={{ opacity: isVisible ? 1 : 0 }}
      aria-hidden="true"
    >
      {/* Broad Ambient Lighting Aura */}
      <div
        className="absolute inset-0 transition-all duration-75"
        style={{
          background: isDark
            ? `radial-gradient(700px circle at ${position.x}px ${position.y}px, rgba(6, 182, 212, 0.14) 0%, rgba(249, 115, 22, 0.09) 35%, transparent 70%)`
            : `radial-gradient(700px circle at ${position.x}px ${position.y}px, rgba(168, 85, 247, 0.16) 0%, rgba(216, 180, 254, 0.10) 35%, transparent 70%)`,
        }}
      />

      {/* Focused Surgical Core Flare */}
      <div
        className="absolute inset-0 transition-all duration-75"
        style={{
          background: isDark
            ? `radial-gradient(150px circle at ${position.x}px ${position.y}px, rgba(6, 182, 212, 0.28) 0%, rgba(249, 115, 22, 0.18) 50%, transparent 80%)`
            : `radial-gradient(150px circle at ${position.x}px ${position.y}px, rgba(168, 85, 247, 0.26) 0%, rgba(233, 213, 255, 0.15) 50%, transparent 80%)`,
        }}
      />
    </div>
  );
}
