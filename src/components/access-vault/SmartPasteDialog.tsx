import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClipboardPaste, Trash2, Loader2, Upload, Image, Type } from "lucide-react";
import { parseCredentials, ParsedCredential } from "@/lib/parseCredentials";

interface SmartPasteDialogProps {
  open: boolean;
  onClose: () => void;
  onInsert: (entries: ParsedCredential[]) => Promise<void>;
}

function getOpenAIKey(): string | null {
  return (
    localStorage.getItem("openai_api_key") ||
    (import.meta.env.VITE_OPENAI_API_KEY as string) ||
    null
  );
}

async function extractCredentialsFromImage(base64Image: string, mimeType: string, apiKey: string): Promise<ParsedCredential[]> {

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Você extrai credenciais de serviços a partir de imagens. Retorne APENAS um JSON array, sem markdown, sem explicação. Cada item deve ter: service_name, username (login/email), password (senha/token), url, notes (observações). Use string vazia "" para campos não encontrados. Exemplo:
[{"service_name":"Supabase","username":"admin@email.com","password":"xyz123","url":"https://supabase.co","notes":""}]`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extraia todas as credenciais de serviço desta imagem. Retorne o JSON array.",
            },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64Image}` },
            },
          ],
        },
      ],
      max_tokens: 4096,
      temperature: 0,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error: ${response.status} — ${err}`);
  }

  const data = await response.json();
  const content: string = data.choices?.[0]?.message?.content || "[]";

  // Strip markdown code fences if present
  const cleaned = content.replace(/```(?:json)?\n?/g, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item: Record<string, string>) => ({
      service_name: item.service_name || "",
      username: item.username || "",
      password: item.password || "",
      url: item.url || "",
      notes: item.notes || "",
    }));
  } catch {
    console.error("Failed to parse AI response:", cleaned);
    return [];
  }
}

async function extractCredentialsFromText(text: string, apiKey: string): Promise<ParsedCredential[]> {

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Você extrai credenciais de serviços a partir de texto copiado (Notion, planilhas, notas). Retorne APENAS um JSON array, sem markdown, sem explicação. Cada item deve ter: service_name, username (login/email), password (senha/token), url, notes (observações). Use string vazia "" para campos não encontrados. Se o texto tiver apenas nomes de serviços sem credenciais, crie entradas com apenas o service_name preenchido. Exemplo:
[{"service_name":"Supabase","username":"admin@email.com","password":"xyz123","url":"https://supabase.co","notes":""}]`,
        },
        {
          role: "user",
          content: `Extraia todas as credenciais deste texto:\n\n${text}`,
        },
      ],
      max_tokens: 4096,
      temperature: 0,
    }),
  });

  if (!response.ok) {
    // Fallback to local parser on API error
    console.warn("OpenAI API error, falling back to local parser");
    return parseCredentials(text);
  }

  const data = await response.json();
  const content: string = data.choices?.[0]?.message?.content || "[]";
  const cleaned = content.replace(/```(?:json)?\n?/g, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return parseCredentials(text);
    return parsed.map((item: Record<string, string>) => ({
      service_name: item.service_name || "",
      username: item.username || "",
      password: item.password || "",
      url: item.url || "",
      notes: item.notes || "",
    }));
  } catch {
    return parseCredentials(text);
  }
}

export function SmartPasteDialog({ open, onClose, onInsert }: SmartPasteDialogProps) {
  const [mode, setMode] = useState<"choose" | "text" | "image">("choose");
  const [rawText, setRawText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<{ base64: string; mimeType: string } | null>(null);
  const [parsed, setParsed] = useState<ParsedCredential[]>([]);
  const [step, setStep] = useState<"input" | "preview">("input");
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      // Extract base64 data
      const base64 = result.split(",")[1];
      setImageData({ base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeText = async () => {
    if (!rawText.trim()) return;
    setAnalyzing(true);
    setError(null);
    try {
      const key = getOpenAIKey();
      const results = key
        ? await extractCredentialsFromText(rawText, key)
        : parseCredentials(rawText);
      setParsed(results);
      if (results.length > 0) setStep("preview");
      else setError("Nenhum acesso detectado. Verifique o formato do texto.");
    } catch (err) {
      console.error("Error analyzing text:", err);
      setError(err instanceof Error ? err.message : "Erro ao analisar texto");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!imageData) return;
    const key = getOpenAIKey();
    if (!key) {
      setError("Chave OpenAI não configurada. Configure via variável VITE_OPENAI_API_KEY ou pelo chat widget.");
      return;
    }
    setAnalyzing(true);
    setError(null);
    try {
      const results = await extractCredentialsFromImage(imageData.base64, imageData.mimeType, key);
      setParsed(results);
      if (results.length > 0) setStep("preview");
      else setError("Nenhum acesso detectado na imagem. Tente com uma imagem mais nítida.");
    } catch (err) {
      console.error("Error analyzing image:", err);
      setError(err instanceof Error ? err.message : "Erro ao analisar imagem");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleUpdateField = (index: number, field: keyof ParsedCredential, value: string) => {
    setParsed((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry))
    );
  };

  const handleRemoveEntry = (index: number) => {
    setParsed((prev) => prev.filter((_, i) => i !== index));
  };

  const handleInsert = async () => {
    const valid = parsed.filter((e) => e.service_name.trim());
    if (valid.length === 0) return;
    setSaving(true);
    try {
      await onInsert(valid);
      handleReset();
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setRawText("");
    setImagePreview(null);
    setImageData(null);
    setParsed([]);
    setStep("input");
    setMode("choose");
    setAnalyzing(false);
    setError(null);
    onClose();
  };

  const handleBack = () => {
    if (step === "preview") {
      setStep("input");
    } else {
      setMode("choose");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleReset}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardPaste className="h-5 w-5" />
            Importar Acessos
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Choose mode */}
        {step === "input" && mode === "choose" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Como deseja importar os acessos?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => setMode("text")}
                className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-dashed hover:border-primary hover:bg-accent transition-colors"
              >
                <Type className="h-8 w-8 text-muted-foreground" />
                <div className="text-center">
                  <p className="font-medium">Colar Texto</p>
                  <p className="text-sm text-muted-foreground">
                    Cole do Notion, planilha ou bloco de notas
                  </p>
                </div>
              </button>

              <button
                onClick={() => setMode("image")}
                className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-dashed hover:border-primary hover:bg-accent transition-colors"
              >
                <Image className="h-8 w-8 text-muted-foreground" />
                <div className="text-center">
                  <p className="font-medium">Upload de Imagem</p>
                  <p className="text-sm text-muted-foreground">
                    Screenshot do Notion ou qualquer tela
                  </p>
                </div>
              </button>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleReset}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Text input mode */}
        {step === "input" && mode === "text" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cole os acessos abaixo</Label>
              <p className="text-sm text-muted-foreground">
                A IA analisa e extrai login, senha, url e observações automaticamente.
              </p>
              <Textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={`Supabase\nlogin: admin@email.com\nsenha: minhasenha123\nurl: https://supabase.co/project/abc\n\nVercel\nlogin: deploy@email.com\nsenha: vercel-token\nurl: https://vercel.com/meuapp`}
                rows={12}
                className="font-mono text-sm"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={handleBack}>
                Voltar
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleReset}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleAnalyzeText}
                  disabled={!rawText.trim() || analyzing}
                >
                  {analyzing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Analisar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Image upload mode */}
        {step === "input" && mode === "image" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Upload de screenshot</Label>
              <p className="text-sm text-muted-foreground">
                Faça upload de um screenshot do Notion ou qualquer tela com credenciais.
                A IA vai extrair os dados automaticamente.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {!imagePreview ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center gap-3 p-10 rounded-lg border-2 border-dashed hover:border-primary hover:bg-accent transition-colors"
                >
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Clique para selecionar ou arraste uma imagem
                  </p>
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-lg overflow-hidden border max-h-[300px]">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-auto max-h-[300px] object-contain"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setImagePreview(null);
                      setImageData(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    Trocar imagem
                  </Button>
                </div>
              )}
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={handleBack}>
                Voltar
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleReset}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleAnalyzeImage}
                  disabled={!imageData || analyzing}
                >
                  {analyzing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Analisar com IA
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Preview step */}
        {step === "preview" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {parsed.length} acesso(s) detectado(s). Revise e edite antes de inserir.
            </p>

            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[140px]">Serviço</TableHead>
                    <TableHead className="min-w-[140px]">Login</TableHead>
                    <TableHead className="min-w-[140px]">Senha</TableHead>
                    <TableHead className="min-w-[180px]">URL</TableHead>
                    <TableHead className="min-w-[140px]">Obs</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsed.map((entry, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="p-1">
                        <Input
                          value={entry.service_name}
                          onChange={(e) =>
                            handleUpdateField(idx, "service_name", e.target.value)
                          }
                          placeholder="Nome do serviço"
                          className="h-8 text-sm"
                        />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input
                          value={entry.username}
                          onChange={(e) =>
                            handleUpdateField(idx, "username", e.target.value)
                          }
                          placeholder="login"
                          className="h-8 text-sm"
                        />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input
                          value={entry.password}
                          onChange={(e) =>
                            handleUpdateField(idx, "password", e.target.value)
                          }
                          placeholder="senha"
                          className="h-8 text-sm"
                        />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input
                          value={entry.url}
                          onChange={(e) =>
                            handleUpdateField(idx, "url", e.target.value)
                          }
                          placeholder="https://..."
                          className="h-8 text-sm"
                        />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input
                          value={entry.notes}
                          onChange={(e) =>
                            handleUpdateField(idx, "notes", e.target.value)
                          }
                          placeholder="obs"
                          className="h-8 text-sm"
                        />
                      </TableCell>
                      <TableCell className="p-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleRemoveEntry(idx)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={handleBack}>
                Voltar
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleReset}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleInsert}
                  disabled={
                    saving ||
                    parsed.filter((e) => e.service_name.trim()).length === 0
                  }
                >
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Inserir {parsed.filter((e) => e.service_name.trim()).length}{" "}
                  acesso(s)
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
