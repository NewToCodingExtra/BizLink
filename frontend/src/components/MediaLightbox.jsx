import React, { useState, useEffect, useRef, useCallback } from "react";

/**
 * Fullscreen Interactive Media Lightbox for Images and Videos.
 * Supports:
 * - Zoom in / Zoom out / 100% Reset
 * - Drag-to-pan when zoomed in
 * - Double-click toggle zoom (1x <-> 2x)
 * - Wheel zoom
 * - Full HTML5 video controls
 * - Download asset button
 * - Keyboard shortcuts (Esc = close, +/- = zoom, 0 = reset)
 */
export default function MediaLightbox({
  isOpen,
  onClose,
  media, // { mediaUrl, mediaType, mediaName, time } or string URL
}) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const currentPosRef = useRef({ x: 0, y: 0 });

  const url = typeof media === "string" ? media : media?.mediaUrl;
  const isVideo =
    typeof media === "object" && media?.mediaType
      ? media.mediaType === "video"
      : Boolean(url && /\.(mp4|mov|webm|ogg)($|\?)/i.test(url));
  const title = typeof media === "object" ? media?.mediaName || "" : "";
  const time = typeof media === "object" ? media?.time || "" : "";

  // Reset transform state whenever a new media item opens
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      currentPosRef.current = { x: 0, y: 0 };
    }
  }, [isOpen, url]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      } else if (e.key === "+" || e.key === "=") {
        setZoom((z) => Math.min(4, +(z + 0.5).toFixed(1)));
      } else if (e.key === "-") {
        setZoom((z) => {
          const next = Math.max(0.5, +(z - 0.5).toFixed(1));
          if (next <= 1) {
            setPosition({ x: 0, y: 0 });
            currentPosRef.current = { x: 0, y: 0 };
          }
          return next;
        });
      } else if (e.key === "0") {
        setZoom(1);
        setPosition({ x: 0, y: 0 });
        currentPosRef.current = { x: 0, y: 0 };
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const handleZoomIn = (e) => {
    e?.stopPropagation();
    setZoom((z) => Math.min(4, +(z + 0.5).toFixed(1)));
  };

  const handleZoomOut = (e) => {
    e?.stopPropagation();
    setZoom((z) => {
      const next = Math.max(0.5, +(z - 0.5).toFixed(1));
      if (next <= 1) {
        setPosition({ x: 0, y: 0 });
        currentPosRef.current = { x: 0, y: 0 };
      }
      return next;
    });
  };

  const handleReset = (e) => {
    e?.stopPropagation();
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    currentPosRef.current = { x: 0, y: 0 };
  };

  const handleToggleZoom = (e) => {
    e?.stopPropagation();
    if (zoom > 1) {
      handleReset();
    } else {
      setZoom(2);
    }
  };

  const handleWheel = (e) => {
    if (isVideo) return;
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)));
    } else {
      setZoom((z) => {
        const next = Math.max(0.5, +(z - 0.25).toFixed(2));
        if (next <= 1) {
          setPosition({ x: 0, y: 0 });
          currentPosRef.current = { x: 0, y: 0 };
        }
        return next;
      });
    }
  };

  // Mouse pan handlers
  const handleMouseDown = (e) => {
    if (zoom <= 1 || isVideo) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging || zoom <= 1) return;
      const newX = e.clientX - dragStartRef.current.x;
      const newY = e.clientY - dragStartRef.current.y;
      setPosition({ x: newX, y: newY });
      currentPosRef.current = { x: newX, y: newY };
    },
    [isDragging, zoom]
  );

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch pan handlers
  const touchStartRef = useRef({ x: 0, y: 0 });
  const handleTouchStart = (e) => {
    if (zoom <= 1 || isVideo || e.touches.length !== 1) return;
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    };
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || zoom <= 1 || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const newX = touch.clientX - touchStartRef.current.x;
    const newY = touch.clientY - touchStartRef.current.y;
    setPosition({ x: newX, y: newY });
    currentPosRef.current = { x: newX, y: newY };
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  if (!isOpen || !url) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Media Lightbox"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-black/95 backdrop-blur-md select-none animate-in fade-in duration-200"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={(e) => {
        // If clicking directly on backdrop container, close
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
    >
      {/* Top Bar: Title / Info + Close Button */}
      <div className="w-full h-14 px-4 flex items-center justify-between text-white bg-gradient-to-b from-black/80 to-transparent z-10 shrink-0">
        <div className="flex items-center gap-3 min-w-0 pr-4">
          <div className="truncate">
            <h3 className="text-sm font-semibold truncate text-white/95">
              {title || (isVideo ? "Video" : "Photo")}
            </h3>
            {time && <p className="text-[11px] text-white/60">{time}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            download
            className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title="Download original"
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </a>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/40"
            title="Close (Esc)"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Media Viewport */}
      <div
        className="flex-1 w-full flex items-center justify-center p-2 sm:p-4 overflow-hidden relative cursor-default"
        onWheel={handleWheel}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose?.();
          }
        }}
      >
        {isVideo ? (
          <div className="relative max-w-5xl max-h-[82vh] flex items-center justify-center">
            <video
              src={url}
              controls
              autoPlay
              playsInline
              className="max-h-[80vh] max-w-full rounded-lg shadow-2xl bg-black"
            />
          </div>
        ) : (
          <div
            className={`relative flex items-center justify-center transition-transform ${
              isDragging ? "duration-0" : "duration-100 ease-out"
            }`}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
              cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in",
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onDoubleClick={handleToggleZoom}
          >
            <img
              src={url}
              alt={title || "Enlarged media"}
              draggable={false}
              className="max-h-[82vh] max-w-[92vw] sm:max-w-[85vw] object-contain rounded-md shadow-2xl pointer-events-none"
            />
          </div>
        )}
      </div>

      {/* Bottom Controls Bar (Zoom, Fit, Actions) */}
      {!isVideo && (
        <div className="w-full pb-4 pt-2 flex items-center justify-center z-10 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-900/90 border border-white/15 backdrop-blur-md shadow-2xl text-white text-xs">
            {/* Zoom Out */}
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className="p-1.5 rounded-full hover:bg-white/15 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Zoom out (-)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
              </svg>
            </button>

            {/* Current Zoom Level / Reset */}
            <button
              type="button"
              onClick={handleReset}
              className="px-2.5 py-1 rounded-md font-mono text-[11px] font-semibold hover:bg-white/15 transition-colors"
              title="Reset Zoom (0)"
            >
              {Math.round(zoom * 100)}%
            </button>

            {/* Zoom In */}
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 4}
              className="p-1.5 rounded-full hover:bg-white/15 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Zoom in (+)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>

            <span className="w-px h-4 bg-white/20 mx-1" />

            {/* Reset / Fit to screen button */}
            <button
              type="button"
              onClick={handleReset}
              className="px-2 py-1 rounded-md text-[11px] font-medium hover:bg-white/15 transition-colors"
              title="Fit to Screen"
            >
              Fit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
