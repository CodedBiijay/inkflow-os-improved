import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { project_id, next_status } = body;

        if (!project_id || !next_status) {
            return new Response(
                JSON.stringify({ error: "Missing project_id or next_status" }),
                { status: 400 }
            );
        }

        // Validate allowed statuses
        const validStatuses = [
            "intake",
            "design",
            "awaiting_approval",
            "approved",
            "session_scheduled",
            "completed",
            "no_show",
            "rescheduled",
            "waitlist"

        ];

        if (!validStatuses.includes(next_status)) {
            return new Response(
                JSON.stringify({ error: "Invalid next_status value" }),
                { status: 400 }
            );
        }

        // Update project status
        const { data, error } = await supabase
            .from("projects")
            .update({ status: next_status })
            .eq("id", project_id)
            .select()
            .single();

        if (error) {
            return new Response(
                JSON.stringify({ error: error.message }),
                { status: 500 }
            );
        }

        return new Response(JSON.stringify({ project: data }), {
            status: 200
        });

    } catch (err: any) {
        return new Response(
            JSON.stringify({ error: err.message }),
            { status: 500 }
        );
    }
}
