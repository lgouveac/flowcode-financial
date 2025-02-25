
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { NewClient } from "@/types/client";
import { ClientTypeSelector } from "./ClientTypeSelector";
import { PersonalForm } from "./PersonalForm";
import { CompanyForm } from "./CompanyForm";
import { CommonFields } from "./CommonFields";

interface NewClientFormProps {
  onSubmit: (client: NewClient) => void;
  onClose: () => void;
}

export const NewClientForm = ({ onSubmit, onClose }: NewClientFormProps) => {
  const [clientType, setClientType] = useState<"pf" | "pj">("pj");
  const [formData, setFormData] = useState<NewClient>({
    name: "",
    email: "",
    phone: "",
    type: "pj",
    company_name: "",
    cnpj: "",
    partner_name: "",
    partner_cpf: "",
    address: "",
    due_date: "",
    payment_method: "pix",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalFormData = {
      ...formData,
      name: clientType === 'pj' ? formData.company_name : formData.name,
    };
    onSubmit(finalFormData);
    onClose();
  };

  const handleTypeChange = (value: "pf" | "pj") => {
    setClientType(value);
    setFormData({ ...formData, type: value });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div className="space-y-4">
        <ClientTypeSelector clientType={clientType} onTypeChange={handleTypeChange} />
        {clientType === "pj" ? (
          <CompanyForm formData={formData} setFormData={setFormData} />
        ) : (
          <PersonalForm formData={formData} setFormData={setFormData} />
        )}
        <CommonFields 
          formData={formData} 
          setFormData={setFormData}
          clientType={clientType}
        />
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">
          Salvar
        </Button>
      </div>
    </form>
  );
};
