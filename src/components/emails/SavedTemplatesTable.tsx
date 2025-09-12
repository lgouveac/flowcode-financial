
import { CardHeader, CardTitle } from "@/components/ui/card";
import { EditTemplateDialog } from "./EditTemplateDialog";
import { useState } from "react";
import { EmailTemplate } from "@/types/email";
import { useToast } from "@/hooks/use-toast";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

interface SavedTemplatesTableProps {
  templates: EmailTemplate[];
  onTemplateUpdate?: (updatedTemplate: EmailTemplate) => void;
  isLoading?: boolean;
}

export const SavedTemplatesTable = ({ templates, onTemplateUpdate, isLoading }: SavedTemplatesTableProps) => {
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const { toast } = useToast();

  const getTemplateTypeLabel = (type: string, subtype: string) => {
    if (type === 'clients') {
      return subtype === 'recurring' ? 'Cobrança Recorrente' : 'Cobrança Pontual';
    }
    return subtype === 'invoice' ? 'Nota Fiscal' : 'Horas';
  };

  const handleSave = (updatedTemplate: EmailTemplate) => {
    onTemplateUpdate?.(updatedTemplate);
    setEditingTemplate(null);
    toast({
      title: "Template atualizado",
      description: `O template "${updatedTemplate.name}" (${getTemplateTypeLabel(updatedTemplate.type, updatedTemplate.subtype)}) foi atualizado com sucesso.`,
    });
  };

  if (isLoading) {
    return (
      <div className="mt-6">
        <CardHeader>
          <CardTitle>Templates Salvos</CardTitle>
        </CardHeader>
        <div className="p-6 pt-0">
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Carregando templates...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <CardHeader>
        <CardTitle>Templates Salvos</CardTitle>
      </CardHeader>
      <div className="p-6 pt-0">
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Assunto</TableHead>
                <TableHead>Padrão</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow 
                  key={template.id}
                  className="cursor-pointer"
                  onClick={() => setEditingTemplate(template)}
                >
                  <TableCell>
                    <div className="line-clamp-2 text-sm leading-5 max-h-10 overflow-hidden" title={template.name}>
                      {template.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="line-clamp-2 text-sm leading-5 max-h-10 overflow-hidden" title={getTemplateTypeLabel(template.type, template.subtype)}>
                      {getTemplateTypeLabel(template.type, template.subtype)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="line-clamp-2 text-sm leading-5 max-h-10 overflow-hidden" title={template.subject}>
                      {template.subject}
                    </div>
                  </TableCell>
                  <TableCell>
                    {template.is_default ? 'Sim' : 'Não'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {editingTemplate && (
        <EditTemplateDialog
          template={editingTemplate}
          open={true}
          onClose={() => setEditingTemplate(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};
