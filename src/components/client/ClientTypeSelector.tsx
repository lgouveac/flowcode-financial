
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ClientTypeSelectorProps {
  clientType: "pf" | "pj";
  onTypeChange: (value: "pf" | "pj") => void;
}

export const ClientTypeSelector = ({ clientType, onTypeChange }: ClientTypeSelectorProps) => {
  return (
    <div className="grid gap-3">
      <Label className="text-base font-medium text-gray-900">Você contratará como pessoa física ou jurídica?</Label>
      <RadioGroup
        value={clientType}
        onValueChange={onTypeChange}
        className="grid sm:grid-cols-2 gap-4"
      >
        <div className="flex items-center space-x-2 border rounded-md px-4 py-3 hover:border-primary/50 transition-colors">
          <RadioGroupItem value="pf" id="pf" className="text-primary" />
          <Label htmlFor="pf" className="cursor-pointer font-medium">Pessoa Física (PF)</Label>
        </div>
        <div className="flex items-center space-x-2 border rounded-md px-4 py-3 hover:border-primary/50 transition-colors">
          <RadioGroupItem value="pj" id="pj" className="text-primary" />
          <Label htmlFor="pj" className="cursor-pointer font-medium">Pessoa Jurídica (PJ)</Label>
        </div>
      </RadioGroup>
    </div>
  );
};
