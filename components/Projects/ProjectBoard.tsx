
"use client";

import { useEffect, useState } from "react";
import { ProjectColumn } from "./ProjectColumn";
import { ProjectDetailsModal } from "./ProjectDetailsModal";
import { Loader2 } from "lucide-react";
import { DndContext, DragEndEvent, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { ProjectCard } from "./ProjectCard";

export function ProjectBoard() {
  const [projects, setProjects] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);

  const COLUMNS = [
    { title: "Intake", stage: "intake" },
    { title: "Design", stage: "design" },
    { title: "Awaiting Approval", stage: "awaiting_approval" },
    { title: "Approved", stage: "approved" },
    { title: "Session Scheduled", stage: "session_scheduled" },
    { title: "Completed", stage: "completed" },
  ];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    async function fetchProjects() {
      setLoading(true);
      try {
        const res = await fetch("/api/projects/list");
        if (res.ok) {
          const data = await res.json();
          setProjects(data.projects);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, [refreshKey]);

  const handleUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (!over) return;

    const projectId = active.id as string;
    const newStage = over.id as string;

    // Find source stage
    let sourceStage = "";
    let projectData: any = null;

    for (const stage of Object.keys(projects)) {
      const found = projects[stage].find(p => p.id === projectId);
      if (found) {
        sourceStage = stage;
        projectData = found;
        break;
      }
    }

    if (!sourceStage || sourceStage === newStage) return;

    // Optimistic Update
    const newProjects = { ...projects };
    // Remove from source
    newProjects[sourceStage] = newProjects[sourceStage].filter(p => p.id !== projectId);
    // Add to target (with new status just in case UI relies on it)
    const updatedProject = { ...projectData, status: newStage, updated_at: new Date().toISOString() };

    // Initialize target array if empty 
    if (!newProjects[newStage]) newProjects[newStage] = [];

    // Add to top of list for now (or bottom)
    newProjects[newStage] = [updatedProject, ...newProjects[newStage]];

    setProjects(newProjects);

    // API Call
    try {
      await fetch("/api/projects/update-stage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, status: newStage }),
      });
    } catch (e) {
      console.error("Failed to update stage", e);
      // Revert on error? For V1 we'll just log.
      handleUpdate(); // Refresh from server to fix state
    }
  };

  const activeProject = activeId ? Object.values(projects).flat().find(p => p.id === activeId) : null;

  if (loading && Object.keys(projects).length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(col => (
          <ProjectColumn
            key={col.stage}
            title={col.title}
            stage={col.stage}
            projects={projects[col.stage] || []}
            onCardClick={setSelectedProjectId}
          />
        ))}
      </div>

      <DragOverlay>
        {activeProject ? (
          <ProjectCard project={activeProject} onClick={() => { }} />
        ) : null}
      </DragOverlay>

      <ProjectDetailsModal
        projectId={selectedProjectId}
        open={!!selectedProjectId}
        onClose={() => setSelectedProjectId(null)}
        onUpdate={handleUpdate}
      />
    </DndContext>
  );
}
