
"use client";

import { Check, Copy } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";

interface DepositListItemProps {
    booking: {
        id: string;
        start_time: string;
        client_name: string;
        service_name: string;
        deposit_amount: number;
        deposit_url?: string | null;
    };
}

export function DepositListItem({ booking }: DepositListItemProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (booking.deposit_url) {
            navigator.clipboard.writeText(booking.deposit_url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } else {
            // If we don't have the URL, we might want to regenerate or just alert (for now alert)
            alert("Deposit link not available from database yet. (Logic placeholder)");
        }
    };

    return (
        <Card className="flex items-center justify-between p-4 mb-3 border-l-4 border-l-yellow-500">
            <div>
                <p className="text-sm font-medium leading-none">{booking.client_name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(booking.start_time), "MMM d, h:mm a")}
                </p>
            </div>

            <div className="flex items-center gap-4">
                <div className="text-right">
                    <p className="text-sm font-bold text-emerald-600">
                        ${booking.deposit_amount}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase">Pending</p>
                </div>
                <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={handleCopy}
                    disabled={!booking.deposit_url} // Disabled if we mock null
                >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copied" : "Copy Link"}
                </Button>
            </div>
        </Card>
    );
}
