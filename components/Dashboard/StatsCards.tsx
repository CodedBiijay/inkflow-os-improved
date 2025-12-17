"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, Calendar, AlertCircle } from "lucide-react";

export function StatsCards({
    todayCount,
    pendingDepositCount,
}: {
    todayCount: number;
    pendingDepositCount: number;
}) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Revenue
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">$12,345</div>
                    <p className="text-xs text-muted-foreground">
                        +15% from last month
                    </p>
                </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Bookings Today
                    </CardTitle>
                    <Calendar className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{todayCount}</div>
                    <p className="text-xs text-muted-foreground">
                        {todayCount === 0 ? "No appointments" : "Scheduled today"}
                    </p>
                </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Active Clients
                    </CardTitle>
                    <Users className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">573</div>
                    <p className="text-xs text-muted-foreground">
                        +12 new this week
                    </p>
                </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Pending Deposits
                    </CardTitle>
                    <AlertCircle className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{pendingDepositCount}</div>
                    <p className="text-xs text-muted-foreground">
                        Requires attention
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
