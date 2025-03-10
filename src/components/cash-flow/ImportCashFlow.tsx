
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, AlertCircle, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CashFlow, validateCashFlowType } from "@/types/cashflow";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ImportCashFlowProps {
  onSuccess: () => void;
}

export const ImportCashFlow = ({ onSuccess }: ImportCashFlowProps) => {
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [successCount, setSuccessCount] = useState(0);
  const { toast } = useToast();

  const downloadTemplate = () => {
    const headers = "date,type,category,description,amount\n";
    const exampleRows = [
      "2025-03-15,income,payment,Client Payment,3500.00",
      "2025-03-10,expense,supplier,Office Supplies,150.75",
      "2025-03-05,income,other_income,Interest,45.20",
      "2025-03-01,expense,employee,Salary Payment,2000.00"
    ].join("\n");
    
    const csvContent = headers + exampleRows;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "cash_flow_import_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const validateRow = (row: any, rowIndex: number): { valid: boolean; error?: string; data?: Partial<CashFlow> } => {
    // Check required fields
    const requiredFields = ["date", "type", "category", "description", "amount"];
    for (const field of requiredFields) {
      if (!row[field] || row[field].trim() === "") {
        return { valid: false, error: `Row ${rowIndex + 1}: Missing ${field}` };
      }
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(row.date)) {
      return { valid: false, error: `Row ${rowIndex + 1}: Invalid date format. Use YYYY-MM-DD` };
    }

    // Validate type
    if (row.type !== "income" && row.type !== "expense") {
      return { valid: false, error: `Row ${rowIndex + 1}: Type must be 'income' or 'expense'` };
    }

    // Validate amount
    const amount = parseFloat(row.amount);
    if (isNaN(amount) || amount <= 0) {
      return { valid: false, error: `Row ${rowIndex + 1}: Amount must be a positive number` };
    }

    // Return validated data
    return {
      valid: true,
      data: {
        date: row.date,
        type: row.type as "income" | "expense",
        category: row.category,
        description: row.description,
        amount
      }
    };
  };

  const processFile = async (file: File) => {
    setProcessing(true);
    setErrors([]);
    setSuccessCount(0);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split("\n");
        const headers = lines[0].toLowerCase().split(",");
        
        const parsedRows: Partial<CashFlow>[] = [];
        const validationErrors: string[] = [];

        // Process each row
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values = line.split(",");
          if (values.length !== headers.length) {
            validationErrors.push(`Row ${i}: Column count mismatch`);
            continue;
          }

          const row: any = {};
          headers.forEach((header, index) => {
            row[header.trim()] = values[index].trim();
          });

          const validation = validateRow(row, i - 1);
          if (validation.valid && validation.data) {
            parsedRows.push(validation.data);
          } else if (validation.error) {
            validationErrors.push(validation.error);
          }
        }

        // If there are validation errors, show them and stop processing
        if (validationErrors.length > 0) {
          setErrors(validationErrors);
          setProcessing(false);
          return;
        }

        // Insert valid rows into database
        const { data, error } = await supabase
          .from("cash_flow")
          .insert(parsedRows.map(row => ({
            date: row.date,
            type: row.type,
            category: row.category,
            description: row.description,
            amount: row.amount
          })));

        if (error) {
          console.error("Error inserting cash flow entries:", error);
          setErrors([`Database error: ${error.message}`]);
        } else {
          setSuccessCount(parsedRows.length);
          toast({
            title: "Importação concluída",
            description: `${parsedRows.length} movimentações importadas com sucesso.`,
          });
          setTimeout(() => {
            setOpen(false);
            onSuccess();
          }, 2000);
        }
      } catch (error) {
        console.error("Error processing CSV:", error);
        setErrors(["Failed to process the CSV file. Please check the format."]);
      } finally {
        setProcessing(false);
      }
    };

    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === "text/csv" || file.name.endsWith(".csv")) {
        processFile(file);
      } else {
        setErrors(["Por favor, envie um arquivo CSV válido."]);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        onClick={() => setOpen(true)} 
        className="gap-2"
      >
        <Upload className="h-4 w-4" />
        Importar CSV
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Fluxo de Caixa</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <Button 
              variant="outline" 
              onClick={downloadTemplate} 
              className="w-full gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Baixar Template CSV
            </Button>

            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center ${
                dragging ? "border-primary bg-primary/10" : "border-muted-foreground/25"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Arraste e solte seu arquivo CSV aqui ou
                </p>
                <label
                  htmlFor="csv-upload"
                  className="cursor-pointer text-sm font-medium text-primary hover:underline"
                >
                  clique para escolher
                  <input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    className="sr-only"
                    onChange={handleFileChange}
                    disabled={processing}
                  />
                </label>
              </div>
            </div>

            {processing && (
              <div className="text-center py-2">
                <p className="text-sm text-muted-foreground">Processando arquivo...</p>
              </div>
            )}

            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="text-sm font-medium">Erros encontrados:</div>
                  <ul className="text-xs mt-2 list-disc pl-5">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {successCount > 0 && (
              <Alert className="bg-green-50 text-green-800 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  {successCount} registros importados com sucesso!
                </AlertDescription>
              </Alert>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
