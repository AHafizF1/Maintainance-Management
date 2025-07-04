"use client";

import React, { useCallback, useState, useRef } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Connection,
  Controls,
  Edge,
  EdgeProps,
  MiniMap,
  Node,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import { useTheme } from "next-themes";
import { Grid, Maximize2, Minus, Plus, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import "@xyflow/react/dist/style.css";

// Custom Node Component
const CustomNode: React.FC<{
  id: string;
  data: {
    label: string;
    type: string;
    status?: "todo" | "in-progress" | "done";
    progress?: number;
    integration?: string;
    dueDate?: string;
  };
}> = ({ data }) => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  const statusColors = {
    todo: "bg-gray-300",
    "in-progress": "bg-blue-500",
    done: "bg-green-500",
  };

  const statusLabels = {
    todo: "To do",
    "in-progress": "In progress",
    done: "Done",
  };

  const progress = data.progress || 0;
  const status = data.status || "todo";
  const dueDate = data.dueDate || "No due date";
  const integration = data.integration || "Project";

  return (
    <div className="nodrag">
      <div
        className={cn(
          "w-64 overflow-hidden rounded-lg border shadow-sm transition-all hover:shadow-md",
          isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b p-3">
          <div className="flex items-center space-x-2">
            <div className={cn("h-2 w-2 rounded-full", statusColors[status] || "bg-gray-300")} />
            <span className="text-xs font-medium text-gray-500">{statusLabels[status] || "To do"}</span>
          </div>
          {integration && (
            <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
              {integration}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-gray-100">{data.label}</h3>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="mb-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
              <div className="h-1.5 rounded-full bg-blue-600" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Due: {dueDate}</span>
            <span>Details</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Custom Edge Component with Animation and Correlation Values
const CustomEdge = ({ sourceX, sourceY, targetX, targetY, data }: Omit<EdgeProps, "markerEnd">): JSX.Element => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  // Calculate edge path (quadratic curve for better visuals)
  const edgePath = `M${sourceX},${sourceY} Q${(sourceX + targetX) / 2} ${(sourceY + targetY) / 2 + 50} ${targetX},${targetY}`;

  const isAnimated = data?.animated || false;

  // Determine edge color based on correlation value if it exists
  let edgeColor = isDarkMode ? "#4B5563" : "#9CA3AF";
  if (data?.value !== undefined) {
    const correlation = Number(data.value);
    if (correlation > 0.8) {
      edgeColor = "#10B981"; // Strong positive correlation
    } else if (correlation > 0.5) {
      edgeColor = "#3B82F6"; // Moderate positive correlation
    } else if (correlation > 0) {
      edgeColor = "#F59E0B"; // Weak positive correlation
    } else if (correlation > -0.5) {
      edgeColor = "#EF4444"; // Weak negative correlation
    } else {
      edgeColor = "#6B7280"; // Strong negative correlation
    }
  }
  const edgeWidth = 2.5;

  return (
    <>
      {/* Base path (invisible but interactive) */}
      <path d={edgePath} stroke="transparent" strokeWidth="20" fill="none" className="cursor-pointer" />

      {/* Main edge path */}
      <path
        d={edgePath}
        stroke={isDarkMode ? "#374151" : "#E5E7EB"}
        strokeWidth={edgeWidth + 2}
        fill="none"
        className="transition-colors duration-200"
        style={{
          strokeDasharray: data?.dashed ? "5,5" : "none",
          opacity: 0.5,
        }}
      />

      {/* Animated progress indicator */}
      {isAnimated && (
        <path d={edgePath} stroke={edgeColor} strokeWidth={edgeWidth} fill="none" strokeDasharray="8,4">
          <animate attributeName="stroke-dashoffset" values="200%;0" dur="3s" repeatCount="indefinite" />
        </path>
      )}

      {/* Invisible path for better interaction */}
      <path d={edgePath} stroke="transparent" strokeWidth="20" fill="none" className="cursor-pointer" />

      {/* Edge label */}
      {data?.label && (
        <g transform={`translate(${(sourceX + targetX) / 2}, ${(sourceY + targetY) / 2 - 15})`}>
          <rect
            x="-30"
            y="-12"
            width="60"
            height="24"
            rx="12"
            fill={isDarkMode ? "#1F2937" : "white"}
            stroke={edgeColor}
            strokeWidth="1"
            className="shadow-sm"
          />
          <path d="M0,-5 L10,0 L0,5" stroke={edgeColor} strokeWidth="1" className="shadow-sm" />
          <text x="0" y="4" textAnchor="middle" fontSize="10" fontWeight="600" fill={edgeColor}>
            {String(data.label || "")}
          </text>
        </g>
      )}
    </>
  );
};

// Node and Edge type definitions
const nodeTypes = { custom: CustomNode };
const edgeTypes = { custom: CustomEdge };

const initialNodes: Node[] = [
  // Raw Material Stage
  {
    id: "raw-material",
    type: "custom",
    position: { x: 100, y: 50 },
    data: {
      label: "Raw Material Inventory",
      type: "start",
      status: "in-progress",
      progress: 95,
      dueDate: "2023-07-05",
      integration: "SAP",
    },
  },
  // Manufacturing Stage 1
  {
    id: "cutting",
    type: "custom",
    position: { x: 400, y: 50 },
    data: {
      label: "Cutting & Shaping",
      type: "process",
      status: "in-progress",
      progress: 75,
      dueDate: "2023-07-08",
      integration: "MES",
    },
  },
  // Manufacturing Stage 2
  {
    id: "assembly",
    type: "custom",
    position: { x: 700, y: 50 },
    data: {
      label: "Assembly Line",
      type: "process",
      status: "in-progress",
      progress: 30,
      dueDate: "2023-07-12",
      integration: "MES",
    },
  },
  // Quality Control
  {
    id: "quality-check",
    type: "custom",
    position: { x: 400, y: 200 },
    data: {
      label: "Quality Control",
      type: "decision",
      status: "todo",
      progress: 0,
      dueDate: "2023-07-15",
      integration: "QMS",
    },
  },
  // Packaging
  {
    id: "packaging",
    type: "custom",
    position: { x: 700, y: 350 },
    data: {
      label: "Packaging",
      type: "process",
      status: "todo",
      progress: 0,
      dueDate: "2023-07-18",
      integration: "WMS",
    },
  },
  // Shipping
  {
    id: "shipping",
    type: "custom",
    position: { x: 1000, y: 350 },
    data: {
      label: "Shipping & Distribution",
      type: "end",
      status: "todo",
      progress: 0,
      dueDate: "2023-07-20",
      integration: "TMS",
    },
  },
  // Rework (conditional)
  {
    id: "rework",
    type: "custom",
    position: { x: 400, y: 500 },
    data: {
      label: "Rework Station",
      type: "process",
      status: "todo",
      progress: 0,
      dueDate: "2023-07-16",
      integration: "MES",
    },
  },
];

const initialEdges: Edge[] = [
  // Main production flow
  {
    id: "e1",
    source: "raw-material",
    target: "cutting",
    type: "custom",
    data: {
      value: 0.9,
      label: "Transfer",
      animated: true,
      progress: 95,
    },
  },
  {
    id: "e2",
    source: "cutting",
    target: "assembly",
    type: "custom",
    data: {
      value: 0.8,
      label: "Next Stage",
      animated: true,
      progress: 75,
    },
  },
  {
    id: "e3",
    source: "assembly",
    target: "quality-check",
    type: "custom",
    data: {
      value: 0.7,
      label: "For QC",
      animated: true,
      progress: 30,
    },
  },
  {
    id: "e4",
    source: "decision1",
    target: "process3",
    type: "custom",
    label: "Revise",
    data: { value: -0.64 },
  },
  {
    id: "e5",
    source: "process2",
    target: "end",
    type: "custom",
    data: { value: 0.95 },
  },
  {
    id: "e6",
    source: "process3",
    target: "process1",
    type: "custom",
    data: { value: -0.45 },
  },
];

// Inner component that contains the flow logic
const Flow = (): JSX.Element => {
  const { resolvedTheme } = useTheme();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const setReactFlowInstance = useCallback(() => {
    // Instance setter for React Flow
  }, []);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const onConnect = useCallback((params: Connection | Edge) => setEdges(eds => addEdge(params, eds)), [setEdges]);
  const { fitView, zoomIn, zoomOut, setViewport } = useReactFlow();
  const [showGrid, setShowGrid] = useState(true);
  const isDarkMode = resolvedTheme === "dark";

  const toggleGrid = useCallback(() => {
    setShowGrid(prev => !prev);
  }, []);

  const handleReset = useCallback(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setViewport({ x: 0, y: 0, zoom: 1 });
    fitView();
  }, [setNodes, setEdges, setViewport, fitView]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-background" ref={reactFlowWrapper}>
      <style jsx global>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -1000;
          }
        }
        .flow-animation {
          animation: dash 20s linear infinite;
        }
        .react-flow__controls {
          box-shadow:
            0 1px 3px 0 rgba(0, 0, 0, 0.1),
            0 1px 2px -1px rgba(0, 0, 0, 0.1);
          border-radius: 0.5rem;
          overflow: hidden;
          background: transparent !important;
          border: none !important;
        }
        .react-flow__controls-button {
          background: ${isDarkMode ? "#1F2937" : "white"} !important;
          border-bottom: 1px solid ${isDarkMode ? "#374151" : "#E5E7EB"} !important;
          color: ${isDarkMode ? "#F3F4F6" : "#1F2937"} !important;
          width: 32px !important;
          height: 32px !important;
          min-width: 32px !important;
          min-height: 32px !important;
          padding: 0 !important;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .react-flow__controls-button:hover {
          background: ${isDarkMode ? "#374151" : "#F3F4F6"} !important;
        }
        .react-flow__controls-button svg {
          width: 16px;
          height: 16px;
          fill: currentColor;
        }
        .react-flow__controls-button:first-child {
          border-top-left-radius: 0.5rem !important;
          border-top-right-radius: 0.5rem !important;
        }
        .react-flow__controls-button:last-child {
          border-bottom-left-radius: 0.5rem !important;
          border-bottom-right-radius: 0.5rem !important;
          border-bottom: none !important;
        }
      `}</style>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.5 }}
        minZoom={0.1}
        maxZoom={4}
        defaultEdgeOptions={{
          type: "custom",
          style: {
            stroke: resolvedTheme === "dark" ? "#4B5563" : "#9CA3AF",
            strokeWidth: 1.5,
          },
        }}
        nodesDraggable
        nodesConnectable
        elementsSelectable
        snapToGrid={showGrid}
        snapGrid={[15, 15]}
      >
        {/* Custom arrow marker */}
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill={resolvedTheme === "dark" ? "#9CA3AF" : "#6B7280"} />
          </marker>
        </defs>

        {/* Background grid */}
        {showGrid && (
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color={resolvedTheme === "dark" ? "#374151" : "#D1D5DB"}
          />
        )}

        <MiniMap
          nodeStrokeColor={n => {
            if (n.type === "custom") {
              switch (n.data.type) {
                case "start":
                  return "#3B82F6";
                case "end":
                  return "#EF4444";
                case "decision":
                  return "#F59E0B";
                case "process":
                default:
                  return resolvedTheme === "dark" ? "#60A5FA" : "#2563EB";
              }
            }
            return resolvedTheme === "dark" ? "#4B5563" : "#9CA3AF";
          }}
          nodeColor={n => {
            if (n.type === "custom") {
              switch (n.data.type) {
                case "start":
                  return resolvedTheme === "dark" ? "#1E40AF" : "#DBEAFE";
                case "end":
                  return resolvedTheme === "dark" ? "#991B1B" : "#FEE2E2";
                case "decision":
                  return resolvedTheme === "dark" ? "#92400E" : "#FEF3C7";
                case "process":
                default:
                  return resolvedTheme === "dark" ? "#1F2937" : "#F9FAFB";
              }
            }
            return resolvedTheme === "dark" ? "#1F2937" : "#F9FAFB";
          }}
          nodeBorderRadius={4}
          maskColor={resolvedTheme === "dark" ? "rgba(17, 24, 39, 0.7)" : "rgba(249, 250, 251, 0.7)"}
          style={{
            backgroundColor: resolvedTheme === "dark" ? "#111827" : "#F3F4F6",
            borderRadius: "0.5rem",
            border: `1px solid ${resolvedTheme === "dark" ? "#374151" : "#E5E7EB"}`,
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
          }}
          zoomable
          pannable
          nodeStrokeWidth={2}
          position="bottom-right"
        />

        <Controls className="!border-none !bg-transparent" position="top-right">
          <button type="button" onClick={toggleGrid} title="Toggle Grid" className="react-flow__controls-button">
            <Grid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => zoomIn({ duration: 300 })}
            title="Zoom In"
            className="react-flow__controls-button"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => zoomOut({ duration: 300 })}
            title="Zoom Out"
            className="react-flow__controls-button"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => fitView({ duration: 300, padding: 0.2 })}
            title="Fit View"
            className="react-flow__controls-button"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          <button type="button" onClick={handleReset} title="Reset View" className="react-flow__controls-button">
            <RefreshCw className="h-4 w-4" />
          </button>
        </Controls>
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill={resolvedTheme === "dark" ? "#60A5FA" : "#2563EB"} />
          </marker>
        </defs>
      </ReactFlow>
    </div>
  );
};

const ProductionFlowchart: React.FC = (): JSX.Element => (
  <div className="h-[600px] w-full rounded-lg border bg-background/50">
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  </div>
);

export default ProductionFlowchart;
