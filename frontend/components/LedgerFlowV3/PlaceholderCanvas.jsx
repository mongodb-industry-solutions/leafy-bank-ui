"use client";

import React from "react";
import { motion } from "motion/react";
import { SPRING } from "../LedgerFlow/motionConfig";

export function PlaceholderCanvas({ sceneNumber, sceneName, phase, accentColor, lightColor, description, glyph }) {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 1600 380"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block" }}
    >
      {/* Background */}
      <rect width={1600} height={380} fill="#FAFBFA" rx={8} />

      {/* Centre card */}
      <rect x={500} y={80} width={600} height={220} rx={16} fill="#FFFFFF" stroke="#E8EDEB" strokeWidth={1.5} />

      {/* Accent top strip */}
      <rect x={500} y={80} width={600} height={6} rx={4} fill={accentColor} opacity={0.25} />

      {/* Glyph / icon area */}
      <text x={800} y={148} textAnchor="middle" fontSize={40} style={{ userSelect: "none" }}>{glyph}</text>

      {/* Scene number */}
      <text
        x={800} y={178}
        textAnchor="middle"
        fontFamily="'Source Code Pro', Menlo, monospace"
        fontSize={11}
        fontWeight={700}
        letterSpacing="0.1em"
        fill={accentColor}
        opacity={0.8}
      >
        SCENE {sceneNumber}
      </text>

      {/* Scene name */}
      <text
        x={800} y={204}
        textAnchor="middle"
        fontFamily="'Euclid Circular A', 'Helvetica Neue', sans-serif"
        fontSize={22}
        fontWeight={700}
        fill="#001E2B"
      >
        {sceneName}
      </text>

      {/* Description */}
      <text
        x={800} y={228}
        textAnchor="middle"
        fontFamily="'Euclid Circular A', 'Helvetica Neue', sans-serif"
        fontSize={12.5}
        fill="#5C6C75"
      >
        {description}
      </text>

      {/* Phase pill */}
      <rect x={736} y={248} width={128} height={24} rx={12} fill={lightColor} stroke={accentColor} strokeWidth={1} strokeOpacity={0.4} />
      <text
        x={800} y={264}
        textAnchor="middle"
        fontFamily="'Source Code Pro', Menlo, monospace"
        fontSize={10}
        fontWeight={700}
        letterSpacing="0.06em"
        fill={accentColor}
      >
        {phase}
      </text>

      {/* Subtle corner decorations */}
      {[0, 1, 2, 3].map((i) => (
        <circle
          key={i}
          cx={i < 2 ? 120 + i * 80 : 1360 + (i - 2) * 80}
          cy={190}
          r={3}
          fill="#E8EDEB"
          opacity={0.6}
        />
      ))}
    </svg>
  );
}
