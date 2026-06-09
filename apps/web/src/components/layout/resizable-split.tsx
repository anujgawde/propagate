"use client";

import { useState, useCallback, useEffect, useRef, type ReactNode } from "react";

export function ResizableSplit({
  left,
  right,
}: {
  left: ReactNode;
  right: ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftPercent, setLeftPercent] = useState(50);
  const dragRef = useRef<{ startX: number; startPercent: number } | null>(null);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragRef.current = { startX: e.clientX, startPercent: leftPercent };
      document.body.classList.add("select-none");
    },
    [leftPercent],
  );

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragRef.current || !containerRef.current) return;
      const containerWidth = containerRef.current.getBoundingClientRect().width;
      const deltaX = e.clientX - dragRef.current.startX;
      const deltaPct = (deltaX / containerWidth) * 100;
      const newPct = Math.min(80, Math.max(20, dragRef.current.startPercent + deltaPct));
      setLeftPercent(newPct);
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

  return (
    <div ref={containerRef} className="flex flex-1 overflow-hidden">
      <div className="overflow-hidden p-4" style={{ width: `${leftPercent}%` }}>
        {left}
      </div>
      <div
        onMouseDown={onMouseDown}
        className="flex w-1.5 shrink-0 cursor-col-resize items-center justify-center bg-surface-alt hover:bg-surface-inset"
      >
        <div className="h-8 w-0.5 rounded-full bg-ink-faint" />
      </div>
      <div className="flex-1 overflow-hidden p-4">
        {right}
      </div>
    </div>
  );
}
