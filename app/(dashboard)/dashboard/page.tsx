"use client";

import { useEffect, useState } from "react";
import { BookingListItem } from "@/components/Dashboard/BookingListItem";
import { DepositListItem } from "@/components/Dashboard/DepositListItem";
import { DashboardHeader } from "@/components/Dashboard/DashboardHeader";
import { StatsCards } from "@/components/Dashboard/StatsCards";
import { RevenueChart } from "@/components/Dashboard/RevenueChart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarClock, CreditCard } from "lucide-react";

export default function DashboardPage() {
    const [todayBookings, setTodayBookings] = useState<any[]>([]);
    const [pendingDeposits, setPendingDeposits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const [todayRes, pendingRes] = await Promise.all([
                    fetch("/api/bookings/today"),
                    fetch("/api/bookings/pending-deposits")
                ]);

                if (todayRes.ok) {
                    const data = await todayRes.json();
                    setTodayBookings(data.bookings || []);
                }
                if (pendingRes.ok) {
                    const data = await pendingRes.json();
                    setPendingDeposits(data.bookings || []);
                }
            } catch (error) {
                console.error("Failed to load dashboard data", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    return (
        <div className="space-y-8 p-1">
            {/* Header Section */}
            <DashboardHeader />

            {/* Stats Row */}
            <StatsCards
                todayCount={todayBookings.length}
                pendingDepositCount={pendingDeposits.length}
            />

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-7">

                {/* Left Column: Revenue Chart & Today's Schedule (Span 4) */}
                <div className="lg:col-span-4 space-y-6">
                    <RevenueChart />

                    <Card className="bg-card/50 border-border/50">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CalendarClock className="h-5 w-5 text-primary" />
                                <CardTitle>Today's Schedule</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-sm text-muted-foreground animate-pulse">Loading schedule...</div>
                            ) : todayBookings.length === 0 ? (
                                <div className="h-32 flex flex-col items-center justify-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border/50">
                                    <p className="text-sm">No appointments today.</p>
                                    <p className="text-xs opacity-70">Enjoy your free time!</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {todayBookings.map((b) => (
                                        <BookingListItem key={b.id} booking={b} />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Pending Deposits & Activity (Span 3) */}
                <div className="lg:col-span-3 space-y-6">
                    <Card className="h-full bg-card/50 border-border/50">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-primary" />
                                <CardTitle>Pending Deposits</CardTitle>
                            </div>
                            <CardDescription>
                                Deposits awaiting payment confirmation.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-sm text-muted-foreground animate-pulse">Loading deposits...</div>
                            ) : pendingDeposits.length === 0 ? (
                                <div className="h-32 flex flex-col items-center justify-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border/50">
                                    <p className="text-sm">All caught up!</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {pendingDeposits.map((b) => (
                                        <DepositListItem key={b.id} booking={b} />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
