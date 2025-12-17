
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

interface ProjectCardProps {
    project: any;
    onClick: (id: string) => void;
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: project.id,
    });

    const style = {
        transform: CSS.Translate.toString(transform),
    };

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="touch-none">
            <Card
                className="cursor-pointer hover:border-primary/50 transition-colors shadow-sm mb-2"
                onClick={() => onClick(project.id)}
            >
                <CardContent className="p-3 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                        <h4 className="font-semibold text-sm line-clamp-2 leading-tight">
                            {project.title || "Untitled Project"}
                        </h4>
                    </div>

                    <div className="text-xs text-muted-foreground">
                        <p className="font-medium text-foreground">{project.client?.name}</p>
                        <p>{project.service?.name}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t text-[10px] text-muted-foreground">
                        <span>{formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
