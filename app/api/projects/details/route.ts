
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Missing project id" }, { status: 400 });
        }

        const { data: project, error } = await supabase
            .from("projects")
            .select(`
        *,
        client: clients (*),
        service: services (*)
      `)
            .eq("id", id)
            .single();

        if (error) throw error;
        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Fetch upcoming sessions if any
        // Assuming we have the new 'project_id' column on bookings (migration 004)
        // If not run, this might fail or return empty. We'll try to fetch safely.
        let upcomingSession = null;
        try {
            const { data: booking } = await supabase
                .from("bookings")
                .select("start_time, status")
                .eq("project_id", id)
                .gte("start_time", new Date().toISOString())
                .order("start_time", { ascending: true })
                .limit(1)
                .single();

            if (booking) upcomingSession = booking;
        } catch (e) {
            // Ignore if migration not run yet
            console.log("Failed to fetch linked bookings (migration pending?)");
        }

        // Fetch Intake Form & Sign URLs
        let intakeForm = null;
        if (project.intake_form_id) {
            const { data: intake } = await supabase
                .from("intake_forms")
                .select("*")
                .eq("id", project.intake_form_id)
                .single();

            if (intake) {
                // Sign images
                const signedImages = [];
                if (intake.reference_images && Array.isArray(intake.reference_images)) {
                    for (const path of intake.reference_images) {
                        const { data: signed } = await supabase.storage
                            .from("references")
                            .createSignedUrl(path, 3600); // 1 hour
                        if (signed) signedImages.push(signed.signedUrl);
                    }
                }
                intakeForm = { ...intake, signedImages };
            }
        }

        return NextResponse.json({ project: { ...project, upcomingSession, intakeForm } });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
