"use client";
import { useState } from "react";

export function TableGridSelector({ onSelect }: { onSelect: (r: number, c: number) => void }) {
  const MAX = 10;
  const [hovered, setHovered] = useState({ r: 1, c: 1 });

  return (
    <div className="flex flex-col items-start">
      {/* GRID */}
      <div
        className="grid gap-0.5"
        style={{
          gridTemplateColumns: `repeat(${MAX}, 20px)`,
        }}
      >
        {Array.from({ length: MAX }).map((_, r) =>
          Array.from({ length: MAX }).map((_, c) => {
            const row = r + 1;
            const col = c + 1;
            const active = row <= hovered.r && col <= hovered.c;

            return (
              <div
                key={`${r}-${c}`}
                onMouseEnter={() => setHovered({ r: row, c: col })}
                onClick={() => onSelect(hovered.r, hovered.c)}
                className={`h-5 w-5 border transition 
                  ${active ? "bg-blue-500/60 border-blue-500" : "bg-white border-gray-300"}`}
              />
            );
          })
        )}
      </div>

      {/* CURRENT SELECTION */}
      <div className="mt-2 text-sm text-gray-600">
        {hovered.r} × {hovered.c}
      </div>
    </div>
  );
}
