
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
    try {
        const { data: projects, error } = await supabase
            .from("projects")
            .select(`
        id,
        title,
        status,
        updated_at,
        client: clients (id, name),
        service: services (name)
      `)
            .order("updated_at", { ascending: false });

        if (error) throw error;

        // Group by status
        // Define statuses ordering to match Kanban columns
        const statuses = [
            "intake",
            "design",
            "awaiting_approval",
            "approved",
            "session_scheduled",
            "completed"
        ];

        const grouped: Record<string, any[]> = {};
        statuses.forEach(s => grouped[s] = []);

        // Also catch any others (like 'archived' if added later)
        projects?.forEach(p => {
            const s = p.status || "intake";
            if (!grouped[s]) grouped[s] = [];
            grouped[s].push(p);
        });

        return NextResponse.json({ projects: grouped });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
