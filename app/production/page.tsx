import ProductionFlowchart from "@/components/production/production-flowchart";
import { ReactFlowProvider } from "@xyflow/react";

export default function ProductionPage() {
  return (
    <div className="flex h-full flex-col">
      <header className="border-b p-4">
        <h1 className="text-2xl font-bold">Production Flowchart</h1>
      </header>
      <div className="flex-1 overflow-hidden">
        <ReactFlowProvider>
          <ProductionFlowchart />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
