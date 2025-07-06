"use client";

import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { UploadCloud, FileText, AlertTriangle } from "lucide-react";
import { submitMachineReport } from "./production-api-service"; // Import the placeholder API

interface FileReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  machineNodeId: string | null;
  machineName?: string;
  // onUploadReport: (nodeId: string, file: File) => Promise<void>; // Future implementation
  // onFillReport: (nodeId: string) => void; // Future implementation
}

const FileReportDialog: React.FC<FileReportDialogProps> = ({
  isOpen,
  onClose,
  machineNodeId,
  machineName,
}) => {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUploadClick = () => {
    // Trigger hidden file input
    fileInputRef.current?.click();
  };

  const handleSimulateUpload = async () => {
    if (!selectedFile || !machineNodeId) {
      toast({
        variant: "destructive",
        title: "Upload Error",
        description: "No file selected or machine ID missing.",
      });
      return;
    }

    // Simulate API call / RAG workflow
    toast({
      title: "Processing Report...",
      description: `Uploading "${selectedFile.name}" for ${machineName || `Machine ID: ${machineNodeId}`}.`,
    });

    // Simulate delay
    // await new Promise(resolve => setTimeout(resolve, 2000)); // Delay now handled in placeholder API

    const formData = new FormData();
    formData.append("reportFile", selectedFile);
    formData.append("machineName", machineName || "Unknown Machine");
    formData.append("submissionTimestamp", new Date().toISOString());

    try {
      // const result = await onUploadReport(machineNodeId, selectedFile); // Future actual call
      const result = await submitMachineReport(machineNodeId, formData); // Using placeholder

      if (result.success) {
        toast({
          variant: "default",
          title: "Report Uploaded Successfully",
          description: result.message || `"${selectedFile.name}" has been processed for ${machineName}.`,
          className: "bg-green-500 text-white dark:bg-green-700",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: result.message || `Could not process "${selectedFile.name}". Please try again.`,
        });
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      toast({
        variant: "destructive",
        title: "Upload Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setSelectedFile(null); // Reset file input
      onClose(); // Close dialog
    }
  };

  const handleFillReport = () => {
    if (!machineNodeId) return;
    toast({
      variant: "destructive", // Or "warning" if more appropriate
      title: "Feature Not Available",
      description: (
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 text-yellow-400" />
          <span>Report filling feature is not yet set up for {machineName}.</span>
        </div>
      ),
    });
    // onClose(); // Optionally close dialog after toast
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setSelectedFile(null); // Reset selected file when dialog is closed
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[480px] dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center dark:text-gray-100">
            <FileText className="mr-2 h-5 w-5" />
            File Maintenance Report for {machineName || "Machine"}
          </DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            Choose how to submit the maintenance report for this machine.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-6">
          <div className="space-y-2">
            <h4 className="font-medium text-sm dark:text-gray-200">Option 1: Upload Report File</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Upload a PDF, DOCX, or Excel file containing the report details.
            </p>
            <Button variant="outline" onClick={handleUploadClick} className="w-full dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
              <UploadCloud className="mr-2 h-4 w-4" />
              {selectedFile ? `Selected: ${selectedFile.name}` : "Choose File to Upload"}
            </Button>
            <Input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            />
            {selectedFile && (
              <div className="mt-2 text-center">
                <Button onClick={handleSimulateUpload} className="w-full sm:w-auto">
                  Upload "{selectedFile.name}"
                </Button>
              </div>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">
                Or
              </span>
            </div>
          </div>

          <div className="space-y-2">
             <h4 className="font-medium text-sm dark:text-gray-200">Option 2: Fill Report Manually</h4>
             <p className="text-xs text-gray-500 dark:text-gray-400">
              Enter the report details directly into a form (feature coming soon).
            </p>
            <Button variant="outline" onClick={handleFillReport} className="w-full dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
              <FileText className="mr-2 h-4 w-4" />
              Fill Report Form
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => handleDialogClose(false)} className="dark:text-gray-400 dark:hover:bg-gray-700">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FileReportDialog;
