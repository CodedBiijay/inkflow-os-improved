
"use client";

import { ProjectCard } from "./ProjectCard";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface ProjectColumnProps {
    title: string;
    stage: string;
    projects: any[];
    onCardClick: (id: string) => void;
}

export function ProjectColumn({ title, stage, projects, onCardClick }: ProjectColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: stage,
    });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "flex flex-col h-full min-w-[280px] w-[300px] bg-muted/30 rounded-lg border border-border/50 transition-colors",
                isOver && "bg-muted/50 border-primary/20"
            )}
        >
            {/* Header */}
            <div className="p-3 border-b border-border/50 flex items-center justify-between bg-muted/20 rounded-t-lg">
                <h3 className="font-semibold text-sm">{title}</h3>
                <Badge variant="secondary" className="text-xs h-5 px-1.5">
                    {projects.length}
                </Badge>
            </div>

            {/* Cards Area */}
            <ScrollArea className="flex-1 p-2">
                <div className="space-y-2">
                    {projects.map(project => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            onClick={onCardClick}
                        />
                    ))}
                    {projects.length === 0 && (
                        <div className="h-20 flex items-center justify-center text-xs text-muted-foreground border-2 border-dashed rounded-md">
                            Empty
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
