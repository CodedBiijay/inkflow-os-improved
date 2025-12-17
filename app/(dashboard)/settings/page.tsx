import { supabase } from "@/lib/supabase";
import { SettingsProfile } from "@/components/Settings/SettingsProfile";
import { SettingsPayments } from "@/components/Settings/SettingsPayments";
import { SettingsAvailability } from "@/components/Settings/SettingsAvailability";

export const dynamic = "force-dynamic"; // Ensure fresh data fetch

export default async function SettingsPage() {
    // MVP: Fetch the single artist record. 
    // In a multi-tenant app, this would use auth.getUser() or cookies.
    const { data: artist, error } = await supabase
        .from("artists")
        .select("*")
        .single();

    // Fallback if no artist (e.g. not seeded yet)
    if (error || !artist) {
        return (
            <div className="p-8">
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-muted-foreground mt-2">Could not load artist profile. Error: {error?.message}</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 p-8 pb-16">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground text-lg">
                    Manage your profile, payments, and availability.
                </p>
            </div>

            <div className="grid gap-8">
                {/* Profile Section */}
                <SettingsProfile artist={artist} />

                {/* Payments Section */}
                <SettingsPayments artist={artist} />

                {/* Availability Section */}
                <SettingsAvailability />
            </div>
        </div>
    );
}
