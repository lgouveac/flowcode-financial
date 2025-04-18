
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailTemplate } from "@/types/email";
import { useTemplateVariables } from "@/hooks/useTemplateVariables";
import { format } from "date-fns";

interface TemplatePreviewProps {
  template: EmailTemplate;
  previewData?: Record<string, string | number>;
}

export const TemplatePreview = ({ template, previewData = {} }: TemplatePreviewProps) => {
  const { renderTemplate } = useTemplateVariables();

  // Modify date formatting in preview data
  const modifiedPreviewData = { ...previewData };
  
  // Convert dates to dd/MM/yyyy format
  const dateKeys = ['data_vencimento', 'data_inicio', 'dueDate', 'due_date'];
  dateKeys.forEach(key => {
    if (modifiedPreviewData[key]) {
      try {
        modifiedPreviewData[key] = format(new Date(modifiedPreviewData[key] as string), 'dd/MM/yyyy');
      } catch (e) {
        console.warn(`Could not format date for key: ${key}`);
      }
    }
  });

  const renderedContent = renderTemplate(
    template.content,
    template.type,
    template.subtype,
    modifiedPreviewData
  );

  const renderedSubject = renderTemplate(
    template.subject,
    template.type,
    template.subtype,
    modifiedPreviewData
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visualização do Template</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold mb-1">Assunto:</h4>
          <p className="text-sm">{renderedSubject}</p>
        </div>
        <div>
          <h4 className="font-semibold mb-1">Conteúdo:</h4>
          <div className="text-sm whitespace-pre-wrap">{renderedContent}</div>
        </div>
      </CardContent>
    </Card>
  );
};
