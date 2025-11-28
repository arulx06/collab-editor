'use client'

import React, { useEffect, useRef, useState } from "react"
import { FaCaretDown } from "react-icons/fa"

const MIN_GAP = 100
const TOTAL_MARKERS = 83

export interface RulerProps {
  leftMargin: number
  rightMargin: number
  onMarginChange: (left: number, right: number) => void
}

// ------------------------
// Ruler Component
// ------------------------
export const Ruler: React.FC<RulerProps> = ({ leftMargin, rightMargin, onMarginChange }) => {
  const [localLeft, setLocalLeft] = useState(leftMargin)
  const [localRight, setLocalRight] = useState(rightMargin)
  const [isDraggingLeft, setIsDraggingLeft] = useState(false)
  const [isDraggingRight, setIsDraggingRight] = useState(false)
  const [rulerWidth, setRulerWidth] = useState(816)
  const rulerRef = useRef<HTMLDivElement | null>(null)

  // Sync local state with props
  useEffect(() => setLocalLeft(leftMargin), [leftMargin])
  useEffect(() => setLocalRight(rightMargin), [rightMargin])

  // ------------------------
  // Margin Handlers
  // ------------------------
  const handleLeftChange = (newLeft: number) => {
    const maxLeft = rulerWidth - localRight - MIN_GAP
    const clampedLeft = Math.max(0, Math.min(newLeft, maxLeft))
    setLocalLeft(clampedLeft)
    onMarginChange(clampedLeft, localRight)
  }

  const handleRightChange = (newRight: number) => {
    const maxRight = rulerWidth - localLeft - MIN_GAP
    const clampedRight = Math.max(0, Math.min(newRight, maxRight))
    setLocalRight(clampedRight)
    onMarginChange(localLeft, clampedRight)
  }

  // ------------------------
  // Resize observer
  // ------------------------
  useEffect(() => {
    const updateWidth = () => {
      if (!rulerRef.current) return
      setRulerWidth(rulerRef.current.offsetWidth)
    }

    updateWidth()
    const ro = new ResizeObserver(updateWidth)
    if (rulerRef.current) ro.observe(rulerRef.current)

    window.addEventListener("resize", updateWidth)
    window.addEventListener("orientationchange", updateWidth)

    return () => {
      if (rulerRef.current) ro.unobserve(rulerRef.current)
      ro.disconnect()
      window.removeEventListener("resize", updateWidth)
      window.removeEventListener("orientationchange", updateWidth)
    }
  }, [])

  // ------------------------
  // Drag handlers
  // ------------------------
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!rulerRef.current) return
      const rect = rulerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left

      if (isDraggingLeft) handleLeftChange(x)
      if (isDraggingRight) handleRightChange(rulerWidth - x)
    }

    const handleUp = () => {
      setIsDraggingLeft(false)
      setIsDraggingRight(false)
    }

    if (isDraggingLeft || isDraggingRight) {
      window.addEventListener("mousemove", handleMove)
      window.addEventListener("mouseup", handleUp)
      window.addEventListener("mouseleave", handleUp)
    }

    return () => {
      window.removeEventListener("mousemove", handleMove)
      window.removeEventListener("mouseup", handleUp)
      window.removeEventListener("mouseleave", handleUp)
    }
  }, [isDraggingLeft, isDraggingRight, localLeft, localRight, rulerWidth])

  const resetLeft = () => handleLeftChange(0)
  const resetRight = () => handleRightChange(0)

  // ------------------------
  // Render
  // ------------------------
  return (
    <div className="h-6 border-b border-gray-300 flex items-end relative select-none print:hidden">
      <div ref={rulerRef} className="max-w-[816px] mx-auto w-full h-full relative">
        <Marker
          position={localLeft}
          side="left"
          isDragging={isDraggingLeft}
          onMouseDown={() => setIsDraggingLeft(true)}
          onDoubleClick={resetLeft}
        />
        <Marker
          position={localRight}
          side="right"
          isDragging={isDraggingRight}
          onMouseDown={() => setIsDraggingRight(true)}
          onDoubleClick={resetRight}
        />

        {/* Tick marks */}
        <div className="absolute inset-x-0 bottom-0 h-full">
          <div className="relative h-full w-full">
            {Array.from({ length: TOTAL_MARKERS }, (_, m) => {
              const x = (m * rulerWidth) / (TOTAL_MARKERS - 1)
              return (
                <div key={m} className="absolute bottom-0" style={{ left: `${x}px` }}>
                  {m % 10 === 0 && <>
                    <div className="absolute bottom-0 w-[1px] h-2 bg-neutral-500" />
                    <span className="absolute bottom-2 text-[10px] text-neutral-500 transform -translate-x-1/2">{m / 10 + 1}</span>
                  </>}
                  {m % 5 === 0 && m % 10 !== 0 && <div className="absolute bottom-0 w-[1px] h-1.5 bg-neutral-500" />}
                  {m % 5 !== 0 && <div className="absolute bottom-0 w-[1px] h-1 bg-neutral-500" />}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ------------------------
// Marker Component
// ------------------------
interface MarkerProps {
  position: number
  side: "left" | "right"
  onMouseDown: () => void
  onDoubleClick: () => void
  isDragging: boolean
}

const Marker = ({ position, side, onMouseDown, onDoubleClick, isDragging }: MarkerProps) => (
  <div
    className="absolute top-0 w-4 h-full cursor-ew-resize z-[5] -ml-2"
    style={{ [side]: `${position}px` } as React.CSSProperties}
    onMouseDown={onMouseDown}
    onDoubleClick={onDoubleClick}
  >
    <FaCaretDown className="absolute left-1/2 top-0 h-full fill-blue-500 transform -translate-x-1/2" />
    <div
      className="absolute left-1/2 top-4 transform -translate-x-1/2 transition-opacity duration-150"
      style={{ height: "100vh", width: "1px", backgroundColor: "#061c50", display: isDragging ? "block" : "none" }}
    />
  </div>
)
