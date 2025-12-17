
"use client";

import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface BookingListItemProps {
    booking: {
        id: string;
        start_time: string;
        end_time: string;
        client_name: string;
        service_name: string;
        status: string;
    };
}

export function BookingListItem({ booking }: BookingListItemProps) {
    const getStatusVariant = (status: string) => {
        switch (status) {
            case "confirmed":
                return "default"; // Primary color (e.g. black/dark)
            case "completed":
                return "secondary"; // Muted
            case "deposit_due":
                return "destructive"; // Red/Warning
            default:
                return "outline";
        }
    };

    const getStatusLabel = (status: string) => {
        return status.replace("_", " ");
    };

    return (
        <Card className="flex items-center justify-between p-4 mb-3 transition-colors hover:bg-muted/40">
            <div className="flex flex-col gap-1">
                <p className="text-sm font-medium leading-none">{booking.client_name}</p>
                <p className="text-xs text-muted-foreground">{booking.service_name}</p>
            </div>

            <div className="flex items-center gap-4">
                <div className="text-right">
                    <p className="text-sm font-medium">
                        {format(new Date(booking.start_time), "h:mm a")} – {format(new Date(booking.end_time), "h:mm a")}
                    </p>
                </div>
                <Badge variant={getStatusVariant(booking.status) as any} className="capitalize">
                    {getStatusLabel(booking.status)}
                </Badge>
            </div>
        </Card>
    );
}
