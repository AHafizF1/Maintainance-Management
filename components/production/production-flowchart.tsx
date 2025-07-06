"use client";

import React, { useCallback, useState, useRef, useMemo } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Connection,
  Controls,
  Edge,
  MiniMap,
  Node,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  ReactFlowProvider,
  MarkerType,
  Position,
} from "@xyflow/react";
import { useTheme } from "next-themes";
import { Grid, Maximize2, Minus, Plus, RefreshCw, MapIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import MachineNode, { MachineNodeData } from "./MachineNode";
import FileReportDialog from "./FileReportDialog"; // Import the dialog
import { useToast } from "@/components/ui/use-toast"; // Import useToast
import "@xyflow/react/dist/style.css";

import { useEffect } from "react"; // Import useEffect
import { fetchProductionLineData, ProductionLineLayout } from "./production-api-service"; // Import the placeholder API

// Define initial layout positions
const initialNodePositions = {
  "machine-1": { x: 50, y: 150 },
  "machine-2": { x: 350, y: 150 },
  "machine-3": { x: 650, y: 150 },
  "machine-4-branch": { x: 350, y: 350 }, // Branching node
  "machine-5": { x: 950, y: 150 },
};


const getInitialNodes = (onFileReport: (nodeId: string) => void): Node<MachineNodeData>[] => [
  {
    id: "machine-1",
    type: "machine",
    position: initialNodePositions["machine-1"],
    data: {
      name: "CNC Mill A-100",
      status: "Working",
      healthPercentage: 92,
      lastReportDate: "2024-07-28 10:00 AM",
      onFileReport,
    },
  },
  {
    id: "machine-2",
    type: "machine",
    position: initialNodePositions["machine-2"],
    data: {
      name: "Lathe LX-25",
      status: "Needs Maintenance",
      healthPercentage: 45,
      lastReportDate: "2024-07-27 08:00 PM",
      onFileReport,
    },
  },
  {
    id: "machine-3",
    type: "machine",
    position: initialNodePositions["machine-3"],
    data: {
      name: "Robotic Arm KUKA-3",
      status: "Review Pending",
      healthPercentage: 70,
      lastReportDate: "2024-07-28 02:00 PM",
      onFileReport,
    },
  },
  {
    id: "machine-4-branch", // Branching machine
    type: "machine",
    position: initialNodePositions["machine-4-branch"],
    data: {
      name: "Grinder G-50 (Aux)",
      status: "Working",
      healthPercentage: 88,
      lastReportDate: "2024-07-28 09:30 AM",
      onFileReport,
    },
  },
  {
    id: "machine-5",
    type: "machine",
    position: initialNodePositions["machine-5"],
    data: {
      name: "Assembly Station AS-7",
      status: "Report Not Filed",
      healthPercentage: 0, // Or some default/unknown value
      onFileReport,
    },
  },
    {
    id: "machine-6-stopped",
    type: "machine",
    position: { x: 1250, y: 150 },
    data: {
      name: "Packaging Unit P-2",
      status: "Not Working",
      healthPercentage: 5,
      lastReportDate: "2024-07-26 05:00 PM",
      onFileReport,
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: "e1-2",
    source: "machine-1",
    target: "machine-2",
    animated: true,
    style: { strokeWidth: 2, strokeDasharray: "5 5" },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#2dd4bf" },
  },
  {
    id: "e2-3",
    source: "machine-2",
    target: "machine-3",
    animated: true,
    style: { strokeWidth: 2, strokeDasharray: "5 5" },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#2dd4bf" },
  },
  {
    id: "e2-4b", // Edge from machine-2 to the branching machine-4-branch
    source: "machine-2",
    target: "machine-4-branch",
    sourceHandle: "bottom", // Assuming machine-2 has a 'bottom' source handle
    targetHandle: "top",   // Assuming machine-4-branch has a 'top' target handle
    animated: true,
    type: 'smoothstep',
    style: { strokeWidth: 2, strokeDasharray: "5 5", stroke: "#f97316" }, // Different color for branch
    markerEnd: { type: MarkerType.ArrowClosed, color: "#f97316" },
  },
  {
    id: "e4b-3", // Edge from branching machine-4-branch back to machine-3
    source: "machine-4-branch",
    target: "machine-3",
    sourceHandle: "top",   // Assuming machine-4-branch has a 'top' source handle
    targetHandle: "bottom", // Assuming machine-3 has a 'bottom' target handle
    animated: true,
    type: 'smoothstep',
    style: { strokeWidth: 2, strokeDasharray: "5 5", stroke: "#f97316" },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#f97316" },
  },
  {
    id: "e3-5",
    source: "machine-3",
    target: "machine-5",
    animated: true,
    style: { strokeWidth: 2, strokeDasharray: "5 5" },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#2dd4bf" },
  },
    {
    id: "e5-6",
    source: "machine-5",
    target: "machine-6-stopped",
    animated: true,
    style: { strokeWidth: 2, strokeDasharray: "5 5" },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#ef4444" }, // Red for connection to stopped machine
  },
];

// Node and Edge type definitions
const nodeTypes = { machine: MachineNode };
// const edgeTypes = { custom: CustomEdge }; // We can define custom edges later if needed

// Inner component that contains the flow logic
const Flow = (): JSX.Element => {
  const { resolvedTheme } = useTheme();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { fitView, zoomIn, zoomOut, setCenter, getViewport, getNode } = useReactFlow();
  const [showGrid, setShowGrid] = useState(true);
  const [showMinimap, setShowMinimap] = useState(true);
  const isDarkMode = resolvedTheme === "dark";

  // State for controlling the dialog
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);
  const [selectedNodeForReport, setSelectedNodeForReport] = useState<Node<MachineNodeData> | null>(null);
  const { toast } = useToast();

  const handleOpenFileDialog = useCallback((nodeId: string) => {
    const node = getNode(nodeId);
    if (node) {
      setSelectedNodeForReport(node as Node<MachineNodeData>);
      setIsFileDialogOpen(true);
    } else {
      console.error(`Node with ID ${nodeId} not found.`);
      toast({ variant: "destructive", title: "Error", description: `Node ${nodeId} not found.`});
    }
  }, [getNode, toast]); // Added toast to dependencies of useCallback

  const handleCloseFileDialog = () => {
    setIsFileDialogOpen(false);
    setSelectedNodeForReport(null);
  };

  const initialNodesFromUtils = useMemo(() => getInitialNodes(handleOpenFileDialog), [handleOpenFileDialog]);
  const [nodes, setNodes, onNodesChange] = useNodesState<MachineNodeData>(initialNodesFromUtils);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const layout = await fetchProductionLineData("line-1");

        if (layout.nodes && layout.nodes.length > 0) {
          const nodesWithCallbacks = layout.nodes.map(node => ({
            ...node,
            data: {
              ...node.data,
              onFileReport: handleOpenFileDialog,
            }
          }));
          setNodes(nodesWithCallbacks);
          setEdges(layout.edges || []);
        } else {
          console.warn("API returned no nodes, using initial mock data from getInitialNodes.");
          setNodes(initialNodesFromUtils);
          setEdges(initialEdges);
        }
        setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 100);

      } catch (error) {
        console.error("Failed to load production line data:", error);
        toast({
          variant: "destructive",
          title: "Error Loading Data",
          description: "Could not fetch production line data. Displaying default mock data.",
        });
        setNodes(initialNodesFromUtils);
        setEdges(initialEdges);
        setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 100);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [setNodes, setEdges, fitView, toast, handleOpenFileDialog, initialNodesFromUtils]);

  const onConnect = useCallback((params: Connection | Edge) => {
    const newEdge = {
        ...params,
        animated: true,
        style: { strokeWidth: 2, strokeDasharray: "5 5" },
        markerEnd: { type: MarkerType.ArrowClosed, color: isDarkMode ? "#60A5FA" : "#2563EB" },
    };
    setEdges(eds => addEdge(newEdge, eds));
  }, [setEdges, isDarkMode]);


  const toggleGrid = useCallback(() => setShowGrid(prev => !prev), []);
  const toggleMinimap = useCallback(() => setShowMinimap(prev => !prev), []);

  const handleRecenter = useCallback(() => {
    // Option 1: Fit view to all nodes
    // fitView({ padding: 0.2, duration: 300 });

    // Option 2: Center on a specific point or the average of initial positions
    // For simplicity, let's try to center around the initial main flow area.
    // We can calculate the center of the initialNodes.
    // This is a simplified recenter; a more robust one might involve Dagre or Elk for layout.

    const xPositions = Object.values(initialNodePositions).map(p => p.x);
    const yPositions = Object.values(initialNodePositions).map(p => p.y);
    const avgX = xPositions.reduce((sum, x) => sum + x, 0) / xPositions.length;
    const avgY = yPositions.reduce((sum, y) => sum + y, 0) / yPositions.length;
    const { zoom } = getViewport();

    // We also need to account for node widths to truly center the content.
    // Average node width is ~288px (w-72).
    // We want the center of the screen to be the center of our content.
    // The setCenter function takes the center of the viewport.
    // If reactFlowWrapper.current is available, use its dimensions.
    let viewWidth = window.innerWidth;
    let viewHeight = window.innerHeight;
    if (reactFlowWrapper.current) {
        viewWidth = reactFlowWrapper.current.clientWidth;
        viewHeight = reactFlowWrapper.current.clientHeight;
    }

    // Target viewport center based on content center
    const targetX = viewWidth / 2 - avgX * zoom;
    const targetY = viewHeight / 2 - avgY * zoom;

    setCenter(avgX, avgY, { zoom, duration: 500 });

    // Restore initial node positions if they were moved
    // This makes "recenter" also a "reset layout"
    setNodes(currentNodes =>
      currentNodes.map(node => {
        const initialPosition = initialNodePositions[node.id as keyof typeof initialNodePositions];
        if (initialPosition) {
          return { ...node, position: initialPosition };
        }
        return node; // Keep position if not in initial set (e.g. newly added)
      })
    );
    fitView({padding: 0.2, duration: 300});


  }, [fitView, setNodes, setCenter, getViewport]);

  const defaultEdgeOptions = useMemo(() => ({
    animated: true,
    style: {
      stroke: resolvedTheme === "dark" ? "#4A5568" : "#A0AEC0", // Tailwind gray-600 / gray-500
      strokeWidth: 2,
      strokeDasharray: "5 5",
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: resolvedTheme === "dark" ? "#60A5FA" : "#2563EB", // Tailwind blue-400 / blue-600
    },
  }), [resolvedTheme]);


  return (
    <div className="relative h-full w-full overflow-hidden bg-background" ref={reactFlowWrapper}>
       <style jsx global>{`
        // Custom styles for controls to match Shadcn/UI better
        .react-flow__controls {
          box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1);
          border-radius: 0.5rem; /* lg */
          overflow: hidden;
          background: transparent !important;
          border: none !important;
        }
        .react-flow__controls-button {
          background: ${isDarkMode ? "hsl(var(--card))" : "hsl(var(--background))"} !important;
          border-bottom: 1px solid ${isDarkMode ? "hsl(var(--border))" : "hsl(var(--border))"} !important;
          color: hsl(var(--foreground)) !important;
          width: 2.25rem !important; /* h-9 */
          height: 2.25rem !important; /* w-9 */
          min-width: 2.25rem !important;
          min-height: 2.25rem !important;
          padding: 0 !important;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .react-flow__controls-button:hover {
          background: ${isDarkMode ? "hsl(var(--muted))" : "hsl(var(--accent))"} !important;
        }
        .react-flow__controls-button svg {
          width: 1rem; /* h-4 */
          height: 1rem; /* w-4 */
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

        // Animated dash for edges
        .animated-dash {
          stroke-dasharray: 5, 5;
          animation: dashdraw 0.5s linear infinite;
        }
        @keyframes dashdraw {
          to {
            stroke-dashoffset: -10;
          }
        }
      `}</style>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        // edgeTypes={edgeTypes} // Uncomment if using custom edges
        fitView
        fitViewOptions={{ padding: 0.2 }} // Increased padding
        minZoom={0.1}
        maxZoom={4}
        defaultEdgeOptions={defaultEdgeOptions}
        nodesDraggable
        nodesConnectable
        elementsSelectable
        snapToGrid={showGrid}
        snapGrid={[20, 20]} // Larger snap grid
        connectionLineStyle={{ stroke: isDarkMode ? "#60A5FA" : "#2563EB", strokeWidth: 2 }}
        attributionPosition="bottom-left" // Pro feature, remove if not using Pro
      >
        {showGrid && (
          <Background
            variant={BackgroundVariant.Dots}
            gap={24} // Larger gap
            size={1.2}
            color={isDarkMode ? "hsl(var(--border))" : "hsl(var(--input))"}
          />
        )}

        {showMinimap && (
            <MiniMap
            nodeStrokeColor={(n) => {
                if (n.type === 'machine') {
                const status = (n.data as MachineNodeData).status;
                if (status === 'Not Working') return '#ef4444'; // red-500
                if (status === 'Needs Maintenance') return '#f97316'; // orange-500
                if (status === 'Working') return '#22c55e'; // green-500
                }
                return isDarkMode ? '#4A5568' : '#A0AEC0';
            }}
            nodeColor={(n) => {
                if (n.type === 'machine') {
                const status = (n.data as MachineNodeData).status;
                if (status === 'Not Working') return isDarkMode ? '#991b1b' : '#fee2e2'; // red-800 / red-100
                if (status === 'Needs Maintenance') return isDarkMode ? '#9a3412' : '#ffedd5'; // orange-800 / orange-100
                if (status === 'Working') return isDarkMode ? '#166534' : '#dcfce7'; // green-800 / green-100
                }
                return isDarkMode ? 'hsl(var(--card))' : 'hsl(var(--background))';
            }}
            nodeBorderRadius={2}
            maskColor={isDarkMode ? "rgba(30, 41, 59, 0.7)" : "rgba(226, 232, 240, 0.7)"} // slate-800 / slate-200
            style={{
                backgroundColor: isDarkMode ? "hsl(var(--muted))" : "hsl(var(--accent))",
                borderRadius: "0.375rem", // md
                border: `1px solid ${isDarkMode ? "hsl(var(--border))" : "hsl(var(--input))"}`,
            }}
            pannable
            zoomable
            ariaLabel="Minimap of the production line"
            position="bottom-right"
            />
        )}

        <Controls className="!border-none !bg-transparent" position="top-right">
          <button type="button" onClick={() => zoomIn({ duration: 300 })} title="Zoom In" className="react-flow__controls-button">
            <Plus />
          </button>
          <button type="button" onClick={() => zoomOut({ duration: 300 })} title="Zoom Out" className="react-flow__controls-button">
            <Minus />
          </button>
          <button type="button" onClick={() => fitView({ duration: 300, padding: 0.2 })} title="Fit View" className="react-flow__controls-button">
            <Maximize2 />
          </button>
           <button type="button" onClick={handleRecenter} title="Recenter View" className="react-flow__controls-button">
            <RefreshCw />
          </button>
          <button type="button" onClick={toggleGrid} title={showGrid ? "Hide Grid" : "Show Grid"} className="react-flow__controls-button">
            <Grid />
          </button>
           <button type="button" onClick={toggleMinimap} title={showMinimap ? "Hide Minimap" : "Show Minimap"} className="react-flow__controls-button">
            <MapIcon /> {/* Using MapIcon for minimap toggle */}
          </button>
        </Controls>
      </ReactFlow>
      {selectedNodeForReport && (
        <FileReportDialog
          isOpen={isFileDialogOpen}
          onClose={handleCloseFileDialog}
          machineNodeId={selectedNodeForReport.id}
          machineName={selectedNodeForReport.data.name}
        />
      )}
    </div>
  );
};

const ProductionFlowchart: React.FC = (): JSX.Element => {
  const { Toaster } = useToast(); // Get Toaster if it's part of useToast, or import separately
                                  // If Sonner or react-hot-toast is used, their Toaster component needs to be added here or at a higher level in the app.
                                  // For Shadcn/UI, Toaster is usually at the root of the app.
                                  // We'll assume Toaster is globally available or add it if necessary.
                                  // For now, let's ensure it's noted. If using Shadcn's toast, it's usually in the main layout.
                                  // Let's add a simple Toaster here if not present globally, for demo purposes.
                                  // This might conflict if another Toaster is already in the app's layout.
                                  // It's better to ensure a global Toaster exists.
                                  // For this component, we just need `useToast`.

  return (
    <div className="h-[calc(100vh-200px)] w-full rounded-lg border bg-background shadow-sm">
      {/* Ensure Toaster is rendered, typically in your app's layout file (e.g., layout.tsx)
          If not, you might need to add <Toaster /> here or in a parent component.
          For example, if using Shadcn UI's toast:
          import { Toaster } from "@/components/ui/toaster";
          ...
          <Toaster />
          For this exercise, I'll assume it's handled globally.
      */}
      <ReactFlowProvider>
        <Flow />
      </ReactFlowProvider>
    </div>
  );
};

export default ProductionFlowchart;
