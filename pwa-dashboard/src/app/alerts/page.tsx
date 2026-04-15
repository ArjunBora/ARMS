"use client";

import { useTelemetry } from "@/context/TelemetryContext";
import {
    Bell,
    Clock,
    AlertCircle,
    ShieldAlert,
    CheckCircle2,
    ChevronRight,
    Filter,
    Wrench
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AlertsPage() {
    const { history } = useTelemetry();

    // Filter only those that actually have an alert level or significant status
    const alerts = history.filter(h => h.alert_level && h.alert_level !== 'NORMAL')
        .slice(0, 50);

    const getAlertIcon = (level: string) => {
        switch (level) {
            case 'CRITICAL': return <ShieldAlert className="text-health-red" size={20} />;
            case 'WARNING': return <AlertCircle className="text-health-yellow" size={20} />;
            default: return <Bell className="text-muted-foreground" size={20} />;
        }
    };

    const getAlertBg = (level: string) => {
        switch (level) {
            case 'CRITICAL': return 'bg-health-red/10 border-health-red/20';
            case 'WARNING': return 'bg-health-yellow/10 border-health-yellow/20';
            default: return 'bg-white/5 border-white/10';
        }
    };

    const getServiceAction = (level: string) => {
        switch (level) {
            case 'CRITICAL': return "Emergency: Schedule physical relay replacement within 24 hours.";
            case 'WARNING': return "Inspection: Perform manual contact resistance check during next maintenance.";
            default: return "No action required. Monitoring transients.";
        }
    };

    return (
        <div className="space-y-8 pb-10">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-bold font-mono uppercase tracking-tighter">Notification Center</h1>
                    <p className="text-muted-foreground mt-1">Audit logs and service action recommendations.</p>
                </div>
                <div className="flex gap-2">
                    <button className="glass px-4 py-2 rounded-xl text-xs font-bold uppercase flex items-center gap-2">
                        <Filter size={14} /> Filter
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <AnimatePresence mode="popLayout">
                    {alerts.length > 0 ? (
                        alerts.map((alert, idx) => (
                            <motion.div
                                key={alert.ts || idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`glass p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-6 ${getAlertBg(alert.alert_level || '')}`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="mt-1">
                                        {getAlertIcon(alert.alert_level || '')}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-xs font-bold uppercase tracking-widest ${alert.alert_level === 'CRITICAL' ? 'text-health-red' : 'text-health-yellow'
                                                }`}>
                                                {alert.alert_level}
                                            </span>
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <Clock size={12} />
                                                <span className="text-[10px] font-mono leading-none pt-0.5">
                                                    {alert.local_ts ? new Date(alert.local_ts).toLocaleTimeString() : 'Unknown Time'}
                                                </span>
                                            </div>
                                        </div>
                                        <h3 className="font-bold text-lg mt-1">
                                            {alert.alert_level === 'CRITICAL' ? 'Critical Relay Degradation' : 'Relay Wear Warning'}
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                                            Hybrid RUL detected at {alert.hybrid_rul_pct?.toFixed(1)}%. Stress factors: {alert.temperature?.toFixed(1)}°C @ {alert.inrush_ratio?.toFixed(1)}% Inrush.
                                        </p>
                                    </div>
                                </div>

                                <div className="md:border-l md:border-white/10 md:pl-8 flex flex-col items-end gap-3 min-w-[280px]">
                                    <div className="flex items-center gap-2 text-xs font-medium bg-black/20 p-3 rounded-xl border border-white/5 w-full">
                                        <Wrench size={14} className="text-primary shrink-0" />
                                        <span>{getServiceAction(alert.alert_level || '')}</span>
                                    </div>
                                    <button className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline flex items-center gap-1">
                                        Acknowledge & Clear <ChevronRight size={12} />
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="glass p-20 rounded-3xl flex flex-col items-center justify-center text-center space-y-4">
                            <div className="bg-health-green/10 p-4 rounded-full text-health-green border border-health-green/20">
                                <CheckCircle2 size={40} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Systems Nominal</h3>
                                <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-2">
                                    No active pre-alarms or critical warnings detected in the last 100 cycles.
                                </p>
                            </div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
