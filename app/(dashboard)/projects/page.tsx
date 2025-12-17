
import { ProjectBoard } from "@/components/Projects/ProjectBoard";

export default function ProjectsPage() {
    return (
        <div className="h-full flex flex-col space-y-4 p-6 overflow-hidden">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
                <p className="text-muted-foreground">
                    Track tattoo projects through their workflow.
                </p>
            </div>

            <div className="flex-1 min-h-0">
                <ProjectBoard />
            </div>
        </div>
    );
}
