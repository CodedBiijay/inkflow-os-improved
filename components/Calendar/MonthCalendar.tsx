
"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingDetailsModal } from "./BookingDetailsModal";
import { cn } from "@/lib/utils";

export function MonthCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [bookings, setBookings] = useState<Record<string, any[]>>({});
    const [loading, setLoading] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<any>(null);

    const [refreshKey, setRefreshKey] = useState(0);

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    useEffect(() => {
        async function fetchMonth() {
            setLoading(true);
            try {
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth() + 1;
                const res = await fetch(`/api/bookings/month?year=${year}&month=${month}&t=${refreshKey}`);
                if (res.ok) {
                    const data = await res.json();
                    const map: Record<string, any[]> = {};
                    (data.days || []).forEach((d: any) => {
                        map[d.date] = d.bookings;
                    });
                    setBookings(map);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        fetchMonth();
    }, [currentDate, refreshKey]);

    const nextMonth = () => setCurrentDate(dayjs(currentDate).add(1, 'month').toDate());
    const prevMonth = () => setCurrentDate(dayjs(currentDate).subtract(1, 'month').toDate());
    const jumpToday = () => setCurrentDate(new Date());

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{format(currentDate, "MMMM yyyy")}</h2>
                <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" onClick={prevMonth} disabled={loading} className="h-8 w-8">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={jumpToday} disabled={loading} className="text-xs">
                        Today
                    </Button>
                    <Button variant="outline" size="icon" onClick={nextMonth} disabled={loading} className="h-8 w-8">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-px bg-muted rounded-md overflow-hidden border border-border">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="bg-background p-2 text-center text-xs font-semibold text-muted-foreground uppercase">{d}</div>
                ))}

                {days.map((day, i) => {
                    const dateKey = format(day, "yyyy-MM-dd");
                    const dayBookings = bookings[dateKey] || [];
                    const isCurrentMonth = isSameMonth(day, monthStart);

                    return (
                        <div
                            key={i}
                            className={cn(
                                "min-h-[100px] bg-background p-2 flex flex-col gap-1 transition-colors hover:bg-muted/30",
                                !isCurrentMonth && "text-muted-foreground bg-muted/20"
                            )}
                        >
                            <span className={cn(
                                "text-xs font-medium h-6 w-6 flex items-center justify-center rounded-full",
                                isToday(day) && "bg-primary text-primary-foreground"
                            )}>
                                {format(day, "d")}
                            </span>

                            <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[80px]">
                                {dayBookings.map((b: any) => (
                                    <button
                                        key={b.id}
                                        onClick={() => setSelectedBooking(b.id)}
                                        className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded truncate text-left hover:bg-primary/20 transition"
                                    >
                                        {format(new Date(b.start_time), "h:mma")} {b.client_name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
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
