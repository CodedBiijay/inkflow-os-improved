import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { project_id, approval_status } = body;

        if (!project_id || !approval_status) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const updates: any = { approval_status };

        // Auto-update project status based on approval
        if (approval_status === 'approved') {
            updates.status = 'approved';
        } else if (approval_status === 'changes_requested') {
            updates.status = 'design'; // Go back to design phase
        }

        const { data: project, error } = await supabase
            .from("projects")
            .update(updates)
            .eq("id", project_id)
            .select()
            .single();

        if (error) throw error;

        // Send system message?
        await supabase.from("project_messages").insert({
            project_id,
            sender_type: 'client', // System message masked as client action
            message: approval_status === 'approved'
                ? "✅ Design Approved! I'm ready to proceed."
                : "⚠️ I have requested changes to the design.",
            attachments: []
        });

        // Trigger Notification
        if (project.artist_id) {
            let notifType = "";
            let notifTitle = "";

            if (approval_status === 'approved') {
                notifType = "design_approved";
                notifTitle = "Client Approved Design";
            } else if (approval_status === 'changes_requested') {
                notifType = "design_changes";
                notifTitle = "Design Changes Requested";
            }

            if (notifType) {
                await supabase.from("notifications").insert({
                    artist_id: project.artist_id,
                    type: notifType,
                    title: notifTitle,
                    body: `Client updated approval status for project ${project_id.slice(0, 8)}.`,
                    entity_type: "project",
                    entity_id: project_id
                });
            }
        }

        return NextResponse.json({ project });
    } catch (error) {
        console.error("Error updating approval:", error);
        return NextResponse.json({ error: "Failed to update approval" }, { status: 500 });
    }
}
