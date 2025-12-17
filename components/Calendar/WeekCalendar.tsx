
"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { format, startOfWeek, endOfWeek, addDays, eachDayOfInterval, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingDetailsModal } from "./BookingDetailsModal";
import { cn } from "@/lib/utils";

export function WeekCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<any>(null);

    const [refreshKey, setRefreshKey] = useState(0);

    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    useEffect(() => {
        async function fetchWeek() {
            setLoading(true);
            try {
                const startStr = format(weekStart, "yyyy-MM-dd");
                const res = await fetch(`/api/bookings/week?start=${startStr}&t=${refreshKey}`);
                if (res.ok) {
                    const data = await res.json();
                    setBookings(data.bookings || []);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        fetchWeek();
    }, [currentDate, refreshKey]);

    const nextWeek = () => setCurrentDate(addDays(currentDate, 7));
    const prevWeek = () => setCurrentDate(addDays(currentDate, -7));
    const jumpToday = () => setCurrentDate(new Date());

    // Generate hours 8am - 10pm
    const startHour = 8;
    const endHour = 22;
    const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);

    const getBookingStyle = (b: any) => {
        const start = new Date(b.start_time);
        const end = new Date(b.end_time);

        // Calculate minutes from start of day (8am)
        const startMinutes = (start.getHours() * 60 + start.getMinutes()) - (startHour * 60);
        const durationMinutes = (end.getTime() - start.getTime()) / 60000;

        return {
            top: `${(startMinutes / 60) * 60}px`, // 60px per hour
            height: `${(durationMinutes / 60) * 60}px`
        };
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                    {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
                </h2>
                <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" onClick={prevWeek} disabled={loading} className="h-8 w-8">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={jumpToday} disabled={loading} className="text-xs">
                        Today
                    </Button>
                    <Button variant="outline" size="icon" onClick={nextWeek} disabled={loading} className="h-8 w-8">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="flex border border-border rounded-md bg-background overflow-hidden overflow-x-auto">
                {/* Time Labels */}
                <div className="flex-none w-14 border-r border-border bg-muted/10">
                    <div className="h-10 border-b border-border"></div> {/* Empty corner */}
                    {hours.map(h => (
                        <div key={h} className="h-[60px] text-xs text-muted-foreground text-right pr-2 pt-1 border-b border-border/50">
                            {format(new Date().setHours(h, 0), "h a")}
                        </div>
                    ))}
                </div>

                {/* Days Columns */}
                <div className="flex flex-1 min-w-[600px]">
                    {days.map((day, i) => {
                        const isTodayDay = isSameDay(day, new Date());
                        const dayBookings = bookings.filter(b => isSameDay(new Date(b.start_time), day));

                        return (
                            <div key={i} className="flex-1 border-r border-border/50 min-w-[80px] relative">
                                {/* Header */}
                                <div className={cn(
                                    "h-10 border-b border-border flex flex-col items-center justify-center p-1 uppercase",
                                    isTodayDay ? "bg-primary/5" : "bg-muted/10"
                                )}>
                                    <span className="text-[10px] text-muted-foreground font-semibold">{format(day, "EEE")}</span>
                                    <span className={cn(
                                        "text-sm font-bold h-6 w-6 flex items-center justify-center rounded-full",
                                        isTodayDay && "bg-primary text-primary-foreground"
                                    )}>{format(day, "d")}</span>
                                </div>

                                {/* Hour Grid Lines */}
                                <div className="relative">
                                    {hours.map(h => (
                                        <div key={h} className="h-[60px] border-b border-border/30"></div>
                                    ))}

                                    {/* Bookings */}
                                    {dayBookings.map(b => (
                                        <div
                                            key={b.id}
                                            style={getBookingStyle(b)}
                                            className="absolute left-1 right-1 bg-primary/10 border-l-2 border-primary rounded-sm p-1 text-[10px] overflow-hidden cursor-pointer hover:bg-primary/20 hover:scale-[1.02] transition z-10"
                                            onClick={() => setSelectedBooking(b.id)}
                                        >
                                            <div className="font-semibold text-primary truncate">{b.client_name}</div>
                                            <div className="text-muted-foreground truncate">{b.service_name}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <BookingDetailsModal
                bookingId={selectedBooking}
                open={!!selectedBooking}
                onClose={() => setSelectedBooking(null)}
                onUpdate={() => setRefreshKey(k => k + 1)}
            />
        </div>
    );
}
