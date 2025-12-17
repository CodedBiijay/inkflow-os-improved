
"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, Check, CalendarIcon, Save } from "lucide-react";
import { formatDate, formatTimeRange, formatCurrency, formatStatus } from "@/lib/formatters";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface BookingDetailsModalProps {
    bookingId: string | null;
    open: boolean;
    onClose: () => void;
    onUpdate?: () => void; // Parent callback to refresh calendars
}

export function BookingDetailsModal({ bookingId, open, onClose, onUpdate }: BookingDetailsModalProps) {
    const [booking, setBooking] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    // Management states
    const [statusLoading, setStatusLoading] = useState(false);
    const [note, setNote] = useState("");
    const [noteLoading, setNoteLoading] = useState(false);
    const [isRescheduling, setIsRescheduling] = useState(false);

    // Reschedule states
    const [rescheduleDate, setRescheduleDate] = useState("");
    const [slots, setSlots] = useState<any[]>([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<any>(null);

    useEffect(() => {
        if (!open || !bookingId) {
            setBooking(null);
            setNote("");
            setIsRescheduling(false);
            setRescheduleDate("");
            setSlots([]);
            setSelectedSlot(null);
            return;
        }

        async function fetchDetails() {
            setLoading(true);
            try {
                const res = await fetch(`/api/bookings/details?id=${bookingId}`);
                if (res.ok) {
                    const data = await res.json();
                    setBooking(data.booking);
                    setNote(data.booking.notes || "");
                }
            } catch (error) {
                console.error("Failed to load booking details", error);
            } finally {
                setLoading(false);
            }
        }
        fetchDetails();
    }, [open, bookingId]);

    const handleCopyLink = () => {
        if (booking?.deposit_link) {
            navigator.clipboard.writeText(booking.deposit_link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const updateStatus = async (newStatus: string) => {
        setStatusLoading(true);
        try {
            const res = await fetch("/api/bookings/update-status", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ booking_id: booking.id, status: newStatus }),
            });
            if (res.ok) {
                setBooking((prev: any) => ({ ...prev, status: newStatus }));
                if (onUpdate) onUpdate();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setStatusLoading(false);
        }
    };

    const saveNote = async () => {
        setNoteLoading(true);
        try {
            const res = await fetch("/api/bookings/update-notes", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ booking_id: booking.id, notes: note }),
            });
            if (res.ok) {
                // Success feedback
            }
        } catch (e) {
            console.error(e);
        } finally {
            setNoteLoading(false);
        }
    };

    const resendDepositLink = async () => {
        // Assume logic or API call to resend email/link via existing endpoint or new one
        // For this step, instructions say: Only show if deposit_due. 
        // Logic: POST /api/deposits/create-payment-link (re-generate)
        // Check implementation details from user requirement: "Replace booking.deposit_url with returned URL."
        try {
            const res = await fetch("/api/deposits/create-payment-link", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bookingId: booking.id,
                    amount: booking.deposit_amount,
                    serviceName: booking.service.name,
                    clientEmail: booking.client.email
                })
            });
            if (res.ok) {
                const data = await res.json();
                setBooking((prev: any) => ({ ...prev, deposit_link: data.url }));
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Reschedule Logic
    useEffect(() => {
        if (!isRescheduling || !rescheduleDate || !booking) return;

        async function fetchSlots() {
            setSlotsLoading(true);
            try {
                // Ensure date string format
                const dateStr = typeof rescheduleDate === 'string' ? rescheduleDate : format(rescheduleDate, "yyyy-MM-dd");

                // artist_id is just mock/default for now as we don't have multiple artists yet
                // service_id needed for duration
                const res = await fetch(`/api/availability?date=${dateStr}&service_id=${booking.service.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setSlots(data.slots || []);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setSlotsLoading(false);
            }
        }
        fetchSlots();
    }, [isRescheduling, rescheduleDate, booking]);

    const confirmReschedule = async () => {
        if (!selectedSlot) return;
        try {
            const res = await fetch("/api/bookings/update-time", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    booking_id: booking.id,
                    start_time: selectedSlot.start,
                    end_time: selectedSlot.end
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setBooking((prev: any) => ({
                    ...prev,
                    start_time: data.booking.start_time,
                    end_time: data.booking.end_time
                }));
                setIsRescheduling(false);
                setSelectedSlot(null);
                setSlots([]);
                if (onUpdate) onUpdate();
            }
        } catch (e) {
            console.error(e);
        }
    };


    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Booking Details</DialogTitle>
                    <DialogDescription>
                        Manage appointment status and details.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex h-40 items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : !booking ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                        Booking details could not be loaded.
                    </div>
                ) : (
                    <div className="grid gap-6 py-2">
                        {/* 1. Header & Status */}
                        <div className="flex items-center justify-between gap-4">
                            <div className="space-y-1">
                                <h3 className="font-semibold text-lg">{booking.client?.name}</h3>
                                <div className="text-sm text-muted-foreground">{booking.client?.email}</div>
                                {booking.project_id && (
                                    <Button variant="link" className="h-auto p-0 text-xs text-primary" onClick={() => window.location.href = `/projects?open=${booking.project_id}`}>
                                        View Project Pipeline →
                                    </Button>
                                )}
                            </div>
                            <div className="w-[180px]">
                                <Select
                                    disabled={statusLoading}
                                    value={booking.status}
                                    onValueChange={updateStatus}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="deposit_due">Deposit Due</SelectItem>
                                        <SelectItem value="confirmed">Confirmed</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* 2. Info Grid */}
                        <div className="grid grid-cols-2 gap-4 text-sm border-y py-4">
                            <div className="space-y-1">
                                <span className="text-xs font-medium text-muted-foreground uppercase">Service</span>
                                <p className="font-medium">{booking.service?.name}</p>
                                <p className="text-muted-foreground">{booking.service?.duration_minutes} mins</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs font-medium text-muted-foreground uppercase">Date & Time</span>
                                <p className="font-medium">{formatDate(booking.start_time)}</p>
                                <p className="text-muted-foreground">{formatTimeRange(booking.start_time, booking.end_time)}</p>

                                {!isRescheduling && (
                                    <Button variant="link" size="sm" className="h-auto p-0 text-primary" onClick={() => setIsRescheduling(true)}>
                                        Reschedule
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* 3. Reschedule UI (Conditional) */}
                        {isRescheduling && (
                            <div className="bg-muted/30 p-4 rounded-md space-y-3 border">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-semibold flex items-center gap-2"><CalendarIcon className="h-4 w-4" /> Reschedule</h4>
                                    <Button variant="ghost" size="sm" onClick={() => setIsRescheduling(false)} className="h-6">Cancel</Button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-muted-foreground">New Date</label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal bg-zinc-950 border-zinc-800 text-zinc-100",
                                                        !rescheduleDate && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {rescheduleDate ? format(new Date(rescheduleDate), "PPP") : <span>Pick a date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 bg-zinc-950 border-zinc-800 text-zinc-100">
                                                <Calendar
                                                    mode="single"
                                                    selected={rescheduleDate ? new Date(rescheduleDate) : undefined}
                                                    onSelect={(date) => setRescheduleDate(date ? format(date, "yyyy-MM-dd") : "")}
                                                    initialFocus
                                                    className="bg-zinc-950 text-zinc-100"
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Available Slots</label>
                                        <Select
                                            disabled={!rescheduleDate || slotsLoading}
                                            value={selectedSlot ? JSON.stringify(selectedSlot) : ""}
                                            onValueChange={(v) => setSelectedSlot(JSON.parse(v))}
                                        >
                                            <SelectTrigger className="bg-zinc-950 border-zinc-800 text-zinc-100">
                                                <SelectValue placeholder={slotsLoading ? "Checking..." : "Select Time"} />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
                                                {slots.map((slot, i) => (
                                                    <SelectItem key={i} value={JSON.stringify(slot)} className="focus:bg-zinc-900 focus:text-zinc-50">
                                                        {formatTimeRange(slot.start, slot.end)}
                                                    </SelectItem>
                                                ))}
                                                {slots.length === 0 && !slotsLoading && <div className="p-2 text-xs text-muted-foreground">No slots available</div>}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <Button
                                    className="w-full"
                                    size="sm"
                                    disabled={!selectedSlot}
                                    onClick={confirmReschedule}
                                >
                                    Save & Update Time
                                </Button>
                            </div>
                        )}

                        {/* 4. Deposit Section */}
                        <div className="rounded-lg border p-4 bg-muted/40 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Deposit ({formatCurrency(booking.deposit_amount)})</span>
                                {booking.status === 'deposit_due' && (
                                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={resendDepositLink}>
                                        Regenerate Link
                                    </Button>
                                )}
                            </div>

                            {booking.status === "deposit_due" && booking.deposit_link && (
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <Input
                                            readOnly
                                            value={booking.deposit_link}
                                            className="h-8 text-xs bg-zinc-950 border-zinc-800 text-zinc-100"
                                        />
                                        <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={handleCopyLink}>
                                            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {booking.status === "confirmed" && (
                                <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 p-2 rounded border border-emerald-100">
                                    <Check className="h-3 w-3" />
                                    <span>Deposit confirmed</span>
                                </div>
                            )}
                        </div>

                        {/* 5. Notes Section */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Internal Notes</label>
                                {note !== (booking.notes || "") && (
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={saveNote} disabled={noteLoading}>
                                        <Save className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>
                            <Textarea
                                placeholder="Add private notes here..."
                                className="min-h-[100px] text-sm resize-none bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                onBlur={saveNote} // Auto-save on blur
                            />
                        </div>

                        {/* Metadata */}
                        <div className="text-[10px] text-muted-foreground space-y-1 pt-2 border-t">
                            <p>Ref: {booking.id.slice(0, 8)}...</p>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
