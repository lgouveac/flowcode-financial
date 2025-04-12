
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function PublicEmployeeForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/thank-you";
  
  const [formData, setFormData] = useState({
    cnpj: "",
    pix: "",
    address: "",
    fullName: "",
    email: "",
    phone: "",
    position: "",
    type: "fixed" as "fixed" | "freelancer"
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("employees")
        .insert([
          {
            name: formData.fullName,
            email: formData.email,
            type: formData.type,
            cnpj: formData.cnpj,
            pix: formData.pix,
            address: formData.address,
            position: formData.position,
            phone: formData.phone,
          }
        ]);

      if (error) throw error;

      toast({
        title: "Cadastro realizado",
        description: "Seus dados foram enviados com sucesso.",
      });

      // Redirect to thank you page or specified redirect URL
      navigate(redirectUrl);
      
    } catch (error: any) {
      console.error("Error submitting form:", error);
      toast({
        title: "Erro ao enviar formulário",
        description: error.message || "Ocorreu um erro ao enviar o formulário. Por favor, tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <div className="w-full max-w-3xl mx-auto my-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-card shadow rounded-lg p-6 sm:p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Formulário de Cadastro de Colaborador</h1>
            <p className="text-muted-foreground mt-2">Por favor, preencha os dados abaixo para completar seu cadastro.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  placeholder="00.000.000/0001-00"
                  value={formData.cnpj}
                  onChange={(e) => handleInputChange("cnpj", e.target.value)}
                  required
                  className="bg-background"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="pix">Chave PIX</Label>
                <Input
                  id="pix"
                  placeholder="CPF, CNPJ, E-mail ou Celular"
                  value={formData.pix}
                  onChange={(e) => handleInputChange("pix", e.target.value)}
                  required
                  className="bg-background"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="address">Endereço Completo</Label>
                <Input
                  id="address"
                  placeholder="Rua, número, complemento, bairro, cidade - UF"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  required
                  className="bg-background"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  required
                  className="bg-background"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                  className="bg-background"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Celular</Label>
                <Input
                  id="phone"
                  placeholder="(00) 00000-0000"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  required
                  className="bg-background"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="position">Cargo</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => handleInputChange("position", e.target.value)}
                  required
                  className="bg-background"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="type">Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "fixed" | "freelancer") => handleInputChange("type", value)}
                >
                  <SelectTrigger id="type" className="bg-background">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Funcionário Fixo</SelectItem>
                    <SelectItem value="freelancer">Freelancer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-primary"
              >
                {isSubmitting ? "Enviando..." : "Enviar Cadastro"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
