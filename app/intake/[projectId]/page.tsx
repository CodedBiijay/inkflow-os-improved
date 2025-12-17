import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import IntakeForm from "@/components/intake/IntakeForm";

// Helper to fetch project details (server-side)
async function getProjectCient(projectId: string) {
    const { data, error } = await supabase
        .from("projects")
        .select("id, client_id, title, clients(name)")
        .eq("id", projectId)
        .single();

    if (error || !data) return null;
    return data;
}

export default async function IntakePage({ params }: { params: { projectId: string } }) {
    const project = await getProjectCient(params.projectId);

    if (!project) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-gray-50/50 py-10 px-4">
            <div className="mx-auto max-w-lg space-y-6">

                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                        InkFlow Intake
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Preparing for your project: <span className="font-medium text-foreground">{project.title}</span>
                    </p>
                </div>

                <div className="text-xs text-center text-muted-foreground uppercase tracking-wider">
                    Client: {Array.isArray(project.clients) ? project.clients[0]?.name : (project.clients as any)?.name || "Guest"}
                </div>

                {/* Form */}
                <IntakeForm projectId={project.id} clientId={project.client_id} />

            </div>
        </div>
    );
}
