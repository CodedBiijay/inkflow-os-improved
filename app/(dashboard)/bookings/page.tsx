import BookingFlow from "@/components/booking/BookingFlow";

export default function BookingsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Bookings</h2>
                    <p className="text-muted-foreground">Manage appointments and walk-ins.</p>
                </div>
            </div>

            <div className="mt-8">
                <BookingFlow />
            </div>
        </div>
    );
}
