
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { NewClient } from "@/types/client";

interface CompanyFormProps {
  formData: NewClient;
  setFormData: (data: NewClient) => void;
}

export const CompanyForm = ({ formData, setFormData }: CompanyFormProps) => {
  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor="company_name" className="text-sm font-medium">Razão Social</Label>
        <Input
          id="company_name"
          value={formData.company_name}
          onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
          required
          placeholder="Nome da empresa"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="trade_name" className="text-sm font-medium">Nome Fantasia</Label>
        <Input
          id="trade_name"
          value={formData.trade_name || ''}
          onChange={(e) => setFormData({ ...formData, trade_name: e.target.value })}
          placeholder="Nome fantasia da empresa"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="cnpj" className="text-sm font-medium">CNPJ</Label>
          <Input
            id="cnpj"
            value={formData.cnpj}
            onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
            required
            placeholder="00.000.000/0001-00"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email" className="text-sm font-medium">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            placeholder="empresa@exemplo.com"
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="partner_name" className="text-sm font-medium">Nome completo do sócio</Label>
          <Input
            id="partner_name"
            value={formData.partner_name}
            onChange={(e) => setFormData({ ...formData, partner_name: e.target.value })}
            required
            placeholder="Nome do sócio"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="partner_cpf" className="text-sm font-medium">CPF do sócio</Label>
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
        <Label htmlFor="phone" className="text-sm font-medium">Telefone</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="(00) 00000-0000"
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="responsible_name" className="text-sm font-medium">Nome do responsável</Label>
        <Input
          id="responsible_name"
          value={formData.responsible_name || ''}
          onChange={(e) => setFormData({ ...formData, responsible_name: e.target.value })}
          placeholder="Se for diferente do sócio"
        />
      </div>
    </div>
  );
};
