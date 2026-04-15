"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface RulGaugeProps {
    value: number; // 0 to 100
    size?: number;
    label?: string;
}

export const RulGauge: React.FC<RulGaugeProps> = ({ value = 0, size = 280, label = "Hybrid RUL" }) => {
    const radius = size * 0.4;
    const strokeWidth = size * 0.1;
    const normalizedValue = Math.min(Math.max(value, 0), 100);
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (normalizedValue / 100) * circumference;

    // Determine color based on banding
    const getColor = (val: number) => {
        if (val <= 20) return '#ef4444'; // Red
        if (val <= 40) return '#f59e0b'; // Amber
        return '#10b981'; // Green
    };

    const currentColor = getColor(normalizedValue);

    return (
        <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
                {/* Background Track */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#1e293b"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                />

                {/* Progress Arc */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={currentColor}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    strokeLinecap="round"
                    style={{
                        filter: `drop-shadow(0 0 8px ${currentColor}40)`
                    }}
                />
            </svg>

            {/* Central Content */}
            <div className="absolute flex flex-col items-center justify-center">
                <motion.span
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-5xl font-bold font-mono tracking-tighter"
                >
                    {normalizedValue.toFixed(1)}%
                </motion.span>
                <span className="text-muted-foreground text-xs uppercase font-bold tracking-widest mt-1">
                    {label}
                </span>
            </div>

            {/* Outer Glow Effect */}
            <div
                className="absolute inset-0 rounded-full opacity-10 pointer-events-none"
                style={{
                    background: `radial-gradient(circle, ${currentColor} 0%, transparent 70%)`,
                }}
            />
        </div>
    );
};
