"use client";

import { usePathname } from "next/navigation";
import { Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const titles: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/calendar": "Calendar",
    "/bookings": "Bookings",
    "/projects": "Projects",
    "/settings": "Settings",
};

import NotificationsDropdown from "./NotificationsDropdown";

// Using the known Test Artist ID for this dev phase
const ARTIST_ID = "44444444-4444-4444-4444-444444444444";

export function Header() {
    const pathname = usePathname();
    const title = titles[pathname] || "InkFlow Studio";

    return (
        <header className="h-16 border-b bg-background/95 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-10">
            <h2 className="text-lg font-semibold">{title}</h2>
            <div className="flex items-center gap-4">
                <NotificationsDropdown artistId={ARTIST_ID} />
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center border">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center border">
                        <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                </div>
            </div>
        </header>
    );
}
