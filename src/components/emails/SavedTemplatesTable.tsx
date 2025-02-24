
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EditTemplateDialog } from "./EditTemplateDialog";
import { useState } from "react";
import { EmailTemplate } from "@/types/email";
import { useToast } from "@/components/ui/use-toast";

interface SavedTemplatesTableProps {
  templates: EmailTemplate[];
  onTemplateUpdate?: (updatedTemplate: EmailTemplate) => void;
}

export const SavedTemplatesTable = ({ templates, onTemplateUpdate }: SavedTemplatesTableProps) => {
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const { toast } = useToast();

  const handleSave = (updatedTemplate: EmailTemplate) => {
    onTemplateUpdate?.(updatedTemplate);
    toast({
      title: "Template atualizado",
      description: "O template foi atualizado com sucesso.",
    });
    setEditingTemplate(null);
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Templates Salvos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <table className="w-full">
            <thead className="bg-muted">
              <tr className="text-left">
                <th className="p-4 text-sm font-medium text-muted-foreground">Nome</th>
                <th className="p-4 text-sm font-medium text-muted-foreground">Tipo</th>
                <th className="p-4 text-sm font-medium text-muted-foreground">Assunto</th>
                <th className="p-4 text-sm font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => (
                <tr key={template.id} className="border-t hover:bg-muted/50">
                  <td className="p-4">
                    {template.name}
                  </td>
                  <td className="p-4">
                    {template.type === 'clients' 
                      ? (template.subtype === 'recurring' ? 'Cobrança Recorrente' : 'Cobrança Pontual')
                      : (template.subtype === 'invoice' ? 'Nota Fiscal' : 'Horas')}
                  </td>
                  <td className="p-4">
                    {template.subject}
                  </td>
                  <td className="p-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingTemplate(template)}
                    >
                      Editar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>

      {editingTemplate && (
        <EditTemplateDialog
          template={editingTemplate}
          open={true}
          onClose={() => setEditingTemplate(null)}
          onSave={handleSave}
        />
      )}
    </Card>
  );
};
