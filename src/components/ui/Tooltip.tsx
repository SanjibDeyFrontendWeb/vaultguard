"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export type TooltipPosition = "top" | "bottom" | "left" | "right";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: TooltipPosition;
  delay?: number;
  className?: string;
  wrapperClassName?: string;
  disabled?: boolean;
}

export function Tooltip({
  content,
  children,
  position = "top",
  delay = 80,
  className = "",
  wrapperClassName = "",
  disabled = false,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const gap = 8;

    let top = 0;
    let left = 0;

    if (position === "top") {
      top = rect.top - gap;
      left = rect.left + rect.width / 2;
    } else if (position === "bottom") {
      top = rect.bottom + gap;
      left = rect.left + rect.width / 2;
    } else if (position === "left") {
      top = rect.top + rect.height / 2;
      left = rect.left - gap;
    } else if (position === "right") {
      top = rect.top + rect.height / 2;
      left = rect.right + gap;
    }

    setCoords({ top, left });
  };

  const showTooltip = () => {
    if (disabled || !content) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    updatePosition();
    if (delay > 0) {
      timeoutRef.current = setTimeout(() => {
        updatePosition();
        setIsVisible(true);
      }, delay);
    } else {
      setIsVisible(true);
    }
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  // Close on window scroll or resize so it stays locked with target
  useEffect(() => {
    if (!isVisible) return;
    const handleScrollOrResize = () => {
      hideTooltip();
    };
    window.addEventListener("scroll", handleScrollOrResize, { passive: true, capture: true });
    window.addEventListener("resize", handleScrollOrResize, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, { capture: true });
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isVisible]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (disabled || !content) {
    return <>{children}</>;
  }

  // Positioning classes for transform relative to anchor point
  const transformClasses: Record<TooltipPosition, string> = {
    top: "-translate-x-1/2 -translate-y-full",
    bottom: "-translate-x-1/2 translate-y-0",
    left: "-translate-x-full -translate-y-1/2",
    right: "translate-x-0 -translate-y-1/2",
  };

  // Arrow positioning styles
  const arrowClasses: Record<TooltipPosition, string> = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-slate-900 dark:border-t-slate-100 border-x-transparent border-b-transparent border-t-4 border-x-4",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-slate-900 dark:border-b-slate-100 border-x-transparent border-t-transparent border-b-4 border-x-4",
    left: "left-full top-1/2 -translate-y-1/2 border-l-slate-900 dark:border-l-slate-100 border-y-transparent border-r-transparent border-l-4 border-y-4",
    right: "right-full top-1/2 -translate-y-1/2 border-r-slate-900 dark:border-r-slate-100 border-y-transparent border-l-transparent border-r-4 border-y-4",
  };

  return (
    <div
      ref={triggerRef}
      className={`relative inline-flex items-center ${wrapperClassName}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {mounted &&
        isVisible &&
        createPortal(
          <div
            role="tooltip"
            style={{
              position: "fixed",
              top: `${coords.top}px`,
              left: `${coords.left}px`,
            }}
            className={`z-[9999] pointer-events-none whitespace-nowrap transition-all duration-150 animate-in fade-in zoom-in-95 ${transformClasses[position]}`}
          >
            <div
              className={`px-2.5 py-1 text-[11px] font-medium tracking-tight rounded-lg shadow-xl border border-slate-700/50 dark:border-slate-200/50 bg-slate-900 dark:bg-slate-100 text-slate-100 dark:text-slate-900 backdrop-blur-md select-none ${className}`}
            >
              {content}
            </div>
            {/* Subtle pointer arrow */}
            <div className={`absolute w-0 h-0 pointer-events-none ${arrowClasses[position]}`} />
          </div>,
          document.body
        )}
    </div>
  );
}
