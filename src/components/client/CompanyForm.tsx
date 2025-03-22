
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { NewClient } from "@/types/client";

interface CompanyFormProps {
  formData: NewClient;
  setFormData: (data: NewClient) => void;
}

export const CompanyForm = ({ formData, setFormData }: CompanyFormProps) => {
  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor="company_name">Razão Social da Empresa</Label>
        <Input
          id="company_name"
          value={formData.company_name}
          onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="cnpj">CNPJ</Label>
          <Input
            id="cnpj"
            value={formData.cnpj}
            onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
            required
            placeholder="00.000.000/0001-00"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="partner_name">Nome completo do sócio</Label>
          <Input
            id="partner_name"
            value={formData.partner_name}
            onChange={(e) => setFormData({ ...formData, partner_name: e.target.value })}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="partner_cpf">CPF do sócio</Label>
          <Input
            id="partner_cpf"
            value={formData.partner_cpf}
            onChange={(e) => setFormData({ ...formData, partner_cpf: e.target.value })}
            required
            placeholder="000.000.000-00"
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="responsible_name">Nome do responsável</Label>
        <Input
          id="responsible_name"
          value={formData.responsible_name || ''}
          onChange={(e) => setFormData({ ...formData, responsible_name: e.target.value })}
          placeholder="Se for diferente do sócio"
        />
      </div>
    </>
  );
};
