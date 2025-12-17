import { format } from "date-fns";

export function formatDate(date: string | Date): string {
    if (!date) return "";
    return format(new Date(date), "EEEE, MMMM do, yyyy");
}

export function formatTimeRange(start: string | Date, end: string | Date): string {
    if (!start || !end) return "";
    return `${format(new Date(start), "h:mm a")} – ${format(new Date(end), "h:mm a")}`;
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(amount);
}

export function formatStatus(status: string): string {
    switch (status) {
        case "pending":
            return "Pending";
        case "deposit_due":
            return "Deposit Due";
        case "confirmed":
            return "Confirmed";
        case "completed":
            return "Completed";
        case "cancelled":
            return "Cancelled";
        default:
            return status.replace("_", " ");
    }
}
