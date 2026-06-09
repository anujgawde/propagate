"use client";

import { FloorPlanViewer } from "@/components/floor-plan/floor-plan-viewer";
import { ScheduleTable } from "@/components/schedule-table/schedule-table";
import { ImpactBar } from "@/components/impact-bar/impact-bar";
import { UploadZone } from "@/components/upload/upload-zone";
import { PropagationPrompt } from "@/components/propagation-prompt/propagation-prompt";
import { AgentStatusBadge } from "@/components/agent/agent-status-badge";
import { AgentPanel } from "@/components/agent/agent-panel";
import { ResizableBottomPanel } from "@/components/layout/resizable-bottom-panel";
import { ResizableSplit } from "@/components/layout/resizable-split";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useSocket } from "@/hooks/use-socket";
import { useDocumentStore } from "@/store/documents";

export default function Home() {
  useSocket();
  const focusMismatch = useDocumentStore((s) => s.focusMismatch);

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-edge px-6 py-3">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold tracking-tight">Propagate</h1>
          <AgentStatusBadge />
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <UploadZone />
        </div>
      </header>

      <main onClick={() => focusMismatch(null)} className="flex flex-1 overflow-hidden">
        <ResizableSplit
          left={<FloorPlanViewer />}
          right={<ScheduleTable />}
        />
      </main>

      <PropagationPrompt />
      <ResizableBottomPanel>
        <AgentPanel />
        <ImpactBar />
      </ResizableBottomPanel>
    </div>
  );
}
