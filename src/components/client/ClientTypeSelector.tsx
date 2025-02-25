
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ClientTypeSelectorProps {
  clientType: "pf" | "pj";
  onTypeChange: (value: "pf" | "pj") => void;
}

export const ClientTypeSelector = ({ clientType, onTypeChange }: ClientTypeSelectorProps) => {
  return (
    <div className="grid gap-2">
      <Label>Você contratará como pessoa física ou jurídica?</Label>
      <RadioGroup
        value={clientType}
        onValueChange={onTypeChange}
        className="grid sm:grid-cols-2 gap-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="pf" id="pf" />
          <Label htmlFor="pf">PF</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="pj" id="pj" />
          <Label htmlFor="pj">PJ</Label>
        </div>
      </RadioGroup>
    </div>
  );
};
