import Link from 'next/link';
import { LayoutDashboard, Activity, Bell, Settings, Zap } from 'lucide-react';

export const Sidebar = () => {
    const navItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Overview', href: '/' },
        { icon: <Activity size={20} />, label: 'Diagnosis', href: '/diagnosis' },
        { icon: <Bell size={20} />, label: 'Alerts', href: '/alerts' },
    ];

    return (
        <aside className="fixed left-0 top-0 h-full w-20 md:w-64 glass border-r z-50 transition-all duration-300">
            <div className="flex h-20 items-center gap-3 px-6 border-b">
                <div className="bg-primary p-2 rounded-lg">
                    <Zap size={24} className="text-white" />
                </div>
                <span className="font-bold text-xl hidden md:block tracking-tight">LUMINOUS</span>
            </div>

            <nav className="mt-8 px-4 space-y-2">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-muted-foreground hover:text-white"
                    >
                        {item.icon}
                        <span className="font-medium hidden md:block">{item.label}</span>
                    </Link>
                ))}
            </nav>
        </aside>
    );
};
