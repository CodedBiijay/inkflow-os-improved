"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface Artist {
    id: string;
    name: string;
    email: string;
    studio_name?: string;
    timezone?: string;
}

export function SettingsProfile({ artist }: { artist: Artist }) {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState(artist.name || "");
    const [studioName, setStudioName] = useState(artist.studio_name || "");
    const [timezone, setTimezone] = useState(artist.timezone || "UTC");

    // MVP Timezones
    const timezones = ["UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "Europe/London"];

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/settings/profile", {
                method: "PATCH",
                body: JSON.stringify({
                    artist_id: artist.id,
                    name,
                    studio_name: studioName,
                    timezone
                }),
                headers: { "Content-Type": "application/json" }
            });
            if (!res.ok) throw new Error("Failed to save");
            // Success feedback? For MVP just button state or simple alert
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Manage your public profile information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Artist Name</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={artist.email} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                    <Label>Studio Name</Label>
                    <Input value={studioName} onChange={e => setStudioName(e.target.value)} placeholder="e.g. Black Ink Studios" />
                </div>
                <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select value={timezone} onValueChange={setTimezone}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {timezones.map(tz => (
                                <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/40 py-3">
                <Button onClick={handleSave} disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </CardFooter>
        </Card>
    );
}
