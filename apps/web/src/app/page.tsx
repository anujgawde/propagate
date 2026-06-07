"use client";

import { FloorPlanViewer } from "@/components/floor-plan/floor-plan-viewer";
import { ScheduleTable } from "@/components/schedule-table/schedule-table";
import { ImpactBar } from "@/components/impact-bar/impact-bar";
import { UploadZone } from "@/components/upload/upload-zone";
import { useSocket } from "@/hooks/use-socket";

export default function Home() {
  useSocket();

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-3">
        <h1 className="text-lg font-semibold tracking-tight">Propagate</h1>
        <UploadZone />
      </header>

      <main className="flex flex-1 overflow-hidden">
        <div className="flex-1 border-r border-zinc-800 p-4">
          <FloorPlanViewer />
        </div>
        <div className="flex-1 p-4">
          <ScheduleTable />
        </div>
      </main>

      <ImpactBar />
    </div>
  );
}
