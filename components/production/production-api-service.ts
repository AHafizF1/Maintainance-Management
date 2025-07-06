// Placeholder for Production Line API services

import { Node, Edge } from "@xyflow/react";
import { MachineNodeData } from "./MachineNode";

// Simulate an API call to fetch production line data (nodes and edges)
export interface ProductionLineLayout {
  nodes: Node<MachineNodeData>[];
  edges: Edge[];
}

// Simulate getting an auth token (in a real app, this would come from an auth context/service)
const getAuthToken = (): string => {
  // This is a mock token. In a real app, retrieve this from your auth system.
  if (typeof window !== "undefined") {
    return localStorage.getItem("mockAuthToken") || "mock-jwt-token-if-not-set";
  }
  return "mock-jwt-token-server-side";
};

export const fetchProductionLineData = async (
  lineId: string
): Promise<ProductionLineLayout> => {
  const authToken = getAuthToken();
  console.log(
    `API CALL (Placeholder): Fetching data for production line ${lineId}`
  );
  console.log("Auth Token Used:", authToken ? "Token Present (see details below)" : "No Token");
  if (authToken) {
    // To avoid logging the actual token in a real scenario, you might log its presence or a hash
    console.log("Token details (mock):", authToken.substring(0, 15) + "...");
  }


  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // In a real scenario, this data would come from your backend
  // For now, we'll return a hardcoded basic layout or throw an error if lineId is unknown.
  // This would be replaced by an actual fetch call:
  // const response = await fetch(`/api/production-lines/${lineId}`, {
  //   headers: {
  //     'Authorization': `Bearer ${authToken}`,
  //     'Content-Type': 'application/json',
  //   },
  // });
  // if (!response.ok) {
  //   throw new Error(`Failed to fetch production line data for ${lineId}`);
  // }
  // const data = await response.json();
  // return data;

  if (lineId === "line-1") {
    // This data should ideally be the same as initialNodes/initialEdges in the flowchart component
    // or the flowchart component should use this service to load its initial state.
    // For simplicity of this placeholder, we'll return a minimal structure.
    // You would define proper mock data structures for different lineIds here.
    return {
      nodes: [
        {
          id: "machine-A",
          type: "machine",
          position: { x: 50, y: 150 },
          data: {
            name: "CNC Mill A-1 (API Loaded)",
            status: "Working",
            healthPercentage: 80,
            lastReportDate: "2024-07-29 10:00 AM",
            // onFileReport would be connected by the component using this data
          },
        },
        {
          id: "machine-B",
          type: "machine",
          position: { x: 350, y: 150 },
          data: {
            name: "Lathe LX-2 (API Loaded)",
            status: "Needs Maintenance",
            healthPercentage: 30,
            lastReportDate: "2024-07-28 08:00 PM",
          },
        },
      ],
      edges: [
        {
          id: "eA-B",
          source: "machine-A",
          target: "machine-B",
          animated: true,
        },
      ],
    };
  }

  console.warn(`No mock data defined for lineId: ${lineId} in placeholder API.`);
  return { nodes: [], edges: [] }; // Return empty for unknown lines
};

// Simulate submitting a machine report
export const submitMachineReport = async (
  machineId: string,
  reportData: FormData | object // FormData for file uploads, object for structured data
): Promise<{ success: boolean; message: string }> => {
  const authToken = getAuthToken();
  console.log(
    `API CALL (Placeholder): Submitting report for machine ${machineId}`
  );
  console.log("Auth Token Used:", authToken ? "Token Present" : "No Token");
  if (reportData instanceof FormData) {
    console.log("Report Data (FormData entries):");
    for (let pair of reportData.entries()) {
      if (pair[1] instanceof File) {
        console.log(pair[0] + ": ", `File - ${pair[1].name}, Size - ${pair[1].size} bytes`);
      } else {
        console.log(pair[0] + ": ", pair[1]);
      }
    }
  } else {
    console.log("Report Data (Object):", reportData);
  }

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Simulate backend processing:
  // const response = await fetch(`/api/machines/${machineId}/reports`, {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${authToken}`,
  //     // 'Content-Type' will be set automatically by browser for FormData
  //     // For JSON: 'Content-Type': 'application/json',
  //   },
  //   body: reportData instanceof FormData ? reportData : JSON.stringify(reportData),
  // });
  // if (!response.ok) {
  //   const errorData = await response.json().catch(() => ({ message: 'Failed to submit report' }));
  //   return { success: false, message: errorData.message || 'Failed to submit report' };
  // }
  // const result = await response.json();
  // return { success: true, message: result.message || 'Report submitted successfully' };

  const isSuccess = Math.random() > 0.1; // 90% success rate for simulation
  if (isSuccess) {
    return {
      success: true,
      message: `Report for machine ${machineId} submitted successfully (simulated).`,
    };
  } else {
    return {
      success: false,
      message: `Failed to submit report for machine ${machineId} (simulated error).`,
    };
  }
};
