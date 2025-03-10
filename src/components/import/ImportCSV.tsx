
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileText, Check, AlertCircle } from "lucide-react";
import type { Client } from "@/types/client";

interface ImportResult {
  success: number;
  errors: number;
  errorMessages: string[];
}

export const ImportCSV = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [activeTab, setActiveTab] = useState<"clients" | "employees">("clients");

  const processClientCSV = async (text: string): Promise<ImportResult> => {
    const result: ImportResult = { success: 0, errors: 0, errorMessages: [] };
    const lines = text.split("\n");
    
    // Ignorar a primeira linha (cabeçalhos)
    const headers = lines[0].split(",").map(h => h.trim());
    
    const nameIndex = headers.indexOf("nome");
    const emailIndex = headers.indexOf("email");
    const phoneIndex = headers.indexOf("telefone");
    const typeIndex = headers.indexOf("tipo");
    const addressIndex = headers.indexOf("endereco");
    const dueDateIndex = headers.indexOf("vencimento");
    const paymentMethodIndex = headers.indexOf("metodo_pagamento");
    const companyNameIndex = headers.indexOf("empresa");
    const cnpjIndex = headers.indexOf("cnpj");
    const cpfIndex = headers.indexOf("cpf");
    
    // Verificar cabeçalhos necessários
    if (nameIndex === -1 || emailIndex === -1 || typeIndex === -1) {
      result.errors++;
      result.errorMessages.push("CSV deve conter colunas nome, email e tipo (pf ou pj)");
      return result;
    }

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(",").map(v => v.trim());
      
      try {
        const type = values[typeIndex].toLowerCase();
        if (type !== "pf" && type !== "pj") {
          throw new Error(`Tipo inválido na linha ${i}: ${values[typeIndex]}. Use 'pf' ou 'pj'`);
        }
        
        const client: any = {
          name: values[nameIndex],
          email: values[emailIndex],
          type: type,
          status: "active"
        };
        
        if (phoneIndex !== -1 && values[phoneIndex]) client.phone = values[phoneIndex];
        if (addressIndex !== -1 && values[addressIndex]) client.address = values[addressIndex];
        
        if (dueDateIndex !== -1 && values[dueDateIndex]) {
          // Formato esperado: DD
          const dueDay = parseInt(values[dueDateIndex]);
          if (isNaN(dueDay) || dueDay < 1 || dueDay > 31) {
            throw new Error(`Data de vencimento inválida na linha ${i}: ${values[dueDateIndex]}`);
          }
          
          // Converter para data completa (1º dia do mês seguinte)
          const today = new Date();
          const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
          client.due_date = nextMonth.toISOString().split('T')[0];
        }
        
        if (paymentMethodIndex !== -1 && values[paymentMethodIndex]) {
          const method = values[paymentMethodIndex].toLowerCase();
          if (["pix", "boleto", "credit_card"].includes(method)) {
            client.payment_method = method;
          } else {
            throw new Error(`Método de pagamento inválido na linha ${i}: ${values[paymentMethodIndex]}`);
          }
        }
        
        // Adicionar campos específicos baseados no tipo
        if (type === "pj") {
          if (companyNameIndex !== -1 && values[companyNameIndex]) client.company_name = values[companyNameIndex];
          if (cnpjIndex !== -1 && values[cnpjIndex]) client.cnpj = values[cnpjIndex];
        } else {
          if (cpfIndex !== -1 && values[cpfIndex]) client.cpf = values[cpfIndex];
        }
        
        // Inserir no banco de dados
        const { error } = await supabase.from("clients").insert([client]);
        
        if (error) throw error;
        
        result.success++;
      } catch (error) {
        console.error("Erro ao processar linha", i, error);
        result.errors++;
        result.errorMessages.push(`Linha ${i}: ${(error as Error).message}`);
      }
    }
    
    return result;
  };

  const processEmployeeCSV = async (text: string): Promise<ImportResult> => {
    const result: ImportResult = { success: 0, errors: 0, errorMessages: [] };
    const lines = text.split("\n");
    
    // Ignorar a primeira linha (cabeçalhos)
    const headers = lines[0].split(",").map(h => h.trim());
    
    const nameIndex = headers.indexOf("nome");
    const emailIndex = headers.indexOf("email");
    const phoneIndex = headers.indexOf("telefone");
    const typeIndex = headers.indexOf("tipo");
    const addressIndex = headers.indexOf("endereco");
    const positionIndex = headers.indexOf("cargo");
    const paymentMethodIndex = headers.indexOf("metodo_pagamento");
    const cnpjIndex = headers.indexOf("cnpj");
    const pixIndex = headers.indexOf("pix");
    
    // Verificar cabeçalhos necessários
    if (nameIndex === -1 || emailIndex === -1) {
      result.errors++;
      result.errorMessages.push("CSV deve conter colunas nome e email");
      return result;
    }

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(",").map(v => v.trim());
      
      try {
        const employee: any = {
          name: values[nameIndex],
          email: values[emailIndex],
          status: "active"
        };
        
        if (typeIndex !== -1 && values[typeIndex]) {
          const type = values[typeIndex].toLowerCase();
          if (type === "fixed" || type === "freelancer") {
            employee.type = type;
          } else {
            throw new Error(`Tipo inválido na linha ${i}: ${values[typeIndex]}. Use 'fixed' ou 'freelancer'`);
          }
        } else {
          employee.type = "fixed"; // Valor padrão
        }
        
        if (phoneIndex !== -1 && values[phoneIndex]) employee.phone = values[phoneIndex];
        if (addressIndex !== -1 && values[addressIndex]) employee.address = values[addressIndex];
        if (positionIndex !== -1 && values[positionIndex]) employee.position = values[positionIndex];
        if (paymentMethodIndex !== -1 && values[paymentMethodIndex]) employee.payment_method = values[paymentMethodIndex];
        if (cnpjIndex !== -1 && values[cnpjIndex]) employee.cnpj = values[cnpjIndex];
        if (pixIndex !== -1 && values[pixIndex]) employee.pix = values[pixIndex];
        
        // Inserir no banco de dados
        const { error } = await supabase.from("employees").insert([employee]);
        
        if (error) throw error;
        
        result.success++;
      } catch (error) {
        console.error("Erro ao processar linha", i, error);
        result.errors++;
        result.errorMessages.push(`Linha ${i}: ${(error as Error).message}`);
      }
    }
    
    return result;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsLoading(true);
    setImportResult(null);
    
    try {
      const text = await file.text();
      let result: ImportResult;
      
      if (activeTab === "clients") {
        result = await processClientCSV(text);
      } else {
        result = await processEmployeeCSV(text);
      }
      
      setImportResult(result);
      
      if (result.success > 0) {
        toast({
          title: "Importação concluída",
          description: `${result.success} registros importados com sucesso. ${result.errors} erros.`,
          variant: result.errors > 0 ? "destructive" : "default",
        });
      } else {
        toast({
          title: "Falha na importação",
          description: "Nenhum registro foi importado. Verifique os erros.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro na importação:", error);
      toast({
        title: "Erro na importação",
        description: `Ocorreu um erro: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      // Limpar o input de arquivo
      event.target.value = "";
    }
  };

  const downloadTemplate = (type: "clients" | "employees") => {
    let csvContent: string;
    
    if (type === "clients") {
      csvContent = "nome,email,telefone,tipo,endereco,vencimento,metodo_pagamento,empresa,cnpj,cpf\n";
      csvContent += "Empresa Exemplo,contato@exemplo.com,11999999999,pj,Rua Exemplo 123,15,pix,Empresa Exemplo LTDA,12345678000190,\n";
      csvContent += "Cliente Exemplo,cliente@exemplo.com,11988888888,pf,Av Exemplo 456,10,boleto,,,12345678900\n";
    } else {
      csvContent = "nome,email,telefone,tipo,endereco,cargo,metodo_pagamento,cnpj,pix\n";
      csvContent += "Funcionário Exemplo,funcionario@exemplo.com,11977777777,fixed,Rua Exemplo 789,Desenvolvedor,pix,,chave-pix-exemplo\n";
      csvContent += "Freelancer Exemplo,freelancer@exemplo.com,11966666666,freelancer,Av Exemplo 012,Designer,transferência,12345678000190,\n";
    }
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = type === "clients" ? "template_clientes.csv" : "template_funcionarios.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Importar CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Importar dados de CSV</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="clients" value={activeTab} onValueChange={(v) => setActiveTab(v as "clients" | "employees")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="clients">Clientes</TabsTrigger>
            <TabsTrigger value="employees">Funcionários</TabsTrigger>
          </TabsList>
          
          <TabsContent value="clients" className="space-y-4 mt-4">
            <div className="bg-muted/50 p-4 rounded-md">
              <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4" />
                Formato esperado
              </h3>
              <p className="text-xs text-muted-foreground">
                CSV com cabeçalho: nome, email, telefone, tipo (pf/pj), endereco, vencimento, 
                metodo_pagamento, empresa, cnpj, cpf
              </p>
              <Button 
                variant="link" 
                size="sm" 
                className="px-0 text-xs mt-2"
                onClick={() => downloadTemplate("clients")}
              >
                Baixar modelo
              </Button>
            </div>
            
            <div className="flex justify-center">
              <label className="cursor-pointer">
                <div className="flex flex-col items-center gap-2 p-6 border-2 border-dashed rounded-lg hover:bg-muted/50 transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm font-medium">Selecione ou arraste o arquivo CSV</span>
                  <span className="text-xs text-muted-foreground">CSV com até 1000 clientes</span>
                  <input 
                    type="file" 
                    accept=".csv" 
                    className="hidden" 
                    onChange={handleFileUpload}
                    disabled={isLoading}
                  />
                </div>
              </label>
            </div>
          </TabsContent>
          
          <TabsContent value="employees" className="space-y-4 mt-4">
            <div className="bg-muted/50 p-4 rounded-md">
              <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4" />
                Formato esperado
              </h3>
              <p className="text-xs text-muted-foreground">
                CSV com cabeçalho: nome, email, telefone, tipo (fixed/freelancer), endereco, 
                cargo, metodo_pagamento, cnpj, pix
              </p>
              <Button 
                variant="link" 
                size="sm" 
                className="px-0 text-xs mt-2"
                onClick={() => downloadTemplate("employees")}
              >
                Baixar modelo
              </Button>
            </div>
            
            <div className="flex justify-center">
              <label className="cursor-pointer">
                <div className="flex flex-col items-center gap-2 p-6 border-2 border-dashed rounded-lg hover:bg-muted/50 transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm font-medium">Selecione ou arraste o arquivo CSV</span>
                  <span className="text-xs text-muted-foreground">CSV com até 1000 funcionários</span>
                  <input 
                    type="file" 
                    accept=".csv" 
                    className="hidden" 
                    onChange={handleFileUpload}
                    disabled={isLoading}
                  />
                </div>
              </label>
            </div>
          </TabsContent>
        </Tabs>
        
        {importResult && (
          <div className={`p-4 rounded-md ${importResult.errors > 0 ? 'bg-destructive/10' : 'bg-green-50 dark:bg-green-950/20'}`}>
            <h3 className={`text-sm font-medium flex items-center gap-2 mb-2 ${importResult.errors > 0 ? 'text-destructive' : 'text-green-600 dark:text-green-400'}`}>
              {importResult.errors > 0 ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Resultado da importação
            </h3>
            <p className="text-sm">
              <span className="text-green-600 dark:text-green-400">{importResult.success} registros importados com sucesso.</span>
              {importResult.errors > 0 && (
                <span className="text-destructive ml-2">{importResult.errors} erros.</span>
              )}
            </p>
            
            {importResult.errors > 0 && (
              <div className="mt-2 max-h-28 overflow-y-auto text-xs text-destructive space-y-1">
                {importResult.errorMessages.map((message, index) => (
                  <p key={index}>{message}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
