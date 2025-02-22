
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailTemplate } from "@/types/email";

interface SavedTemplatesTableProps {
  templates: EmailTemplate[];
}

export const SavedTemplatesTable = ({ templates }: SavedTemplatesTableProps) => {
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
                <th className="p-4 text-sm font-medium text-muted-foreground">Última Modificação</th>
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
                  <td className="p-4 text-sm text-muted-foreground">
                    Hoje às 15:30
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
