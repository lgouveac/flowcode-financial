
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { NewClient } from "@/types/client";

interface PersonalFormProps {
  formData: NewClient;
  setFormData: (data: NewClient) => void;
}

export const PersonalForm = ({ formData, setFormData }: PersonalFormProps) => {
  return (
    <div className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="name" className="text-sm font-medium">Nome completo</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Seu nome completo"
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
            placeholder="seu.email@exemplo.com"
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="cpf" className="text-sm font-medium">CPF</Label>
          <Input
            id="cpf"
            value={formData.cpf}
            onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
            required
            placeholder="000.000.000-00"
          />
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
      </div>
      <div className="grid gap-2">
        <Label htmlFor="responsible_name" className="text-sm font-medium">Nome da pessoa responsável</Label>
        <Input
          id="responsible_name"
          value={formData.responsible_name || ''}
          onChange={(e) => setFormData({ ...formData, responsible_name: e.target.value })}
          placeholder="Nome da pessoa responsável (se aplicável)"
        />
      </div>
    </div>
  );
};
