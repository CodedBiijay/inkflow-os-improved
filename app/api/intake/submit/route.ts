
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
    try {
        let project_id, client_id, description, placement, size_estimate, color_preference, medical_notes;
        let files: File[] = [];

        const contentType = request.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
            const body = await request.json();
            project_id = body.project_id;
            client_id = body.client_id;
            description = body.description;
            placement = body.placement;
            size_estimate = body.size_estimate;
            color_preference = body.color_preference;
            medical_notes = body.medical_notes;
            // JSON doesn't support File uploads directly, so files remains empty
        } else {
            const formData = await request.formData();
            project_id = formData.get("project_id") as string;
            client_id = formData.get("client_id") as string;
            description = formData.get("description") as string;
            placement = formData.get("placement") as string;
            size_estimate = formData.get("size_estimate") as string;
            color_preference = formData.get("color_preference") as string;
            medical_notes = formData.get("medical_notes") as string;
            files = formData.getAll("reference_images") as File[];
        }

        if (!project_id || !client_id) {
            return NextResponse.json({ error: "Missing project or client ID" }, { status: 400 });
        }

        // 1. Upload Images
        const uploadedPaths: string[] = [];

        for (const file of files) {
            if (file.size === 0) continue;

            const fileExt = file.name.split(".").pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${project_id}/${fileName}`;

            const arrayBuffer = await file.arrayBuffer();
            const buffer = new Uint8Array(arrayBuffer);

            const { error: uploadError } = await supabase.storage
                .from("references")
                .upload(filePath, buffer, {
                    contentType: file.type,
                    upsert: false
                });

            if (uploadError) {
                console.error("Upload error:", uploadError);
                // Continue with other files...
            } else {
                uploadedPaths.push(filePath);
            }
        }

        // 2. Insert Intake Form
        const { data: intake, error: insertError } = await supabase
            .from("intake_forms")
            .insert({
                project_id,
                client_id,
                description,
                placement,
                size_estimate,
                color_preference,
                medical_notes,
                reference_images: uploadedPaths
            })
            .select()
            .single();

        if (insertError) {
            console.error("Insert error:", insertError);
            return NextResponse.json({ error: "Failed to save intake form", details: insertError }, { status: 500 });
        }

        // 3. Update Project (Link form + Status)
        // Fetch current status and artist_id for notification
        const { data: project } = await supabase
            .from("projects")
            .select("status, artist_id")
            .eq("id", project_id)
            .single();

        const updates: any = { intake_form_id: intake.id };
        if (project && project.status === "intake") {
            updates.status = "design";
        }

        const { error: updateError } = await supabase
            .from("projects")
            .update(updates)
            .eq("id", project_id);

        if (updateError) {
            console.error("Project update error:", updateError);
        } else if (project?.artist_id) {
            // Trigger Notification: Intake Submitted
            await supabase.from("notifications").insert({
                artist_id: project.artist_id,
                type: "intake_submitted",
                title: "New Intake Submitted",
                body: `New intake for project ${project_id.slice(0, 8)}...`,
                entity_type: "project",
                entity_id: project_id
            });
        }

        return NextResponse.json({ success: true, intake_id: intake.id });

    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
