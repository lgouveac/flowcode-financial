
import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface RecipientFieldProps {
  customEmail: string;
  setCustomEmail: (email: string) => void;
}

export const RecipientField: React.FC<RecipientFieldProps> = ({
  customEmail,
  setCustomEmail,
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="custom-email">Email para teste</Label>
      <Input
        id="custom-email"
        type="email"
        placeholder="Digite um email para enviar o teste"
        value={customEmail}
        onChange={(e) => setCustomEmail(e.target.value)}
      />
    </div>
  );
};
