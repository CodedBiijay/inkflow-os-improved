"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";

interface Artist {
    id: string;
    default_deposit_amount?: number;
    stripe_account_id?: string;
}

export function SettingsPayments({ artist }: { artist: Artist }) {
    const [loading, setLoading] = useState(false);
    const [deposit, setDeposit] = useState(artist.default_deposit_amount?.toString() || "100");

    const isConnected = !!artist.stripe_account_id;

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/settings/payments", {
                method: "PATCH",
                body: JSON.stringify({
                    artist_id: artist.id,
                    default_deposit_amount: parseFloat(deposit)
                }),
                headers: { "Content-Type": "application/json" }
            });
            if (!res.ok) throw new Error("Failed to save");
            // In a real app we'd show a toast here
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Payments</CardTitle>
                <CardDescription>Manage Stripe connection and deposit settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="rounded-lg border p-4 flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            {isConnected ? (
                                <>
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    <span className="font-medium">Stripe Connected</span>
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium text-muted-foreground">Not Connected</span>
                                </>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {isConnected
                                ? "Payouts enabled to registered account"
                                : "Connect Stripe to accept payments"}
                        </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                        <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer">
                            {isConnected ? "Manage" : "Connect"} <ExternalLink className="ml-2 h-3 w-3" />
                        </a>
                    </Button>
                </div>

                <div className="space-y-2">
                    <Label>Default Deposit Amount ($)</Label>
                    <Input
                        type="number"
                        value={deposit}
                        onChange={e => setDeposit(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">This amount will be pre-filled for new bookings.</p>
                </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/40 py-3">
                <Button onClick={handleSave} disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Settings
                </Button>
            </CardFooter>
        </Card>
    );
}
