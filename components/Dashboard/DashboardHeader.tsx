"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export function DashboardHeader() {
    const today = new Date();

    return (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
                <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                    {getGreeting()}, Artist
                </h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{format(today, "EEEE, MMMM do, yyyy")}</span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Link href="/bookings">
                    <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all">
                        <Plus className="h-4 w-4" />
                        New Booking
                    </Button>
                </Link>
            </div>
        </div>
    );
}

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
}
