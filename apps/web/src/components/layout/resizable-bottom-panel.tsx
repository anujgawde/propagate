"use client";

import { useState, useCallback, useEffect, useRef, type ReactNode } from "react";

const MIN_HEIGHT = 40;
const MAX_VH = 0.6;
const COLLAPSED_HEIGHT = 40;

export function ResizableBottomPanel({ children }: { children: ReactNode }) {
  const [height, setHeight] = useState(COLLAPSED_HEIGHT);
  const dragRef = useRef<{ startY: number; startHeight: number } | null>(null);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragRef.current = { startY: e.clientY, startHeight: height };
      document.body.classList.add("select-none");
    },
    [height],
  );

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragRef.current) return;
      const delta = dragRef.current.startY - e.clientY;
      const maxHeight = window.innerHeight * MAX_VH;
      setHeight(Math.min(maxHeight, Math.max(MIN_HEIGHT, dragRef.current.startHeight + delta)));
    }

    function onMouseUp() {
      if (!dragRef.current) return;
      dragRef.current = null;
      document.body.classList.remove("select-none");
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const isCollapsed = height <= COLLAPSED_HEIGHT;

  return (
    <div className="flex shrink-0 flex-col border-t border-edge" style={{ height }}>
      <div
        onMouseDown={onMouseDown}
        className="flex h-2.5 cursor-row-resize items-center justify-center bg-surface-alt hover:bg-surface-inset"
      >
        <div className="h-0.5 w-8 rounded-full bg-ink-faint" />
      </div>
      <div className={`flex-1 overflow-y-auto ${isCollapsed ? "overflow-hidden" : ""}`}>
        {children}
      </div>
    </div>
  );
}
