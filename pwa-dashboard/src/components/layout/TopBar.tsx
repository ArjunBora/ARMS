"use client";

import { useTelemetry } from '@/context/TelemetryContext';
import { Wifi, WifiOff, RefreshCcw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';

export const TopBar = () => {
    const { status, lastUpdated } = useTelemetry();

    return (
        <header className="h-20 glass border-b px-8 flex items-center justify-between sticky top-0 z-40">
            <div>
                <h2 className="text-muted-foreground text-sm font-medium uppercase tracking-widest">System Status</h2>
                <p className="text-xl font-bold font-mono">EARLY WARNING DASHBOARD</p>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2">
                        {status === 'connected' && (
                            <div className="flex items-center gap-2 text-health-green">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-health-green opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-health-green"></span>
                                </span>
                                <span className="text-xs font-bold uppercase">Live</span>
                            </div>
                        )}
                        {status === 'syncing' && (
                            <div className="flex items-center gap-2 text-primary animate-pulse">
                                <RefreshCcw size={14} className="animate-spin" />
                                <span className="text-xs font-bold uppercase">Syncing...</span>
                            </div>
                        )}
                        {status === 'disconnected' && (
                            <div className="flex items-center gap-2 text-health-red">
                                <WifiOff size={14} />
                                <span className="text-xs font-bold uppercase">Offline</span>
                            </div>
                        )}
                    </div>
                    {lastUpdated && (
                        <span className="text-[10px] text-muted-foreground mt-1">
                            Last update: {lastUpdated.toLocaleTimeString()}
                        </span>
                    )}
                </div>

                <div className="h-10 w-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center cursor-pointer">
                    <span className="text-xs font-bold">AB</span>
                </div>
            </div>
        </header>
    );
};
