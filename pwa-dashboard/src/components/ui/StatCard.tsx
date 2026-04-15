"use client";

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    unit?: string;
    icon: React.ReactElement;
    trend?: string;
    status?: 'normal' | 'warning' | 'critical';
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, unit, icon, trend, status = 'normal' }) => {
    const getStatusColor = () => {
        switch (status) {
            case 'critical': return 'text-health-red border-health-red/20 shadow-health-red/5';
            case 'warning': return 'text-health-yellow border-health-yellow/20 shadow-health-yellow/5';
            default: return 'text-primary border-white/10 shadow-primary/5';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass glass-hover p-6 rounded-2xl flex flex-col justify-between border ${getStatusColor()}`}
        >
            <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs uppercase font-bold tracking-widest">{title}</span>
                <div className="bg-white/5 p-2 rounded-lg opacity-80">
                    {icon}
                </div>
            </div>

            <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold font-mono tracking-tighter">{value}</span>
                {unit && <span className="text-muted-foreground text-sm">{unit}</span>}
            </div>

            {trend && (
                <div className="mt-2 flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground italic">{trend}</span>
                </div>
            )}
        </motion.div>
    );
};
