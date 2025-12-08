import {
  MousePointer,
  Minus,
  Paintbrush,
  Palette,
  Plus,
  Trash2,
  ArrowDown,
  Settings,
  Eye,
  EyeOff,
  PaintBucket,
  Pencil,
  Undo2,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import type { DrawingState, Tool } from "../types/play.types";
import type { HashAlignment } from "../types/field.types";
import { ColorPickerDialog } from "./ColorPickerDialog";
import { DrawOptionsDialog } from "./DrawOptionsDialog";
import { EraseDialog } from "./EraseDialog";
import { RouteDialog } from "./RouteDialog";
import { ConfirmDialog } from "./ConfirmDialog";
import { HashDialog } from "./HashDialog";
import { SettingsDialog } from "./SettingsDialog";
import { Tooltip } from "./Tooltip";
import { useTheme } from "../contexts/ThemeContext";
import svgPaths from "../imports/svg-ybscv0ilx3";

interface ToolbarProps {
  drawingState: DrawingState;
  setDrawingState: (state: DrawingState) => void;
  hashAlignment: HashAlignment;
  setHashAlignment: (alignment: HashAlignment) => void;
  showPlayBar: boolean;
  setShowPlayBar: (show: boolean) => void;
}

export function Toolbar({
  drawingState,
  setDrawingState,
  hashAlignment,
  setHashAlignment,
  showPlayBar,
  setShowPlayBar,
}: ToolbarProps) {
  const { theme } = useTheme();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showDrawOptions, setShowDrawOptions] = useState(false);
  const [showEraseDialog, setShowEraseDialog] = useState(false);
  const [showRouteDialog, setShowRouteDialog] = useState(false);
  const [showClearConfirm, setShowClearConfirm] =
    useState(false);
  const [showHashDialog, setShowHashDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] =
    useState(false);
  const drawDialogRef = useRef<HTMLDivElement>(null);

  // Auto-close draw dialog when cursor moves to canvas
  useEffect(() => {
    if (!showDrawOptions) return;

    let shouldAutoClose = false;

    const handleMouseMove = (e: MouseEvent) => {
      // Get the draw dialog element position
      const dialogElement = document.querySelector('[data-draw-dialog]');
      if (!dialogElement) return;

      const dialogRect = dialogElement.getBoundingClientRect();
      
      // Create a buffer zone around the dialog (50px on all sides)
      const bufferSize = 50;
      const safeZone = {
        left: dialogRect.left - bufferSize,
        right: dialogRect.right + bufferSize,
        top: dialogRect.top - bufferSize,
        bottom: dialogRect.bottom + bufferSize,
      };

      // Check if cursor is inside the safe zone
      const isInsideSafeZone =
        e.clientX >= safeZone.left &&
        e.clientX <= safeZone.right &&
        e.clientY >= safeZone.top &&
        e.clientY <= safeZone.bottom;

      // If cursor is in safe zone, enable auto-close for future movements
      if (isInsideSafeZone) {
        shouldAutoClose = true;
      }

      // Only close if auto-close was enabled (cursor was in dialog) and now outside
      if (shouldAutoClose && !isInsideSafeZone) {
        setShowDrawOptions(false);
      }
    };

    // Add event listener with a small delay to prevent immediate closing
    const timer = setTimeout(() => {
      document.addEventListener('mousemove', handleMouseMove);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [showDrawOptions]);

  // Auto-close color picker dialog when cursor moves away
  useEffect(() => {
    if (!showColorPicker) return;

    let shouldAutoClose = false;

    const handleMouseMove = (e: MouseEvent) => {
      // Get the color dialog element position
      const dialogElement = document.querySelector('[data-color-dialog]');
      if (!dialogElement) return;

      const dialogRect = dialogElement.getBoundingClientRect();
      
      // Create a buffer zone around the dialog (50px on all sides)
      const bufferSize = 50;
      const safeZone = {
        left: dialogRect.left - bufferSize,
        right: dialogRect.right + bufferSize,
        top: dialogRect.top - bufferSize,
        bottom: dialogRect.bottom + bufferSize,
      };

      // Check if cursor is inside the safe zone
      const isInsideSafeZone =
        e.clientX >= safeZone.left &&
        e.clientX <= safeZone.right &&
        e.clientY >= safeZone.top &&
        e.clientY <= safeZone.bottom;

      // If cursor is in safe zone, enable auto-close for future movements
      if (isInsideSafeZone) {
        shouldAutoClose = true;
      }

      // Only close if auto-close was enabled (cursor was in dialog) and now outside
      if (shouldAutoClose && !isInsideSafeZone) {
        setShowColorPicker(false);
      }
    };

    // Add event listener with a small delay to prevent immediate closing
    const timer = setTimeout(() => {
      document.addEventListener('mousemove', handleMouseMove);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [showColorPicker]);

  // Auto-close hash dialog when cursor moves away
  useEffect(() => {
    if (!showHashDialog) return;

    let shouldAutoClose = false;

    const handleMouseMove = (e: MouseEvent) => {
      // Get the hash dialog element position
      const dialogElement = document.querySelector('[data-hash-dialog]');
      if (!dialogElement) return;

      const dialogRect = dialogElement.getBoundingClientRect();
      
      // Create a buffer zone around the dialog (50px on all sides)
      const bufferSize = 50;
      const safeZone = {
        left: dialogRect.left - bufferSize,
        right: dialogRect.right + bufferSize,
        top: dialogRect.top - bufferSize,
        bottom: dialogRect.bottom + bufferSize,
      };

      // Check if cursor is inside the safe zone
      const isInsideSafeZone =
        e.clientX >= safeZone.left &&
        e.clientX <= safeZone.right &&
        e.clientY >= safeZone.top &&
        e.clientY <= safeZone.bottom;

      // If cursor is in safe zone, enable auto-close for future movements
      if (isInsideSafeZone) {
        shouldAutoClose = true;
      }

      // Only close if auto-close was enabled (cursor was in dialog) and now outside
      if (shouldAutoClose && !isInsideSafeZone) {
        setShowHashDialog(false);
      }
    };

    // Add event listener with a small delay to prevent immediate closing
    const timer = setTimeout(() => {
      document.addEventListener('mousemove', handleMouseMove);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [showHashDialog]);

  // Auto-close settings dialog when cursor moves away
  useEffect(() => {
    if (!showSettingsDialog) return;

    let shouldAutoClose = false;

    const handleMouseMove = (e: MouseEvent) => {
      // Get the settings dialog element position
      const dialogElement = document.querySelector('[data-settings-dialog]');
      if (!dialogElement) return;

      const dialogRect = dialogElement.getBoundingClientRect();
      
      // Create a buffer zone around the dialog (50px on all sides)
      const bufferSize = 50;
      const safeZone = {
        left: dialogRect.left - bufferSize,
        right: dialogRect.right + bufferSize,
        top: dialogRect.top - bufferSize,
        bottom: dialogRect.bottom + bufferSize,
      };

      // Check if cursor is inside the safe zone
      const isInsideSafeZone =
        e.clientX >= safeZone.left &&
        e.clientX <= safeZone.right &&
        e.clientY >= safeZone.top &&
        e.clientY <= safeZone.bottom;

      // If cursor is in safe zone, enable auto-close for future movements
      if (isInsideSafeZone) {
        shouldAutoClose = true;
      }

      // Only close if auto-close was enabled (cursor was in dialog) and now outside
      if (shouldAutoClose && !isInsideSafeZone) {
        setShowSettingsDialog(false);
      }
    };

    // Add event listener with a small delay to prevent immediate closing
    const timer = setTimeout(() => {
      document.addEventListener('mousemove', handleMouseMove);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [showSettingsDialog]);

  // Auto-close route dialog when cursor moves away
  useEffect(() => {
    if (!showRouteDialog) return;

    let shouldAutoClose = false;

    const handleMouseMove = (e: MouseEvent) => {
      // Get the route dialog element position
      const dialogElement = document.querySelector('[data-route-dialog]');
      if (!dialogElement) return;

      const dialogRect = dialogElement.getBoundingClientRect();
      
      // Create a buffer zone around the dialog (50px on all sides)
      const bufferSize = 50;
      const safeZone = {
        left: dialogRect.left - bufferSize,
        right: dialogRect.right + bufferSize,
        top: dialogRect.top - bufferSize,
        bottom: dialogRect.bottom + bufferSize,
      };

      // Check if cursor is inside the safe zone
      const isInsideSafeZone =
        e.clientX >= safeZone.left &&
        e.clientX <= safeZone.right &&
        e.clientY >= safeZone.top &&
        e.clientY <= safeZone.bottom;

      // If cursor is in safe zone, enable auto-close for future movements
      if (isInsideSafeZone) {
        shouldAutoClose = true;
      }

      // Only close if auto-close was enabled (cursor was in dialog) and now outside
      if (shouldAutoClose && !isInsideSafeZone) {
        setShowRouteDialog(false);
      }
    };

    // Add event listener with a small delay to prevent immediate closing
    const timer = setTimeout(() => {
      document.addEventListener('mousemove', handleMouseMove);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [showRouteDialog]);

  // Auto-close erase dialog when cursor moves away
  useEffect(() => {
    if (!showEraseDialog) return;

    let shouldAutoClose = false;

    const handleMouseMove = (e: MouseEvent) => {
      // Get the erase dialog element position
      const dialogElement = document.querySelector('[data-erase-dialog]');
      if (!dialogElement) return;

      const dialogRect = dialogElement.getBoundingClientRect();
      
      // Create a buffer zone around the dialog (50px on all sides)
      const bufferSize = 50;
      const safeZone = {
        left: dialogRect.left - bufferSize,
        right: dialogRect.right + bufferSize,
        top: dialogRect.top - bufferSize,
        bottom: dialogRect.bottom + bufferSize,
      };

      // Check if cursor is inside the safe zone
      const isInsideSafeZone =
        e.clientX >= safeZone.left &&
        e.clientX <= safeZone.right &&
        e.clientY >= safeZone.top &&
        e.clientY <= safeZone.bottom;

      // If cursor is in safe zone, enable auto-close for future movements
      if (isInsideSafeZone) {
        shouldAutoClose = true;
      }

      // Only close if auto-close was enabled (cursor was in dialog) and now outside
      if (shouldAutoClose && !isInsideSafeZone) {
        setShowEraseDialog(false);
      }
    };

    // Add event listener with a small delay to prevent immediate closing
    const timer = setTimeout(() => {
      document.addEventListener('mousemove', handleMouseMove);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [showEraseDialog]);

  // Listen for keyboard shortcut event
  useEffect(() => {
    const handleDrawToolTrigger = () => {
      handleToolChange("draw");
    };

    window.addEventListener('triggerDrawTool', handleDrawToolTrigger);
    return () => window.removeEventListener('triggerDrawTool', handleDrawToolTrigger);
  }, [drawingState.tool]);

  // Listen for color picker keyboard shortcut
  useEffect(() => {
    const handleColorPickerTrigger = () => {
      // Close all other dialogs first
      setShowDrawOptions(false);
      setShowRouteDialog(false);
      setShowHashDialog(false);
      
      // Toggle color picker
      setShowColorPicker(prev => !prev);
    };

    window.addEventListener('triggerColorPicker', handleColorPickerTrigger);
    return () => window.removeEventListener('triggerColorPicker', handleColorPickerTrigger);
  }, []);

  // Listen for route tool keyboard shortcut
  useEffect(() => {
    const handleRouteToolTrigger = () => {
      // Close all other dialogs first
      setShowColorPicker(false);
      setShowDrawOptions(false);
      setShowHashDialog(false);
      
      // Toggle route dialog
      setShowRouteDialog(prev => !prev);
    };

    window.addEventListener('triggerRouteTool', handleRouteToolTrigger);
    return () => window.removeEventListener('triggerRouteTool', handleRouteToolTrigger);
  }, []);

  // Listen for hash dialog keyboard shortcut
  useEffect(() => {
    const handleHashDialogTrigger = () => {
      // Close all other dialogs first
      setShowColorPicker(false);
      setShowDrawOptions(false);
      setShowRouteDialog(false);
      
      // Toggle hash dialog
      setShowHashDialog(prev => !prev);
    };

    window.addEventListener('triggerHashDialog', handleHashDialogTrigger);
    return () => window.removeEventListener('triggerHashDialog', handleHashDialogTrigger);
  }, []);

  // Listen for close all dialogs event
  useEffect(() => {
    const handleCloseAllDialogs = () => {
      setShowColorPicker(false);
      setShowDrawOptions(false);
      setShowRouteDialog(false);
      setShowHashDialog(false);
    };

    window.addEventListener('closeAllDialogs', handleCloseAllDialogs);
    return () => window.removeEventListener('closeAllDialogs', handleCloseAllDialogs);
  }, []);

  const handleToolChange = (tool: Tool) => {
    // Close all dialogs when switching tools
    setShowColorPicker(false);
    setShowDrawOptions(false);
    setShowRouteDialog(false);

    if (tool === "color") {
      setShowColorPicker(true);
      return;
    }

    if (tool === "draw") {
      // If already on draw tool, toggle the dialog (for keyboard shortcut support)
      if (drawingState.tool === "draw") {
        setShowDrawOptions(prev => !prev);
      } else {
        setDrawingState({ ...drawingState, tool });
        setShowDrawOptions(true);
      }
      return;
    }

    if (tool === "route") {
      setShowRouteDialog(true);
      return;
    }

    setDrawingState({ ...drawingState, tool });
  };

  const handleAddPlayer = () => {
    window.dispatchEvent(new CustomEvent("addPlayer"));
  };

  const handleAddComponent = () => {
    window.dispatchEvent(new CustomEvent("addComponent"));
  };

  const handleSavePlay = () => {
    window.dispatchEvent(new CustomEvent("savePlay"));
  };

  const handleClearPlay = () => {
    setShowClearConfirm(true);
  };

  const confirmClearPlay = () => {
    window.dispatchEvent(new CustomEvent("clearCanvas"));
    setShowClearConfirm(false);
  };

  const toolButtonClass = (isActive: boolean) => `
    w-14 h-14 rounded-xl flex items-center justify-center transition-all cursor-pointer
    ${
      isActive
        ? "bg-blue-500 text-white shadow-lg scale-105"
        : theme === "dark"
          ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }
  `;

  return (
    <>
      <div
        className={`w-20 h-full border-r flex flex-col items-center py-6 ${
          theme === "dark"
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        }`}
        style={{ gap: '12px' }}
      >
        {/* Select Tool */}
        <Tooltip content="Select (S)">
          <button
            onClick={() => handleToolChange("select")}
            className={toolButtonClass(
              drawingState.tool === "select",
            )}
          >
            <MousePointer size={22} />
          </button>
        </Tooltip>

        {/* Add Player Tool */}
        <Tooltip content="Add Player (A)">
          <button
            onClick={() => {
              handleToolChange("addPlayer");
              handleAddPlayer();
            }}
            className={toolButtonClass(
              drawingState.tool === "addPlayer",
            )}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Head */}
              <circle cx="12" cy="5" r="3" />
              {/* Body */}
              <line x1="12" y1="8" x2="12" y2="17" />
              {/* Arms */}
              <line x1="12" y1="11" x2="6" y2="14" />
              <line x1="12" y1="11" x2="18" y2="14" />
              {/* Legs */}
              <line x1="12" y1="17" x2="7" y2="22" />
              <line x1="12" y1="17" x2="17" y2="22" />
            </svg>
          </button>
        </Tooltip>

        {/* Draw Tool */}
        <Tooltip content="Draw (D)">
          <button
            onClick={() => handleToolChange("draw")}
            className={`${toolButtonClass(drawingState.tool === "draw")} relative`}
          >
            <Pencil size={22} />
            {drawingState.tool === "draw" && (
              <div className="absolute -right-1 -top-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
            )}
          </button>
        </Tooltip>

        {/* Erase Tool */}
        <Tooltip content="Erase (E)">
          <button
            onClick={() => {
              // If already on erase tool, toggle the dialog
              if (drawingState.tool === "erase") {
                setShowEraseDialog(!showEraseDialog);
              } else {
                // Switch to erase tool and show dialog
                setDrawingState({ ...drawingState, tool: "erase" });
                setShowEraseDialog(true);
              }
            }}
            className={toolButtonClass(
              drawingState.tool === "erase",
            )}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 235 235"
              fill="none"
              stroke="currentColor"
              strokeWidth="21.3333"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                clipRule="evenodd"
                d={svgPaths.p28898e00}
                fillRule="evenodd"
              />
              <path d={svgPaths.p3a238100} />
            </svg>
          </button>
        </Tooltip>

        {/* Color Tool */}
        <Tooltip content="Pick Color (C)">
          <button
            onClick={() => handleToolChange("color")}
            className={`${toolButtonClass(showColorPicker)} relative`}
          >
            <Palette size={22} />
            <div
              className={`absolute -right-1 -bottom-1 w-4 h-4 rounded-full border-2 shadow-sm ${
                theme === "dark"
                  ? "border-gray-800"
                  : "border-white"
              }`}
              style={{ backgroundColor: drawingState.color }}
            />
          </button>
        </Tooltip>

        {/* Fill Color Tool */}
        <Tooltip content="Fill Color (F)">
          <button
            onClick={() => handleToolChange("fill")}
            className={`${toolButtonClass(drawingState.tool === "fill")} relative`}
          >
            <PaintBucket size={22} style={{ transform: 'scaleX(-1)' }} />
          </button>
        </Tooltip>

        {/* Undo Button */}
        <Tooltip content="Undo (⌘Z)">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("undoAction"))}
            className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              theme === "dark"
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Undo2 size={22} />
          </button>
        </Tooltip>

        {/* Route Tool - COMMENTED OUT */}
        {/* <Tooltip content="Add Route (R)">
          <button
            onClick={() => handleToolChange("route")}
            className={toolButtonClass(showRouteDialog)}
          >
            <ArrowDown
              size={24}
              style={{
                transform: "rotate(-45deg)",
              }}
            />
          </button>
        </Tooltip> */}

        {/* Hash Marker Tool */}
        <Tooltip content="Ball on Hash (H)">
          <button
            onClick={() => setShowHashDialog(!showHashDialog)}
            className={toolButtonClass(showHashDialog)}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Three solid horizontal lines stacked vertically */}
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          </button>
        </Tooltip>

        {/* Add Component Tool */}
        <Tooltip content="Add Component (G)">
          <button
            onClick={() => {
              handleToolChange("addComponent");
              handleAddComponent();
            }}
            className={toolButtonClass(
              drawingState.tool === "addComponent",
            )}
          >
            <Plus size={24} />
          </button>
        </Tooltip>

        {/* Toggle Play Bar Button */}
        <Tooltip
          content={
            showPlayBar ? "Hide Play Bar" : "Show Play Bar"
          }
        >
          <button
            onClick={() => setShowPlayBar(!showPlayBar)}
            className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              theme === "dark"
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            {showPlayBar ? (
              <Eye size={22} />
            ) : (
              <EyeOff size={22} />
            )}
          </button>
        </Tooltip>

        {/* Settings Button */}
        <Tooltip content="Settings">
          <button
            onClick={() =>
              setShowSettingsDialog(!showSettingsDialog)
            }
            className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              theme === "dark"
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Settings size={22} />
          </button>
        </Tooltip>

        {/* Save Button */}
        <Tooltip content="Save">
          <button
            onClick={handleSavePlay}
            className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              theme === "dark"
                ? "bg-green-900 text-green-400 hover:bg-green-800"
                : "bg-green-50 text-green-600 hover:bg-green-100"
            }`}
          >
            <ArrowDown size={22} />
          </button>
        </Tooltip>

        {/* Clear Button */}
        <Tooltip content="Clear">
          <button
            onClick={handleClearPlay}
            className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              theme === "dark"
                ? "bg-red-900 text-red-400 hover:bg-red-800"
                : "bg-red-50 text-red-500 hover:bg-red-100"
            }`}
          >
            <Trash2 size={22} />
          </button>
        </Tooltip>
      </div>

      {/* Dialogs */}
      {showColorPicker && (
        <ColorPickerDialog
          currentColor={drawingState.color}
          onColorChange={(color) =>
            setDrawingState({ ...drawingState, color })
          }
          onClose={() => setShowColorPicker(false)}
        />
      )}

      {showDrawOptions && drawingState.tool === "draw" && (
        <DrawOptionsDialog
          lineStyle={drawingState.lineStyle}
          lineEnd={drawingState.lineEnd}
          brushSize={drawingState.brushSize}
          onLineStyleChange={(lineStyle) =>
            setDrawingState({ ...drawingState, lineStyle })
          }
          onLineEndChange={(lineEnd) =>
            setDrawingState({ ...drawingState, lineEnd })
          }
          onBrushSizeChange={(brushSize) =>
            setDrawingState({ ...drawingState, brushSize })
          }
          onClose={() => setShowDrawOptions(false)}
        />
      )}

      {showEraseDialog && (
        <EraseDialog
          eraseSize={drawingState.eraseSize}
          onEraseSizeChange={(eraseSize) => {
            setDrawingState({ ...drawingState, tool: 'erase', eraseSize });
          }}
          onClose={() => setShowEraseDialog(false)}
        />
      )}

      {showRouteDialog && (
        <RouteDialog
          onClose={() => setShowRouteDialog(false)}
        />
      )}

      {showClearConfirm && (
        <ConfirmDialog
          title="Clear Play?"
          message="Are you sure you want to clear the current play? This action cannot be undone."
          confirmLabel="Clear"
          cancelLabel="Cancel"
          onConfirm={confirmClearPlay}
          onCancel={() => setShowClearConfirm(false)}
          variant="danger"
        />
      )}

      {showHashDialog && (
        <HashDialog
          currentAlignment={hashAlignment}
          onAlignmentChange={setHashAlignment}
          onClose={() => setShowHashDialog(false)}
        />
      )}

      {showSettingsDialog && (
        <SettingsDialog
          onClose={() => setShowSettingsDialog(false)}
        />
      )}
    </>
  );
}