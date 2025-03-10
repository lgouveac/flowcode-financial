
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, AlertCircle, FileSpreadsheet, CheckCircle2, Edit3 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CashFlow, validateCashFlowType } from "@/types/cashflow";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ImportCashFlowProps {
  onSuccess: () => void;
}

interface CashFlowPreviewItem {
  date: string;
  type: "income" | "expense";
  category: string;
  description: string;
  amount: number;
  valid: boolean;
  error?: string;
}

export const ImportCashFlow = ({ onSuccess }: ImportCashFlowProps) => {
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [successCount, setSuccessCount] = useState(0);
  const [previewData, setPreviewData] = useState<CashFlowPreviewItem[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  const downloadTemplate = () => {
    const headers = "date,type,category,description,amount\n";
    const exampleRows = [
      "2025-03-15,income,payment,Pagamento Cliente,3500.00",
      "2025-03-10,expense,supplier,Material de Escritório,-150.75",
      "2025-03-05,income,other_income,Rendimentos,45.20",
      "2025-03-01,expense,employee,Pagamento Funcionário,-2000.00"
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

  const validateRow = (row: any, rowIndex: number): CashFlowPreviewItem => {
    // Criar item de preview com valores padrão
    const previewItem: CashFlowPreviewItem = {
      date: row.date || "",
      type: "income",
      category: row.category || "",
      description: row.description || "",
      amount: 0,
      valid: true
    };

    // Verificar campos obrigatórios
    const requiredFields = ["date", "category", "description", "amount"];
    for (const field of requiredFields) {
      if (!row[field] || row[field].trim() === "") {
        previewItem.valid = false;
        previewItem.error = `Campo ${field} é obrigatório`;
        return previewItem;
      }
    }

    // Validar formato de data
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(row.date)) {
      previewItem.valid = false;
      previewItem.error = `Formato de data inválido. Use YYYY-MM-DD`;
      return previewItem;
    }

    // Validar tipo
    if (row.type) {
      if (row.type !== "income" && row.type !== "expense") {
        previewItem.valid = false;
        previewItem.error = `Tipo deve ser 'income' ou 'expense'`;
        return previewItem;
      }
      previewItem.type = row.type;
    } else {
      // Se não tiver tipo, determina pelo valor
      const amount = parseFloat(row.amount);
      previewItem.type = amount >= 0 ? "income" : "expense";
    }

    // Validar e ajustar valor
    let amount = parseFloat(row.amount);
    if (isNaN(amount)) {
      previewItem.valid = false;
      previewItem.error = `Valor deve ser um número`;
      return previewItem;
    }

    // Ajustar valor negativo para expense
    if (amount < 0 && previewItem.type === "expense") {
      amount = Math.abs(amount);
    }
    
    previewItem.amount = amount;

    return previewItem;
  };

  const processFile = async (file: File) => {
    setProcessing(true);
    setErrors([]);
    setPreviewData([]);
    setSuccessCount(0);
    setShowPreview(false);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split("\n");
        const headers = lines[0].toLowerCase().split(",").map(h => h.trim());
        
        const parsedPreview: CashFlowPreviewItem[] = [];
        const validationErrors: string[] = [];

        // Processar cada linha
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values = line.split(",");
          if (values.length !== headers.length) {
            validationErrors.push(`Linha ${i}: Número de colunas não corresponde`);
            continue;
          }

          const row: any = {};
          headers.forEach((header, index) => {
            row[header.trim()] = values[index].trim();
          });

          const previewItem = validateRow(row, i - 1);
          if (!previewItem.valid && previewItem.error) {
            validationErrors.push(`Linha ${i}: ${previewItem.error}`);
          }
          
          parsedPreview.push(previewItem);
        }

        setPreviewData(parsedPreview);
        setErrors(validationErrors);
        setShowPreview(parsedPreview.length > 0);
        
      } catch (error) {
        console.error("Erro ao processar CSV:", error);
        setErrors(["Falha ao processar o arquivo CSV. Verifique o formato."]);
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

  const handleUpdatePreviewItem = (index: number, field: keyof CashFlowPreviewItem, value: any) => {
    const updatedData = [...previewData];
    updatedData[index] = {
      ...updatedData[index],
      [field]: value,
      valid: true, // Resetar o estado de validação ao editar
      error: undefined
    };
    setPreviewData(updatedData);
  };

  const handleSaveImport = async () => {
    setProcessing(true);
    setErrors([]);
    
    try {
      // Filtrar apenas itens válidos
      const validItems = previewData.filter(item => item.valid);
      
      if (validItems.length === 0) {
        setErrors(["Nenhum item válido para importar"]);
        setProcessing(false);
        return;
      }

      // Preparar dados para inserção
      const cashFlowItems = validItems.map(item => ({
        date: item.date,
        type: item.type,
        category: item.category,
        description: item.description,
        amount: item.amount
      }));

      const { data, error } = await supabase
        .from("cash_flow")
        .insert(cashFlowItems);

      if (error) {
        console.error("Erro ao inserir movimentações:", error);
        setErrors([`Erro no banco de dados: ${error.message}`]);
      } else {
        setSuccessCount(cashFlowItems.length);
        toast({
          title: "Importação concluída",
          description: `${cashFlowItems.length} movimentações importadas com sucesso.`,
        });
        setTimeout(() => {
          setOpen(false);
          setPreviewData([]);
          setShowPreview(false);
          onSuccess();
        }, 2000);
      }
    } catch (error) {
      console.error("Erro ao salvar importação:", error);
      setErrors(["Ocorreu um erro ao salvar as movimentações."]);
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelPreview = () => {
    setShowPreview(false);
    setPreviewData([]);
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
        <DialogContent className={showPreview ? "sm:max-w-4xl" : "sm:max-w-md"}>
          <DialogHeader>
            <DialogTitle>Importar Fluxo de Caixa</DialogTitle>
          </DialogHeader>

          {!showPreview ? (
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
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Edit3 className="h-4 w-4" />
                  Visualização prévia
                </h3>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCancelPreview} disabled={processing}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveImport} disabled={processing || previewData.length === 0}>
                    {processing ? "Processando..." : "Importar dados"}
                  </Button>
                </div>
              </div>

              <div className="border rounded-md max-h-[400px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((item, index) => (
                      <TableRow key={index} className={!item.valid ? "bg-red-50 dark:bg-red-950/20" : ""}>
                        <TableCell>
                          <Input
                            value={item.date}
                            onChange={(e) => handleUpdatePreviewItem(index, "date", e.target.value)}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.type}
                            onValueChange={(value) => handleUpdatePreviewItem(index, "type", value)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue>
                                {item.type === "income" ? "Entrada" : "Saída"}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="income">Entrada</SelectItem>
                              <SelectItem value="expense">Saída</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.category}
                            onChange={(e) => handleUpdatePreviewItem(index, "category", e.target.value)}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.description}
                            onChange={(e) => handleUpdatePreviewItem(index, "description", e.target.value)}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.amount.toString()}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              handleUpdatePreviewItem(index, "amount", isNaN(value) ? 0 : value);
                            }}
                            type="number"
                            className="h-8"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

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
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
