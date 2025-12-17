"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, BookOpen, Layers, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Calendar",
        url: "/calendar",
        icon: Calendar,
    },
    {
        title: "Bookings",
        url: "/bookings",
        icon: BookOpen,
    },
    {
        title: "Projects",
        url: "/projects",
        icon: Layers,
    },
    {
        title: "Settings",
        url: "/settings",
        icon: Settings,
    },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="w-64 border-r bg-card text-card-foreground flex flex-col h-screen sticky top-0">
            <div className="p-6 border-b">
                <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                    <span>InkFlow OS</span>
                </h1>
            </div>
            <nav className="flex-1 p-4 space-y-1">
                {items.map((item) => {
                    const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`);
                    return (
                        <Link
                            key={item.url}
                            href={item.url}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <item.icon className="w-4 h-4" />
                            {item.title}
                        </Link>
                    );
                })}
            </nav>
            <div className="p-4 border-t">
                <button className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground w-full transition-colors">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>
            </div>
        </div>
    );
}
