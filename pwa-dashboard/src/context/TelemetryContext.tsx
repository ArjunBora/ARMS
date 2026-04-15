"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

interface TelemetryData {
    cycle_count?: number;
    inverter_current?: number;
    temperature?: number;
    switching_frequency?: number;
    inrush_ratio?: number;
    physics_health_index?: number;
    ml_rul_pct?: number;
    physics_rul_pct?: number;
    hybrid_rul_pct?: number;
    alert_level?: string;
    ts?: number;
    [key: string]: any;
}

interface TelemetryContextType {
    data: TelemetryData;
    status: 'connected' | 'disconnected' | 'syncing';
    lastUpdated: Date | null;
    history: TelemetryData[];
    simulateStress: (type: 'temp' | 'inrush') => void;
}

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

export const TelemetryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [data, setData] = useState<TelemetryData>({});
    const [status, setStatus] = useState<'connected' | 'disconnected' | 'syncing'>('disconnected');
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [history, setHistory] = useState<TelemetryData[]>([]);
    const ws = useRef<WebSocket | null>(null);

    // Load last known state from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('last_telemetry');
        if (saved) {
            const parsed = JSON.parse(saved);
            setData(parsed);
            setLastUpdated(new Date(parsed.local_ts || Date.now()));
        }
    }, []);

    useEffect(() => {
        const connect = () => {
            const host = process.env.NEXT_PUBLIC_TB_HOST || 'mqtt.thingsboard.cloud';
            const token = process.env.NEXT_PUBLIC_TB_TOKEN;

            if (!token) {
                console.error("ThingsBoard Token missing!");
                return;
            }

            setStatus('syncing');
            const url = `ws://${host}/api/ws/plugins/telemetry?token=${token}`;

            const socket = new WebSocket(url);
            ws.current = socket;

            socket.onopen = () => {
                setStatus('connected');
                // Subscribe to telemetry
                const subMsg = {
                    tsSubCmds: [
                        {
                            entityType: "DEVICE",
                            entityId: process.env.NEXT_PUBLIC_DEVICE_ID,
                            scope: "LATEST_TELEMETRY",
                            cmdId: 10
                        }
                    ],
                    historyCmds: [],
                    attrSubCmds: []
                };
                socket.send(JSON.stringify(subMsg));
            };

            socket.onmessage = (event) => {
                const msg = JSON.parse(event.data);
                if (msg.data) {
                    // Extract data from ThingsBoard format
                    const newData: TelemetryData = {};
                    Object.keys(msg.data).forEach(key => {
                        newData[key] = msg.data[key][0][1];
                    });

                    const timestampedData = { ...newData, local_ts: Date.now() };
                    setData(prev => ({ ...prev, ...timestampedData }));
                    setLastUpdated(new Date());

                    // Save to history and localStorage
                    setHistory(prev => [timestampedData, ...prev].slice(0, 100));
                    localStorage.setItem('last_telemetry', JSON.stringify(timestampedData));
                }
            };

            socket.onclose = () => {
                setStatus('disconnected');
                // Reconnect after 5 seconds
                setTimeout(connect, 5000);
            };

            socket.onerror = (err) => {
                console.error("WebSocket Error:", err);
                socket.close();
            };
        };

        connect();
        return () => ws.current?.close();
    }, []);

    const simulateStress = (type: 'temp' | 'inrush') => {
        if (status !== 'connected' || !ws.current) return;

        // Push an RPC command to ThingsBoard
        const rpcMsg = {
            rpcCmds: [
                {
                    entityType: "DEVICE",
                    entityId: process.env.NEXT_PUBLIC_DEVICE_ID,
                    query: {
                        method: "simulateStress",
                        params: { type },
                        timeout: 5000
                    },
                    cmdId: 20
                }
            ]
        };
        ws.current.send(JSON.stringify(rpcMsg));
    };

    return (
        <TelemetryContext.Provider value={{ data, status, lastUpdated, history, simulateStress }}>
            {children}
        </TelemetryContext.Provider>
    );
};

export const useTelemetry = () => {
    const context = useContext(TelemetryContext);
    if (!context) throw new Error("useTelemetry must be used within a TelemetryProvider");
    return context;
};
