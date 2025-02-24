
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailTemplate } from "@/types/email";
import { useTemplateVariables } from "@/hooks/useTemplateVariables";

interface TemplatePreviewProps {
  template: EmailTemplate;
  previewData?: Record<string, string | number>;
}

export const TemplatePreview = ({ template, previewData = {} }: TemplatePreviewProps) => {
  const { renderTemplate } = useTemplateVariables();

  const renderedContent = renderTemplate(
    template.content,
    template.type,
    template.subtype,
    previewData
  );

  const renderedSubject = renderTemplate(
    template.subject,
    template.type,
    template.subtype,
    previewData
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
