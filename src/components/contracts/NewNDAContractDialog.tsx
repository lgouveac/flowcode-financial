import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useContracts } from "@/hooks/useContracts";
import { useToast } from "@/hooks/use-toast";
import { Shield } from "lucide-react";

interface NewNDAContractDialogProps {
  open: boolean;
  onClose: () => void;
  onContractCreated?: (contract: any) => void;
}

export function NewNDAContractDialog({ open, onClose, onContractCreated }: NewNDAContractDialogProps) {
  const { addContract } = useContracts();
  const [loading, setLoading] = useState(false);
  const [selectedPersonType, setSelectedPersonType] = useState<"client" | "employee" | "">("");
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const { toast } = useToast();
  const isSubmittingRef = useRef(false);

  // Buscar clientes
  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name")
        .eq("status", "active")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  // Buscar funcionários
  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, name")
        .eq("status", "active")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Proteção contra duplicação - verificar se já está processando
    if (isSubmittingRef.current || loading) {
      console.warn("Tentativa de submit duplicado bloqueada");
      return;
    }
    
    if (!selectedPersonType || !selectedPersonId) {
      toast({
        title: "Erro",
        description: "Por favor, selecione o tipo e a pessoa para o contrato NDA.",
        variant: "destructive",
      });
      return;
    }

    // Marcar como processando
    isSubmittingRef.current = true;
    setLoading(true);
    try {
      // Buscar IP atual para assinatura automática FlowCode
      let flowcodeIP = '';
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        flowcodeIP = ipData.ip;
      } catch (error) {
        console.warn('Não foi possível obter IP para assinatura FlowCode:', error);
        flowcodeIP = 'IP não disponível';
      }

      const selectedPerson = selectedPersonType === "client" 
        ? clients.find(c => c.id === selectedPersonId)
        : employees.find(e => e.id === selectedPersonId);

      const contractData = {
        client_id: selectedPersonType === "client" ? selectedPersonId : undefined,
        // Por enquanto, para funcionários, vamos salvar o ID no campo obs
        scope: `Acordo de Confidencialidade (NDA) - ${selectedPerson?.name}`,
        obs: selectedPersonType === "employee" ? `Funcionário ID: ${selectedPersonId} - ${selectedPerson?.name}` : undefined,
        total_value: 0, // NDA não tem valor
        installments: 1,
        installment_value: 0,
        status: "active",
        contract_type: "NDA", // Definir como NDA
        contractor_type: "individual",
        // Assinatura automática da FlowCode na criação
        data_assinatura_flowcode: new Date().toISOString(),
        ip_flowcode: flowcodeIP,
        assinante_flowcode: 'Lucas Gouvea Carmo',
      };

      const createdContract = await addContract(contractData);
      
      // Chama o callback para executar o webhook se necessário
      if (onContractCreated && createdContract) {
        onContractCreated(createdContract);
      }
      
      // Resetar formulário
      setSelectedPersonType("");
      setSelectedPersonId("");
      
      toast({
        title: "Contrato NDA criado!",
        description: `NDA criado com sucesso para ${selectedPerson?.name}.`,
      });
      
      onClose();
    } catch (error) {
      console.error("Error creating NDA contract:", error);
      toast({
        title: "Erro ao criar NDA",
        description: "Não foi possível criar o contrato NDA.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Novo Contrato NDA
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="personType">Tipo de Pessoa *</Label>
            <Select value={selectedPersonType} onValueChange={(value: "client" | "employee") => {
              setSelectedPersonType(value);
              setSelectedPersonId(""); // Resetar seleção quando mudar tipo
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client">Cliente</SelectItem>
                <SelectItem value="employee">Funcionário</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedPersonType && (
            <div className="space-y-2">
              <Label htmlFor="person">
                {selectedPersonType === "client" ? "Cliente" : "Funcionário"} *
              </Label>
              <Select value={selectedPersonId} onValueChange={setSelectedPersonId}>
                <SelectTrigger>
                  <SelectValue placeholder={`Selecione o ${selectedPersonType === "client" ? "cliente" : "funcionário"}`} />
                </SelectTrigger>
                <SelectContent>
                  {(selectedPersonType === "client" ? clients : employees).map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !selectedPersonType || !selectedPersonId}>
              {loading ? "Criando..." : "Criar NDA"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}