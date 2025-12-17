import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CalendarClock } from "lucide-react";
import Link from "next/link";

export function SettingsAvailability() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Availability</CardTitle>
                <CardDescription>Control when clients can book sessions with you.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                        <CalendarClock className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">Weekly Schedule</p>
                        <p className="text-xs text-muted-foreground">Configure your working days, hours, and time off.</p>
                    </div>
                    <Button asChild>
                        <Link href="/calendar">Manage Availability</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
