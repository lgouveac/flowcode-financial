import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useWebhooks } from "@/hooks/useWebhooks";
import {
  FileSignature,
  Plus,
  Eye,
  Edit3,
  Send,
  User,
  Calendar,
  Globe,
  FileText,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";

interface Document {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'published' | 'signed';
  created_at: string;
  signed_at?: string;
  signer_name?: string;
  signer_email?: string;
  signer_ip?: string;
}

export function DocumentsTab() {
  const { toast } = useToast();
  const { getWebhook } = useWebhooks();

  const [documents, setDocuments] = useState<Document[]>([
    {
      id: '1',
      title: 'Documento de Exemplo',
      content: 'Este é um exemplo de documento para demonstração.',
      status: 'draft',
      created_at: new Date().toISOString(),
    }
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null);
  const [signingDoc, setSigningDoc] = useState<Document | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');

  // Get user's IP address (mock function for demo)
  const getUserIP = (): string => {
    // In production, you would get this from a service or API
    return '192.168.1.100';
  };

  const callWebhook = async (type: 'criacao' | 'assinatura', payload: any) => {
    const webhookUrl = getWebhook('documents', type);

    if (!webhookUrl) {
      console.log(`No webhook configured for documents ${type}`);
      return;
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log(`Webhook ${type} called successfully`);
    } catch (error) {
      console.error(`Error calling webhook ${type}:`, error);
      toast({
        title: "Erro no webhook",
        description: `Não foi possível chamar o webhook de ${type}.`,
        variant: "destructive",
      });
    }
  };

  const handleCreateDocument = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Título e conteúdo são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const newDoc: Document = {
      id: Date.now().toString(),
      title: newTitle,
      content: newContent,
      status: 'published',
      created_at: new Date().toISOString(),
    };

    setDocuments(prev => [newDoc, ...prev]);

    // Call creation webhook
    await callWebhook('criacao', {
      document_id: newDoc.id,
      title: newDoc.title,
      content: newDoc.content,
      created_at: newDoc.created_at,
      created_by: 'current_user', // Replace with actual user
    });

    toast({
      title: "Documento criado",
      description: "Documento criado com sucesso!",
    });

    setNewTitle('');
    setNewContent('');
    setIsCreating(false);
  };

  const handleSignDocument = async () => {
    if (!signingDoc || !signerName.trim() || !signerEmail.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e email do signatário são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const userIP = getUserIP();
    const signedAt = new Date().toISOString();

    const updatedDoc: Document = {
      ...signingDoc,
      status: 'signed',
      signed_at: signedAt,
      signer_name: signerName,
      signer_email: signerEmail,
      signer_ip: userIP,
    };

    setDocuments(prev =>
      prev.map(doc => doc.id === signingDoc.id ? updatedDoc : doc)
    );

    // Call signature webhook
    await callWebhook('assinatura', {
      document_id: signingDoc.id,
      signer_name: signerName,
      signer_email: signerEmail,
      signer_ip: userIP,
      signature_date: signedAt,
      document_title: signingDoc.title,
    });

    toast({
      title: "Documento assinado",
      description: `Documento assinado por ${signerName}!`,
    });

    setSignerName('');
    setSignerEmail('');
    setSigningDoc(null);
  };

  const getStatusBadge = (status: Document['status']) => {
    const statusConfig = {
      draft: { label: 'Rascunho', color: 'bg-gray-100 text-gray-800', icon: Edit3 },
      published: { label: 'Publicado', color: 'bg-blue-100 text-blue-800', icon: FileText },
      signed: { label: 'Assinado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileSignature className="h-5 w-5" />
                Documentos para Assinatura
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Crie documentos e colete assinaturas digitais com webhooks do n8n
              </p>
            </div>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Documento
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Documents Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {documents.map((doc, index) => (
          <motion.div
            key={doc.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg line-clamp-1">{doc.title}</CardTitle>
                  {getStatusBadge(doc.status)}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {doc.content}
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                  </div>
                  {doc.signed_at && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {doc.signer_name}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewingDoc(doc)}
                    className="flex-1"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Ver
                  </Button>
                  {doc.status !== 'signed' && (
                    <Button
                      size="sm"
                      onClick={() => setSigningDoc(doc)}
                      className="flex-1"
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Assinar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Create Document Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Novo Documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título do Documento</Label>
              <Input
                id="title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Digite o título do documento"
              />
            </div>
            <div>
              <Label htmlFor="content">Conteúdo</Label>
              <Textarea
                id="content"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Cole ou digite o conteúdo do documento aqui..."
                rows={10}
                className="resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateDocument}>
                Criar Documento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Document Dialog */}
      <Dialog open={!!viewingDoc} onOpenChange={() => setViewingDoc(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {viewingDoc?.title}
            </DialogTitle>
          </DialogHeader>
          {viewingDoc && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                {getStatusBadge(viewingDoc.status)}
                <div className="text-sm text-muted-foreground">
                  Criado em {new Date(viewingDoc.created_at).toLocaleDateString('pt-BR')}
                </div>
              </div>

              <div className="prose max-w-none bg-muted/50 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap font-sans text-sm">
                  {viewingDoc.content}
                </pre>
              </div>

              {viewingDoc.status === 'signed' && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-medium text-green-900">Documento Assinado</p>
                        <div className="text-sm text-green-700 space-y-1">
                          <p><strong>Assinante:</strong> {viewingDoc.signer_name}</p>
                          <p><strong>Email:</strong> {viewingDoc.signer_email}</p>
                          <p><strong>Data:</strong> {viewingDoc.signed_at ? new Date(viewingDoc.signed_at).toLocaleString('pt-BR') : ''}</p>
                          <p className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            <strong>IP:</strong> {viewingDoc.signer_ip}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Sign Document Dialog */}
      <Dialog open={!!signingDoc} onOpenChange={() => setSigningDoc(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5" />
              Assinar Documento
            </DialogTitle>
          </DialogHeader>
          {signingDoc && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="font-medium">{signingDoc.title}</p>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {signingDoc.content}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="signer-name">Nome do Signatário</Label>
                  <Input
                    id="signer-name"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="Digite o nome completo"
                  />
                </div>
                <div>
                  <Label htmlFor="signer-email">Email do Signatário</Label>
                  <Input
                    id="signer-email"
                    type="email"
                    value={signerEmail}
                    onChange={(e) => setSignerEmail(e.target.value)}
                    placeholder="Digite o email"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-700">
                      <p className="font-medium">Informações de Assinatura</p>
                      <p>IP será capturado automaticamente e enviado ao webhook do n8n para validação.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSigningDoc(null)}>
                  Cancelar
                </Button>
                <Button onClick={handleSignDocument}>
                  <FileSignature className="h-4 w-4 mr-2" />
                  Assinar Documento
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}