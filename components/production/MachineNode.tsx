"use client";

import React from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FileText, AlertTriangle, CheckCircle, Clock } from "lucide-react";

export type MachineStatus = "Working" | "Needs Maintenance" | "Not Working" | "Review Pending" | "Report Not Filed";

// Define the complete node type that includes React Flow's required properties
type MachineNodeType = {
  id: string;
  position: { x: number; y: number };
  data: {
    name: string;
    status: MachineStatus;
    healthPercentage?: number; // 0-100
    lastReportDate?: string;
    onFileReport?: (nodeId: string) => void;
  };
};

const statusConfig: Record<
  MachineStatus,
  {
    label: string;
    color: string; // Tailwind background color class
    icon: React.ElementType;
    textColor?: string; // Tailwind text color class, defaults to white for dark backgrounds
  }
> = {
  Working: {
    label: "Working",
    color: "bg-green-500",
    icon: CheckCircle,
    textColor: "text-white",
  },
  "Needs Maintenance": {
    label: "Needs Maintenance",
    color: "bg-orange-500",
    icon: AlertTriangle,
    textColor: "text-white",
  },
  "Not Working": {
    label: "Not Working",
    color: "bg-red-500",
    icon: AlertTriangle,
    textColor: "text-white",
  },
  "Review Pending": {
    label: "Review Pending",
    color: "bg-yellow-400",
    icon: Clock,
    textColor: "text-gray-800",
  },
  "Report Not Filed": {
    label: "Report Not Filed",
    color: "bg-gray-400",
    icon: FileText,
    textColor: "text-white",
  },
};

// The MachineNode component receives NodeProps with our custom node type
type MachineNodeProps = NodeProps<MachineNodeType>;

const MachineNode: React.FC<MachineNodeProps> = ({ id, data }) => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  // Access the node data with default values
  const {
    name = "Unnamed Machine",
    status = "Report Not Filed",
    healthPercentage = 0,
    lastReportDate,
    onFileReport,
  } = data;

  // Type assertion for status since we know it matches MachineStatus
  const nodeStatus = (status || "Report Not Filed") as MachineStatus;
  const currentStatusConfig = statusConfig[nodeStatus] || statusConfig["Report Not Filed"];
  const IconComponent = currentStatusConfig.icon;

  return (
    <TooltipProvider delayDuration={200}>
      <Card
        className={cn(
          "w-72 shadow-lg transition-shadow duration-200 hover:shadow-xl",
          isDarkMode ? "dark:border-gray-700 dark:bg-gray-800" : "border-gray-300 bg-white"
        )}
      >
        <CardHeader className="border-b p-4 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold dark:text-gray-100">{name}</CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  className={cn(
                    "px-2 py-1 text-xs",
                    currentStatusConfig.color,
                    currentStatusConfig.textColor || (isDarkMode ? "text-white" : "text-white")
                  )}
                >
                  <IconComponent className="mr-1 h-3 w-3" />
                  {currentStatusConfig.label}
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="dark:bg-gray-700 dark:text-gray-200">
                <p>Status: {currentStatusConfig.label}</p>
                {lastReportDate && <p>Last Report: {lastReportDate}</p>}
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          {status !== "Report Not Filed" && status !== "Not Working" && (
            <div className="mb-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Machine Health</span>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{healthPercentage}%</span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${healthPercentage}%` }}
                />
              </div>
            </div>
          )}

          {lastReportDate && (
            <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">Last Report: {lastReportDate}</p>
          )}
          {status === "Report Not Filed" && (
            <p className="mb-3 flex items-center text-xs text-yellow-600 dark:text-yellow-400">
              <AlertTriangle size={14} className="mr-1.5" />
              Maintenance report overdue or not filed.
            </p>
          )}
        </CardContent>

        {onFileReport && id && (
          <CardFooter className="border-t p-4 dark:border-gray-700">
            <Button variant="outline" size="sm" className="w-full" onClick={() => onFileReport?.(id)}>
              <FileText className="mr-2 h-4 w-4" />
              File Report
            </Button>
          </CardFooter>
        )}
        {/* Handles for connecting nodes */}
        <Handle
          type="target"
          position={Position.Left}
          className={cn(
            "!h-3 !w-3 rounded-full !bg-teal-500 shadow-md",
            isDarkMode ? "!border-gray-700" : "!border-gray-300"
          )}
          isConnectable={true}
        />
        <Handle
          type="source"
          position={Position.Right}
          className={cn(
            "!h-3 !w-3 rounded-full !bg-teal-500 shadow-md",
            isDarkMode ? "!border-gray-700" : "!border-gray-300"
          )}
          isConnectable={true}
        />
        {/* Optional: Add top/bottom handles for branching if needed in future */}
        <Handle
          id="top"
          type="target"
          position={Position.Top}
          className={cn("!h-2.5 !w-2.5 !bg-gray-400", isDarkMode ? "!border-gray-600" : "!border-gray-400")}
          isConnectable={true}
        />
        <Handle
          id="bottom"
          type="source"
          position={Position.Bottom}
          className={cn("!h-2.5 !w-2.5 !bg-gray-400", isDarkMode ? "!border-gray-600" : "!border-gray-400")}
          isConnectable={true}
        />
      </Card>
    </TooltipProvider>
  );
};

export default MachineNode;
