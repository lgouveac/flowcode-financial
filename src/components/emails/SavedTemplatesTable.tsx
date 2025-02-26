
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EditTemplateDialog } from "./EditTemplateDialog";
import { useState } from "react";
import { EmailTemplate } from "@/types/email";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface SavedTemplatesTableProps {
  templates: EmailTemplate[];
  onTemplateUpdate?: (updatedTemplate: EmailTemplate) => void;
  onTemplateDelete?: (templateId: string, type: string, subtype: string) => void;
  isLoading?: boolean;
}

export const SavedTemplatesTable = ({ templates, onTemplateUpdate, onTemplateDelete, isLoading }: SavedTemplatesTableProps) => {
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<EmailTemplate | null>(null);
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

  const handleDeleteClick = (template: EmailTemplate) => {
    setDeletingTemplate(template);
  };

  const handleConfirmDelete = () => {
    if (deletingTemplate) {
      onTemplateDelete?.(deletingTemplate.id, deletingTemplate.type, deletingTemplate.subtype);
      setDeletingTemplate(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Templates Salvos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Carregando templates...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

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
                <th className="p-4 text-sm font-medium text-muted-foreground">Padrão</th>
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
                    {getTemplateTypeLabel(template.type, template.subtype)}
                  </td>
                  <td className="p-4">
                    {template.subject}
                  </td>
                  <td className="p-4">
                    {template.is_default ? 'Sim' : 'Não'}
                  </td>
                  <td className="p-4 space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingTemplate(template)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteClick(template)}
                    >
                      <Trash2 className="h-4 w-4" />
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

      <AlertDialog open={!!deletingTemplate} onOpenChange={() => setDeletingTemplate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Você está prestes a excluir o template:
              </p>
              <p className="font-medium">
                Nome: {deletingTemplate?.name}
              </p>
              <p className="font-medium">
                Tipo: {deletingTemplate ? getTemplateTypeLabel(deletingTemplate.type, deletingTemplate.subtype) : ''}
              </p>
              {deletingTemplate?.is_default && (
                <p className="mt-2 text-destructive font-medium">
                  Atenção: Este é o template padrão atual. Ao excluí-lo, outro template do mesmo tipo será definido como padrão.
                </p>
              )}
              <p className="mt-2">
                Esta ação não pode ser desfeita.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

