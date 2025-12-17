
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/Dashboard/Header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MonthCalendar } from "@/components/Calendar/MonthCalendar";
import { WeekCalendar } from "@/components/Calendar/WeekCalendar";
import { Card, CardContent } from "@/components/ui/card";

export default function CalendarPage() {
    return (
        <div className="space-y-6">

            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Calendar</h2>
                    <p className="text-muted-foreground">Manage your schedule and upcoming appointments.</p>
                </div>
            </div>

            <Tabs defaultValue="month" className="w-full">
                <TabsList className="grid w-[400px] grid-cols-2">
                    <TabsTrigger value="month">Month View</TabsTrigger>
                    <TabsTrigger value="week">Week View</TabsTrigger>
                </TabsList>

                <div className="mt-4">
                    <TabsContent value="month">
                        <Card>
                            <CardContent className="p-4">
                                <MonthCalendar />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="week">
                        <Card>
                            <CardContent className="p-4">
                                <WeekCalendar />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
