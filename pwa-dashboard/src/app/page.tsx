"use client";

import { useTelemetry } from "@/context/TelemetryContext";
import { RulGauge } from "@/components/gauges/RulGauge";
import { StatCard } from "@/components/ui/StatCard";
import {
  Thermometer,
  RotateCw,
  Zap,
  AlertTriangle,
  Power,
  Flame,
  Activity
} from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data, status, simulateStress } = useTelemetry();

  // Helper to determine status based on value (mock thresholds)
  const getSeverity = (val: number | undefined, warning: number, critical: number) => {
    if (!val) return 'normal';
    if (val >= critical) return 'critical';
    if (val >= warning) return 'warning';
    return 'normal';
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold font-mono uppercase tracking-tighter">System Overview</h1>
          <p className="text-muted-foreground mt-1">Real-time health monitoring for Inverter {process.env.NEXT_PUBLIC_DEVICE_ID || 'INV-001'}</p>
        </div>

        <div className="flex gap-4">
          <div className="glass px-6 py-3 rounded-2xl flex items-center gap-3">
            <div className={`p-2 rounded-lg ${data.inverter_status === 1 ? 'bg-health-green' : 'bg-primary'}`}>
              <Power size={18} className="text-white" />
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest block">Input Source</span>
              <span className="font-bold">{data.inverter_status === 1 ? 'BATTERY' : 'MAINS'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Gauge Card */}
        <div className="lg:col-span-2 glass p-8 rounded-[2.5rem] flex flex-col items-center justify-center min-h-[450px] relative overflow-hidden group">
          <div className="absolute top-8 left-8">
            <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Predictive Health</span>
            <h3 className="text-2xl font-bold mt-1">Remaining Useful Life</h3>
          </div>

          <RulGauge value={data.hybrid_rul_pct || 100} size={320} />

          <div className="mt-8 grid grid-cols-2 gap-12 text-center">
            <div>
              <span className="text-xs text-muted-foreground uppercase font-bold tracking-widest block">Physics RUL</span>
              <span className="text-xl font-mono font-bold text-blue-400">{data.physics_rul_pct?.toFixed(1) || 100}%</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground uppercase font-bold tracking-widest block">ML Confidence</span>
              <span className="text-xl font-mono font-bold text-purple-400">98.4%</span>
            </div>
          </div>

          {/* Animated Background Decor */}
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
        </div>

        {/* Stress Simulator Controls */}
        <div className="space-y-6">
          <div className="glass p-6 rounded-3xl border-accent/20 bg-accent/5">
            <div className="flex items-center gap-3 mb-6">
              <Flame className="text-accent" size={24} />
              <h3 className="font-bold uppercase tracking-tight">Stress Simulator</h3>
            </div>

            <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
              Force simulation parameters to test the Early Warning system logic in real-time.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => simulateStress('temp')}
                className="w-full py-4 rounded-xl bg-accent text-white font-bold text-sm uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center justify-center gap-2 group shadow-lg shadow-accent/20"
              >
                <Thermometer size={18} className="group-hover:scale-110 transition-transform" />
                Trigger Heat Stress
              </button>

              <button
                onClick={() => simulateStress('inrush')}
                className="w-full py-4 rounded-xl glass border-accent/30 text-accent font-bold text-sm uppercase tracking-widest hover:bg-accent/10 transition-all flex items-center justify-center gap-2 group"
              >
                <Zap size={18} className="group-hover:scale-110 transition-transform" />
                Force Inrush Peak
              </button>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-black/40 border border-white/5 text-[10px] text-muted-foreground italic flex items-start gap-2">
              <AlertTriangle size={12} className="shrink-0 mt-0.5" />
              Warning: Commands are sent directly to the local edge gateway via MQTT RPC.
            </div>
          </div>

          <div className="glass p-6 rounded-3xl">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">ML Insights</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs">Edge Latency</span>
                <span className="text-xs font-mono text-health-green">4ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs">Inference Model</span>
                <span className="text-xs font-mono text-blue-400">v2.1-LSTM</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-muted-foreground/60 border-b border-white/5 pb-2">Predictive Indicators</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Avg Temperature"
          value={data.temperature?.toFixed(1) || '--'}
          unit="°C"
          icon={<Thermometer size={18} />}
          status={getSeverity(data.temperature, 65, 80)}
          trend="Ambient stress indicator"
        />
        <StatCard
          title="Cycle Count"
          value={data.cycle_count || '--'}
          icon={<RotateCw size={18} />}
          trend="Mechanical relay wear"
        />
        <StatCard
          title="Switch Frequency"
          value={data.switching_frequency?.toFixed(1) || '--'}
          unit="/hr"
          icon={<Activity size={18} />}
          status={getSeverity(data.switching_frequency, 5, 10)}
          trend="Degradation multiplier"
        />
        <StatCard
          title="Inrush Ratio"
          value={data.inrush_ratio?.toFixed(1) || '--'}
          unit="%"
          icon={<Zap size={18} />}
          status={getSeverity(data.inrush_ratio, 1.5, 2.5)}
          trend="High current stress"
        />
      </div>
    </div>
  );
}
