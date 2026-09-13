"use client";

import React, { useState } from "react";
import { LOGO_BASE64 } from "@/lib/logoAsset";

interface BrandLogoProps {
  className?: string;
  alt?: string;
  size?: number;
}

export default function BrandLogo({
  className = "h-full w-full object-contain rounded-md",
  alt = "StructraMorph.ai Logo",
  size,
}: BrandLogoProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    // High-fidelity SVG fallback representing StructraMorph Component Graph
    return (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={size ? { width: size, height: size } : undefined}
      >
        <defs>
          <linearGradient id="smGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#F97316" />
          </linearGradient>
          <linearGradient id="smGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
        <rect width="48" height="48" rx="10" fill="#0B1120" />
        {/* Connection nodes */}
        <circle cx="24" cy="24" r="8" fill="url(#smGrad1)" />
        <circle cx="24" cy="10" r="3.5" fill="#06B6D4" />
        <circle cx="36" cy="18" r="3.5" fill="#F97316" />
        <circle cx="36" cy="32" r="3.5" fill="#3B82F6" />
        <circle cx="24" cy="38" r="3.5" fill="#10B981" />
        <circle cx="12" cy="32" r="3.5" fill="#EC4899" />
        <circle cx="12" cy="18" r="3.5" fill="#A855F7" />
        {/* Connector lines */}
        <path d="M24 13.5V16M33.5 19.5L30 21.5M33.5 30.5L30 28.5M24 34.5V32M14.5 30.5L18 28.5M14.5 19.5L18 21.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />
        {/* Core spark */}
        <path d="M24 20L25.5 24L24 28L22.5 24Z" fill="white" />
      </svg>
    );
  }

  return (
    <img
      src={LOGO_BASE64}
      alt={alt}
      onError={() => setHasError(true)}
      className={className}
      style={size ? { width: size, height: size } : undefined}
      loading="eager"
    />
  );
}
