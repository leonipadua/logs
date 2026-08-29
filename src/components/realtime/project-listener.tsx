"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

interface ProjectListenerProps {
  projectId: string;
  phaseIds: string[];
}

/**
 * Canal escopado ao projeto (ARCHITECTURE §6) — nunca um canal global.
 * `tasks` não tem project_id; filtra por phase_id (poucas fases por projeto).
 */
export function ProjectRealtimeListener({ projectId, phaseIds }: ProjectListenerProps) {
  const router = useRouter();

  useEffect(() => {
    if (phaseIds.length === 0) return;
    const supabase = createClient();
    const canal = supabase
      .channel(`projeto:${projectId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "phases", filter: `project_id=eq.${projectId}` },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `phase_id=in.(${phaseIds.join(",")})` },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [projectId, phaseIds, router]);

  return null;
}
