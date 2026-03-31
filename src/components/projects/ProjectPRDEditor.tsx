import { useState, useEffect } from "react";
import DOMPurify from "dompurify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProjectPRDEditorProps {
  projectId: number;
  initialPRD?: string;
  onSave?: () => void;
}

export function ProjectPRDEditor({ projectId, initialPRD, onSave }: ProjectPRDEditorProps) {
  const [prd, setPRD] = useState(initialPRD || "");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setPRD(initialPRD || "");
  }, [initialPRD]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('projetos')
        .update({ prd: prd.trim() || null })
        .eq('id', projectId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "PRD salvo com sucesso.",
      });

      onSave?.();
    } catch (error) {
      console.error('Error saving PRD:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o PRD.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>PRD - Product Requirements Document</CardTitle>
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="prd">Documento de Requisitos do Produto</Label>
          <Textarea
            id="prd"
            value={prd}
            onChange={(e) => setPRD(e.target.value)}
            placeholder="Digite o PRD aqui (suporta HTML/Markdown)..."
            rows={20}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Use Markdown: **negrito**, *itálico*, # Título, - Lista, ```código```
          </p>
          
          {/* Preview do PRD */}
          {prd && (
            <div className="mt-4">
              <Label>Preview</Label>
              <div 
                className="prose max-w-none border rounded-md p-4 mt-2 bg-muted/50"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(prd) }}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}




