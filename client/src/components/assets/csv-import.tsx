
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  UploadIcon,
  FileTextIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  XIcon,
  FileDownIcon,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import {
  parseCSV,
  convertCSVToAssets,
  CSVAsset,
  downloadCSV,
} from "@/lib/csv-import";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Progress
} from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function CSVImport() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedAssets, setParsedAssets] = useState<CSVAsset[] | null>(null);
  const [importStatus, setImportStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [importProgress, setImportProgress] = useState(0);
  const [importSummary, setImportSummary] = useState<{
    total: number;
    successful: number;
    updated: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      setSelectedFile(null);
      setParsedAssets(null);
      setParseError(null);
      return;
    }

    const file = e.target.files[0];
    setSelectedFile(file);
    setParseError(null);
    setParsedAssets(null);
    setImportSummary(null);
    setImportProgress(0);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csvContent = e.target?.result as string;
        const assets = parseCSV(csvContent);
        setParsedAssets(assets);
        toast({
          title: "File parsed successfully",
          description: `Found ${assets.length} assets ready for import.`,
        });
      } catch (error) {
        console.error("CSV parse error:", error);
        setParseError((error as Error).message);
        toast({
          title: "Parse failed",
          description: (error as Error).message,
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!parsedAssets) return;

    try {
      const assetsToImport = convertCSVToAssets(parsedAssets);
      if (!Array.isArray(assetsToImport) || assetsToImport.length === 0) {
        toast({
          title: "Import failed",
          description: "No valid assets found to import.",
          variant: "destructive",
        });
        return;
      }

      importMutation.mutate(assetsToImport);
    } catch (error) {
      toast({
        title: "Import failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const importMutation = useMutation({
    mutationFn: async (assets: any[]) => {
      setImportStatus("uploading");
      setImportProgress(25);

      const response = await fetch("/api/assets/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ assets }),
      });

      setImportProgress(75);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Import failed");
      }

      const data = await response.json();
      setImportProgress(100);
      return data;
    },
    onSuccess: (data) => {
      setImportStatus("success");
      setImportSummary(data);
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });

      if (data.failed > 0) {
        toast({
          title: "Import completed with errors",
          description: `${data.successful} assets created, ${data.updated || 0} assets updated, ${data.failed} failed.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Import successful",
          description: `${data.successful} assets created, ${data.updated || 0} assets updated successfully.`,
        });
      }
    },
    onError: (error) => {
      setImportStatus("error");
      toast({
        title: "Import failed",
        description: (error as Error).message || "Failed to import assets",
        variant: "destructive",
      });
    },
  });

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        assetTag: "SRPH-LAP-001",
        name: "Sample Laptop",
        category: "Laptop",
        status: "available",
        serialNumber: "SN123456789",
        model: "ThinkPad X1 Carbon",
        purchaseDate: "2023-01-15",
        manufacturer: "Lenovo",
        purchaseCost: "1200.00",
        location: "Head Office",
        knoxId: "KNOX001",
        ipAddress: "192.168.1.100",
        osType: "Windows 11",
        department: "IT Department",
      },
      {
        assetTag: "SRPH-DES-001",
        name: "Sample Desktop",
        category: "Desktop",
        status: "deployed",
        serialNumber: "SN987654321",
        model: "OptiPlex 7090",
        purchaseDate: "2023-02-10",
        manufacturer: "Dell",
        purchaseCost: "800.00",
        location: "Branch Office",
        knoxId: "KNOX002",
        ipAddress: "192.168.1.101",
        osType: "Windows 10",
        department: "Finance Department",
      },
    ];

    const csvContent = [
      "assetTag,name,category,status,serialNumber,model,purchaseDate,manufacturer,purchaseCost,location,knoxId,ipAddress,osType,department",
      ...templateData.map(row => 
        `${row.assetTag},"${row.name}",${row.category},${row.status},${row.serialNumber},"${row.model}",${row.purchaseDate},"${row.manufacturer}",${row.purchaseCost},"${row.location}",${row.knoxId},${row.ipAddress},"${row.osType}","${row.department}"`
      )
    ].join('\n');

    downloadCSV(csvContent, 'asset-import-template.csv');

    toast({
      title: "Template Downloaded",
      description: "Enhanced asset import template has been downloaded successfully."
    });
  };

  const resetForm = () => {
    setSelectedFile(null);
    setParsedAssets(null);
    setParseError(null);
    setImportSummary(null);
    setImportProgress(0);
    setImportStatus("idle");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Import Assets from CSV</CardTitle>
        <CardDescription>
          Upload a CSV file with asset data to bulk import assets.
          <br />
          <strong>Required columns:</strong> assetTag, name, serialNumber
          <br />
          <strong>Optional columns:</strong> category, status, model, purchaseDate, manufacturer, purchaseCost, location, knoxId, ipAddress, osType, department
        </CardDescription>
      </CardHeader>
      <CardContent>
        {parseError && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangleIcon className="h-4 w-4" />
            <AlertTitle>Parse Error</AlertTitle>
            <AlertDescription>{parseError}</AlertDescription>
          </Alert>
        )}

        {importSummary && (
          <Alert variant={importSummary.failed > 0 ? "destructive" : "default"} className="mb-4">
            <CheckCircleIcon className="h-4 w-4" />
            <AlertTitle>Import Summary</AlertTitle>
            <AlertDescription>
              <div className="space-y-1">
                <p>Total: {importSummary.total}, Created: {importSummary.successful}, Updated: {importSummary.updated || 0}, Failed: {importSummary.failed}</p>
                {importSummary.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium">Errors:</p>
                    <ul className="list-disc pl-4 text-sm">
                      {importSummary.errors.slice(0, 5).map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                      {importSummary.errors.length > 5 && (
                        <li>... and {importSummary.errors.length - 5} more errors</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* File Selection */}
          <div className="flex items-center gap-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
              disabled={importStatus === "uploading"}
            >
              <UploadIcon className="mr-2 h-4 w-4" />
              Select CSV File
            </Button>

            <Button 
              variant="outline" 
              onClick={handleDownloadTemplate}
            >
              <FileDownIcon className="mr-2 h-4 w-4" />
              Download Template
            </Button>

            {selectedFile && (
              <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded border">
                <FileTextIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm truncate max-w-[250px]">
                  {selectedFile.name}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={resetForm}
                  disabled={importStatus === "uploading"}
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {importStatus === "uploading" && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Importing assets...</span>
                <span>{importProgress}%</span>
              </div>
              <Progress value={importProgress} className="w-full" />
            </div>
          )}

          {/* Preview Table */}
          {parsedAssets && parsedAssets.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-medium">Preview ({parsedAssets.length} assets)</h3>
              <div className="border rounded-lg max-h-60 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Knox ID</TableHead>
                      <TableHead>Serial Number</TableHead>
                      <TableHead>Asset Tag</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedAssets.slice(0, 5).map((asset, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-sm">{asset.knoxId}</TableCell>
                        <TableCell className="font-mono text-sm">{asset.serialNumber}</TableCell>
                        <TableCell className="font-mono text-sm">{asset.assetTag || 'Auto-generated'}</TableCell>
                        <TableCell>{asset.name || 'Auto-generated'}</TableCell>
                        <TableCell>{asset.category || 'Laptop'}</TableCell>
                        <TableCell className="font-mono text-sm">{asset.ipAddress || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {parsedAssets.length > 5 && (
                  <div className="p-2 text-center text-sm text-gray-500 border-t">
                    ... and {parsedAssets.length - 5} more assets
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={resetForm}
              disabled={importStatus === "uploading"}
            >
              Reset
            </Button>
            <Button
              onClick={handleImport}
              disabled={
                importStatus === "uploading" ||
                importStatus === "success" ||
                !parsedAssets ||
                parsedAssets.length === 0
              }
            >
              {importStatus === "uploading" ? "Importing..." : `Import ${parsedAssets?.length || 0} Assets`}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
