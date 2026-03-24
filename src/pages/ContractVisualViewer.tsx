import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  CreditCard,
  UserCheck,
  Building2,
  Users,
  XCircle,
  Shield,
  Copyright,
  UserX,
  Globe,
  MessageCircle,
  Image,
  Scale,
  MapPin,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Loader2,
  Clock,
  AlertTriangle,
  Percent,
  CalendarDays,
  Ban,
  Eye,
  Lock,
  Handshake,
  FileSignature,
  Wrench,
  ShieldCheck,
  Target,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ── Types ──

interface ClauseHighlight {
  icon: LucideIcon;
  label: string;
  description: string;
}

interface ClauseMeta {
  number: number;
  title: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  summary: string[];
  highlights: ClauseHighlight[];
}

interface TemplateData {
  label: string;
  badgeColor: string;
  badgeText: string;
  badgeBorder: string;
  clauses: ClauseMeta[];
  rawTexts: Record<number, string>;
}

// ══════════════════════════════════════════════
// ── OPEN SCOPE TEMPLATE ──
// ══════════════════════════════════════════════

const OPEN_SCOPE_CLAUSES: ClauseMeta[] = [
  {
    number: 1,
    title: "Objeto",
    icon: FileText,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    summary: [
      "Define o que será desenvolvido: software, automações e soluções tecnológicas",
      "O escopo é aberto — pode evoluir e ser ajustado ao longo do projeto",
      "Mudanças de escopo podem impactar prazos e gerar custos adicionais",
    ],
    highlights: [
      { icon: FileText, label: "Escopo Aberto", description: "Flexível e iterativo" },
      { icon: Clock, label: "Prazos Adaptáveis", description: "Ajustam com o escopo" },
      { icon: AlertTriangle, label: "Aditivos", description: "Mudanças podem gerar novo orçamento" },
    ],
  },
  {
    number: 2,
    title: "Preço e Condições de Pagamento",
    icon: CreditCard,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    summary: [
      "Valores e parcelas conforme acordado entre as partes",
      "Parcelas vencem mensalmente na mesma data da primeira",
      "Atraso gera juros de 1% ao mês + multa de 2%",
    ],
    highlights: [
      { icon: CalendarDays, label: "Mensal", description: "Vencimento recorrente" },
      { icon: Percent, label: "Juros 1%/mês", description: "Em caso de atraso" },
      { icon: Ban, label: "Suspensão", description: "Após 10 dias de atraso" },
    ],
  },
  {
    number: 3,
    title: "Obrigações do Contratante",
    icon: UserCheck,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
    summary: [
      "Fornecer informações e materiais necessários ao projeto",
      "Validar entregas em até 5 dias úteis (senão, aceite tácito)",
      "Arcar com custos de ferramentas e infraestrutura aprovados",
    ],
    highlights: [
      { icon: Clock, label: "5 dias úteis", description: "Para validar entregas" },
      { icon: CheckCircle2, label: "Aceite tácito", description: "Sem resposta = aprovado" },
      { icon: Handshake, label: "Colaboração", description: "Trabalho conjunto com a equipe" },
    ],
  },
  {
    number: 4,
    title: "Obrigações da Contratada",
    icon: Building2,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    summary: [
      "Executar serviços com diligência e boas práticas técnicas",
      "Entregar soluções funcionais e emitir notas fiscais",
      "Prestar suporte durante a vigência do contrato",
    ],
    highlights: [
      { icon: CheckCircle2, label: "Qualidade", description: "Boas práticas técnicas" },
      { icon: FileText, label: "Nota Fiscal", description: "Emitida para cada pagamento" },
      { icon: MessageCircle, label: "Suporte", description: "Durante vigência do projeto" },
    ],
  },
  {
    number: 5,
    title: "Autonomia na Gestão da Equipe",
    icon: Users,
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/30",
    summary: [
      "A contratada tem total autonomia para gerir sua equipe",
      "Pode contratar, substituir e organizar profissionais livremente",
      "Não há vínculo empregatício entre as partes",
    ],
    highlights: [
      { icon: Users, label: "Autonomia total", description: "Gestão própria da equipe" },
      { icon: Ban, label: "Sem vínculo", description: "Não é relação de emprego" },
    ],
  },
  {
    number: 6,
    title: "Rescisão",
    icon: XCircle,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    summary: [
      "Qualquer parte pode cancelar com 30 dias de antecedência",
      "Contratante paga pelo que já foi executado",
      "Contratada entrega todo trabalho realizado até a data",
    ],
    highlights: [
      { icon: Clock, label: "30 dias", description: "Aviso prévio mínimo" },
      { icon: CreditCard, label: "Proporcional", description: "Paga-se pelo que foi feito" },
      { icon: FileText, label: "Entrega total", description: "Todo trabalho é entregue" },
    ],
  },
  {
    number: 7,
    title: "Confidencialidade",
    icon: Shield,
    color: "text-slate-400",
    bgColor: "bg-slate-500/10",
    borderColor: "border-slate-500/30",
    summary: [
      "Sigilo absoluto sobre informações técnicas, comerciais e estratégicas",
      "Obrigação válida por 5 anos após o término do contrato",
      "Descumprimento gera reparação integral por perdas e danos",
    ],
    highlights: [
      { icon: Lock, label: "5 anos", description: "De sigilo pós-contrato" },
      { icon: Shield, label: "Sigilo total", description: "Informações protegidas" },
      { icon: AlertTriangle, label: "Perdas e danos", description: "Se violar o sigilo" },
    ],
  },
  {
    number: 8,
    title: "Propriedade Intelectual",
    icon: Copyright,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
    summary: [
      "Após quitação total, os direitos do software são transferidos ao contratante",
      "Inclui direito de uso, adaptação, modificação e exploração econômica",
    ],
    highlights: [
      { icon: CheckCircle2, label: "Transferência", description: "Após pagamento integral" },
      { icon: Copyright, label: "Direitos plenos", description: "Uso, adaptação e modificação" },
    ],
  },
  {
    number: 9,
    title: "Não Aliciamento de Profissionais",
    icon: UserX,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    summary: [
      "O contratante não pode contratar profissionais da equipe do projeto",
      "Restrição válida durante o contrato + 12 meses após o fim",
      "Multa de 12x o valor mensal médio em caso de violação",
    ],
    highlights: [
      { icon: Clock, label: "12 meses", description: "Restrição pós-contrato" },
      { icon: AlertTriangle, label: "Multa 12x", description: "Valor mensal médio" },
      { icon: Ban, label: "Proibido", description: "Contratar membros da equipe" },
    ],
  },
  {
    number: 10,
    title: "Dependência de Serviços de Terceiros",
    icon: Globe,
    color: "text-gray-400",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-500/30",
    summary: [
      "O projeto pode depender de plataformas, APIs e softwares externos",
      "A contratada não se responsabiliza por falhas de terceiros",
      "Custos desses serviços são de responsabilidade do contratante",
    ],
    highlights: [
      { icon: Globe, label: "APIs externas", description: "Plataformas de terceiros" },
      { icon: AlertTriangle, label: "Sem garantia", description: "De serviços externos" },
      { icon: CreditCard, label: "Custo do cliente", description: "Ferramentas externas" },
    ],
  },
  {
    number: 11,
    title: "Comunicação e Operação",
    icon: MessageCircle,
    color: "text-teal-400",
    bgColor: "bg-teal-500/10",
    borderColor: "border-teal-500/30",
    summary: [
      "Atendimento de segunda a sexta, das 10h às 18h (Brasília)",
      "Comunicação via WhatsApp ou canais digitais acordados",
      "Reuniões podem ser gravadas para registro do projeto",
    ],
    highlights: [
      { icon: Clock, label: "10h–18h", description: "Segunda a sexta" },
      { icon: MessageCircle, label: "WhatsApp", description: "Canal principal" },
      { icon: Eye, label: "Gravação", description: "Reuniões registradas" },
    ],
  },
  {
    number: 12,
    title: "Direito de Portfólio",
    icon: Image,
    color: "text-pink-400",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/30",
    summary: [
      "A contratada pode usar o projeto em seu portfólio e marketing",
      "Sem divulgação de informações confidenciais do contratante",
    ],
    highlights: [
      { icon: Image, label: "Portfólio", description: "Uso para divulgação" },
      { icon: Shield, label: "Sem dados sigilosos", description: "Apenas imagens/descrições" },
    ],
  },
  {
    number: 13,
    title: "Disposições Gerais",
    icon: Scale,
    color: "text-neutral-400",
    bgColor: "bg-neutral-500/10",
    borderColor: "border-neutral-500/30",
    summary: [
      "Não estabelece vínculo empregatício ou societário",
      "Alterações contratuais exigem acordo formal entre as partes",
      "Se uma cláusula for inválida, as demais continuam válidas",
    ],
    highlights: [
      { icon: FileSignature, label: "Formal", description: "Alterações por escrito" },
      { icon: Scale, label: "Independência", description: "Cláusulas autônomas" },
    ],
  },
  {
    number: 14,
    title: "Foro",
    icon: MapPin,
    color: "text-rose-400",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/30",
    summary: [
      "Foro eleito: Comarca do Rio de Janeiro – RJ",
      "Com renúncia de qualquer outro, por mais privilegiado que seja",
    ],
    highlights: [
      { icon: MapPin, label: "Rio de Janeiro", description: "Comarca eleita" },
    ],
  },
];

const OPEN_SCOPE_RAW_TEXTS: Record<number, string> = {
  1: `1.1 O presente contrato tem por objeto a prestação de serviços especializados de desenvolvimento de software, automações e soluções tecnológicas, conforme escopo descrito abaixo:

{{scope}}

1.2 O presente contrato caracteriza-se como contratação de escopo aberto, podendo ocorrer evolução, ampliação ou ajustes nas funcionalidades ao longo da execução do projeto.

1.3 Eventuais solicitações de alteração, inclusão de funcionalidades, integrações adicionais, ajustes de lógica ou qualquer outra modificação no escopo inicialmente definido poderão aumentar o escopo do projeto, impactar prazos de entrega e eventualmente gerar custos adicionais, podendo ser objeto de replanejamento, novo orçamento ou aditivo contratual, conforme acordado entre as partes.

1.4 Em razão da natureza iterativa e evolutiva de projetos de tecnologia, as partes reconhecem que alterações solicitadas durante o desenvolvimento podem resultar em extensão do prazo de execução, sem que isso configure inadimplemento por parte da CONTRATADA.`,

  2: `2.1 Pelos serviços prestados, o CONTRATANTE pagará à CONTRATADA conforme a seguinte condição:

{{installment_info}}

2.2 O valor das parcelas vencerá mensalmente, sempre na mesma data do pagamento da primeira parcela, salvo disposição diversa acordada entre as partes.

2.3 Em caso de atraso no pagamento poderão incidir correção monetária, juros de mora de 1% ao mês e multa de 2% sobre o valor em atraso.

2.4 A inadimplência superior a 10 (dez) dias poderá acarretar suspensão temporária dos serviços até a regularização dos pagamentos.`,

  3: `3.1 Constituem obrigações do CONTRATANTE:

I – fornecer todas as informações e materiais necessários à execução dos serviços;

II – validar entregas ou solicitar ajustes no prazo máximo de 5 (cinco) dias úteis após disponibilização, sob pena de aceitação tácita;

III – arcar com custos de tecnologias, ferramentas, licenças, infraestrutura ou softwares necessários ao projeto, previamente aprovados;

IV – colaborar com a equipe técnica da CONTRATADA sempre que necessário à execução dos serviços.

3.2 A ausência de retorno do CONTRATANTE dentro dos prazos definidos poderá implicar prorrogação automática dos prazos de entrega, sem que isso caracterize descumprimento contratual por parte da CONTRATADA.`,

  4: `4.1 Constituem obrigações da CONTRATADA:

I – executar os serviços com diligência e observância das boas práticas técnicas;

II – entregar soluções funcionais conforme especificações acordadas;

III – emitir as respectivas notas fiscais referentes aos valores pagos;

IV – responsabilizar-se por todos os encargos fiscais, trabalhistas e previdenciários relacionados à sua equipe;

V – prestar suporte referente ao escopo contratado durante a vigência da prestação do serviço.

4.2 O suporte técnico limita-se ao escopo contratado e ao período de execução do projeto, encerrando-se após a validação das entregas ou após o prazo de validação estabelecido.`,

  5: `5.1 A CONTRATADA possui total autonomia para contratar profissionais, gerir sua equipe técnica, substituir membros da equipe e organizar a execução dos serviços conforme sua metodologia de trabalho.

5.2 Não haverá qualquer vínculo empregatício entre os profissionais da CONTRATADA e o CONTRATANTE.`,

  6: `6.1 O presente contrato poderá ser rescindido por qualquer das partes mediante notificação escrita com antecedência mínima de 30 (trinta) dias.

6.2 Em caso de rescisão por iniciativa do CONTRATANTE, este deverá efetuar o pagamento proporcional aos serviços já executados até a data da notificação.

6.3 Em caso de rescisão por iniciativa da CONTRATADA, esta deverá entregar todos os trabalhos realizados até a data da notificação.

6.4 A rescisão não prejudicará obrigações que, por sua natureza, devam sobreviver ao término do contrato, incluindo confidencialidade e propriedade intelectual.`,

  7: `7.1 As partes comprometem-se a manter absoluto sigilo sobre todas as informações técnicas, comerciais ou estratégicas obtidas durante a execução do contrato.

7.2 A obrigação de confidencialidade permanecerá válida por 5 (cinco) anos após o término do contrato.

7.3 O descumprimento desta cláusula sujeitará a parte infratora à reparação integral por perdas e danos.`,

  8: `8.1 Após a quitação integral dos valores contratados, os direitos patrimoniais do software desenvolvido serão transferidos ao CONTRATANTE.

8.2 A cessão de direitos inclui exploração econômica, uso, adaptação e modificação do software, conforme legislação vigente.`,

  9: `9.1 O CONTRATANTE compromete-se a não contratar, aliciar ou estabelecer vínculo profissional direto ou indireto com qualquer profissional, colaborador ou prestador de serviços da CONTRATADA que tenha participado do projeto.

9.2 Esta restrição permanecerá válida durante toda a vigência do contrato e por 12 (doze) meses após o término da relação contratual.

9.3 Em caso de descumprimento desta cláusula, o CONTRATANTE deverá pagar à CONTRATADA multa equivalente a 12 (doze) vezes o valor mensal médio pago no contrato, sem prejuízo de eventual indenização por perdas e danos adicionais.`,

  10: `10.1 Os serviços prestados poderão depender de plataformas, APIs, softwares ou infraestruturas de terceiros.

10.2 A CONTRATADA não se responsabiliza por indisponibilidade, falhas, alterações ou limitações decorrentes desses serviços externos.

10.3 Eventuais custos relacionados a tais serviços serão de responsabilidade do CONTRATANTE, salvo acordo expresso em contrário.`,

  11: `11.1 O horário de atendimento da CONTRATADA será de segunda a sexta-feira, das 10h às 18h, horário de Brasília.

11.2 A comunicação operacional ocorrerá preferencialmente por grupo de WhatsApp ou outros canais digitais definidos entre as partes.

11.3 Todas as reuniões poderão ser gravadas para fins de registro e acompanhamento do projeto.

11.4 Solicitações de alteração de escopo realizadas durante reuniões poderão ser registradas e utilizadas para acompanhamento da evolução do projeto.`,

  12: `12.1 A CONTRATADA poderá mencionar o projeto desenvolvido e exibir imagens ou descrições do sistema para fins de portfólio, divulgação institucional e marketing, desde que não sejam divulgadas informações confidenciais do CONTRATANTE.`,

  13: `13.1 Este contrato não estabelece vínculo empregatício, societário ou de representação entre as partes.

13.2 Eventuais alterações neste contrato somente terão validade mediante acordo formal entre as partes.

13.3 Caso qualquer cláusula seja considerada inválida, as demais permanecerão em pleno vigor.`,

  14: `14.1 Para dirimir quaisquer controvérsias decorrentes deste contrato, as partes elegem o foro da Comarca do Rio de Janeiro – RJ, com renúncia de qualquer outro, por mais privilegiado que seja.`,
};

// ══════════════════════════════════════════════
// ── CLOSED SCOPE TEMPLATE ──
// ══════════════════════════════════════════════

const CLOSED_SCOPE_CLAUSES: ClauseMeta[] = [
  {
    number: 1,
    title: "Objeto do Contrato",
    icon: Target,
    color: "text-violet-400",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/30",
    summary: [
      "Define os serviços específicos que serão prestados",
      "O escopo é fechado — funcionalidades e limites estão definidos",
      "Qualquer alteração fora do escopo exige acordo formal e pode gerar novo orçamento",
      "A contratada não é obrigada a realizar atividades fora do escopo sem acordo",
    ],
    highlights: [
      { icon: Target, label: "Escopo Fechado", description: "Funcionalidades definidas" },
      { icon: Lock, label: "Limites claros", description: "Entregas pré-acordadas" },
      { icon: FileSignature, label: "Aditivo formal", description: "Para mudanças de escopo" },
    ],
  },
  {
    number: 2,
    title: "Pagamentos",
    icon: CreditCard,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    summary: [
      "Pagamentos conforme condições acordadas entre as partes",
      "Atraso gera juros de 1% ao mês + multa de 2%",
      "Inadimplência de 10+ dias pode suspender os serviços",
      "Cancelamento exige aviso prévio e pagamento proporcional",
    ],
    highlights: [
      { icon: Percent, label: "Juros 1%/mês", description: "Em caso de atraso" },
      { icon: Ban, label: "Suspensão", description: "Após 10 dias de atraso" },
      { icon: CreditCard, label: "Proporcional", description: "Paga-se pelo executado" },
    ],
  },
  {
    number: 3,
    title: "Obrigações da Contratante",
    icon: UserCheck,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
    summary: [
      "Fornecer todas as informações necessárias ao projeto",
      "Validar entregas em até 5 dias úteis (senão, aceite automático)",
      "Arcar com custos de tecnologia e infraestrutura (previamente aprovados)",
      "Atraso em fornecer materiais prorroga automaticamente os prazos",
    ],
    highlights: [
      { icon: Clock, label: "5 dias úteis", description: "Para validar entregas" },
      { icon: CheckCircle2, label: "Aceite automático", description: "Sem resposta = aprovado" },
      { icon: CalendarDays, label: "Prazos flexíveis", description: "Se cliente atrasar" },
    ],
  },
  {
    number: 4,
    title: "Obrigações da Contratada",
    icon: Building2,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    summary: [
      "Entregar produto funcional dentro das especificações acordadas",
      "Responsabilidade fiscal e trabalhista pela equipe",
      "Emissão de nota fiscal para cada pagamento",
      "Suporte limitado ao escopo e período de prestação do serviço",
    ],
    highlights: [
      { icon: CheckCircle2, label: "Produto funcional", description: "Conforme especificado" },
      { icon: FileText, label: "Nota Fiscal", description: "Para cada pagamento" },
      { icon: MessageCircle, label: "Suporte", description: "Dentro do escopo contratado" },
    ],
  },
  {
    number: 5,
    title: "Ajustes e Correções",
    icon: Wrench,
    color: "text-sky-400",
    bgColor: "bg-sky-500/10",
    borderColor: "border-sky-500/30",
    summary: [
      "Erros técnicos em funcionalidades do escopo são corrigidos sem custo",
      "Melhorias, mudanças de fluxo e novas integrações são evolução de escopo",
      "Evoluções podem gerar novo orçamento e prazo adicional",
    ],
    highlights: [
      { icon: Wrench, label: "Bugs grátis", description: "Correção sem custo" },
      { icon: AlertTriangle, label: "Evolução ≠ Bug", description: "Novo orçamento" },
      { icon: Clock, label: "Prazo extra", description: "Se houver alterações" },
    ],
  },
  {
    number: 6,
    title: "Garantia",
    icon: ShieldCheck,
    color: "text-lime-400",
    bgColor: "bg-lime-500/10",
    borderColor: "border-lime-500/30",
    summary: [
      "Garantia de 15 dias após validação final do projeto",
      "Cobre correção de falhas técnicas nas funcionalidades do escopo",
      "Após o período, ajustes e evoluções são contratados separadamente",
    ],
    highlights: [
      { icon: ShieldCheck, label: "15 dias", description: "De garantia pós-entrega" },
      { icon: Wrench, label: "Falhas técnicas", description: "Cobertas pela garantia" },
      { icon: CreditCard, label: "Após garantia", description: "Novo orçamento" },
    ],
  },
  {
    number: 7,
    title: "Contratação de Mão de Obra",
    icon: Users,
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/30",
    summary: [
      "A FlowCode tem autonomia total para gerir sua equipe",
      "Contratações, desligamentos e substituições são decisão da contratada",
      "Não há vínculo empregatício entre contratante e equipe do projeto",
    ],
    highlights: [
      { icon: Users, label: "Autonomia total", description: "Gestão própria da equipe" },
      { icon: Ban, label: "Sem vínculo", description: "Não é relação de emprego" },
    ],
  },
  {
    number: 8,
    title: "Rescisão",
    icon: XCircle,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    summary: [
      "Qualquer parte pode rescindir com 30 dias de antecedência",
      "Contratante paga proporcional ao trabalho já executado",
      "Contratada entrega todo trabalho realizado até a data",
      "Confidencialidade e propriedade intelectual sobrevivem à rescisão",
    ],
    highlights: [
      { icon: Clock, label: "30 dias", description: "Aviso prévio mínimo" },
      { icon: CreditCard, label: "Proporcional", description: "Paga-se pelo que foi feito" },
      { icon: FileText, label: "Entrega total", description: "Todo trabalho é entregue" },
    ],
  },
  {
    number: 9,
    title: "Confidencialidade",
    icon: Shield,
    color: "text-slate-400",
    bgColor: "bg-slate-500/10",
    borderColor: "border-slate-500/30",
    summary: [
      "Sigilo total sobre todas as informações do projeto",
      "Obrigação válida por 5 anos após o término do contrato",
    ],
    highlights: [
      { icon: Lock, label: "5 anos", description: "De sigilo pós-contrato" },
      { icon: Shield, label: "Sigilo total", description: "Informações protegidas" },
    ],
  },
  {
    number: 10,
    title: "Propriedade Intelectual",
    icon: Copyright,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
    summary: [
      "Após quitação integral, a propriedade intelectual é transferida ao contratante",
      "Cessão plena, total e irrestrita — inclui exploração econômica permanente e exclusiva",
    ],
    highlights: [
      { icon: CheckCircle2, label: "Transferência plena", description: "Após pagamento integral" },
      { icon: Copyright, label: "Exclusiva", description: "Exploração permanente" },
    ],
  },
  {
    number: 11,
    title: "Não Aliciamento de Profissionais",
    icon: UserX,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    summary: [
      "Proibido contratar profissionais da equipe do projeto",
      "Restrição válida durante o contrato + 12 meses após",
      "Multa de 12x o valor mensal médio em caso de violação",
    ],
    highlights: [
      { icon: Clock, label: "12 meses", description: "Restrição pós-contrato" },
      { icon: AlertTriangle, label: "Multa 12x", description: "Valor mensal médio" },
      { icon: Ban, label: "Proibido", description: "Contratar membros da equipe" },
    ],
  },
  {
    number: 12,
    title: "Serviços de Terceiros",
    icon: Globe,
    color: "text-gray-400",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-500/30",
    summary: [
      "O sistema pode depender de serviços, APIs ou plataformas externas",
      "A contratada não se responsabiliza por falhas de terceiros",
    ],
    highlights: [
      { icon: Globe, label: "APIs externas", description: "Plataformas de terceiros" },
      { icon: AlertTriangle, label: "Sem garantia", description: "De serviços externos" },
    ],
  },
  {
    number: 13,
    title: "Informações Gerais",
    icon: MessageCircle,
    color: "text-teal-400",
    bgColor: "bg-teal-500/10",
    borderColor: "border-teal-500/30",
    summary: [
      "Atendimento de segunda a sexta, das 10h às 18h (Brasília)",
      "Comunicação via grupo de WhatsApp, respostas em até 24h úteis",
      "Calls podem ser gravadas e alterações de escopo registradas",
    ],
    highlights: [
      { icon: Clock, label: "10h–18h", description: "Segunda a sexta" },
      { icon: MessageCircle, label: "WhatsApp", description: "Respostas em 24h" },
      { icon: Eye, label: "Gravação", description: "Calls registradas" },
    ],
  },
  {
    number: 14,
    title: "Direito de Portfólio",
    icon: Image,
    color: "text-pink-400",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/30",
    summary: [
      "A contratada pode usar o projeto em seu portfólio e divulgação institucional",
      "Sem divulgação de informações confidenciais do contratante",
    ],
    highlights: [
      { icon: Image, label: "Portfólio", description: "Uso para divulgação" },
      { icon: Shield, label: "Sem dados sigilosos", description: "Apenas imagens/descrições" },
    ],
  },
  {
    number: 15,
    title: "Foro",
    icon: MapPin,
    color: "text-rose-400",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/30",
    summary: [
      "Foro eleito: Comarca do Rio de Janeiro – RJ",
    ],
    highlights: [
      { icon: MapPin, label: "Rio de Janeiro", description: "Comarca eleita" },
    ],
  },
];

const CLOSED_SCOPE_RAW_TEXTS: Record<number, string> = {
  1: `1.1 O presente contrato tem como objeto a prestação dos seguintes serviços:

{{scope}}

1.2 O presente contrato caracteriza-se como contratação de escopo fechado, estando as funcionalidades, entregas e limites do projeto descritos no escopo definido neste contrato ou em documento complementar acordado entre as partes.

1.3 Qualquer solicitação de alteração, inclusão de funcionalidades, integrações adicionais, mudanças de comportamento do sistema ou qualquer modificação que não esteja expressamente prevista no escopo contratado será considerada alteração de escopo.

1.4 Alterações de escopo poderão impactar prazos de entrega e valores do projeto, podendo gerar replanejamento, novo orçamento ou aditivo contratual, conforme acordado entre as partes.

1.5 A CONTRATADA não estará obrigada a realizar atividades fora do escopo originalmente definido sem acordo formal entre as partes.`,

  2: `2.1 Os pagamentos serão realizados conforme descrito abaixo:

{{installment_info}}

2.2 Em caso de atraso no pagamento poderão incidir correção monetária, juros de mora de 1% ao mês e multa de 2% sobre o valor em atraso.

2.3 A inadimplência superior a 10 (dez) dias poderá acarretar suspensão temporária dos serviços até a regularização dos pagamentos.

2.4 O contratante poderá cancelar o plano de serviço mediante aviso prévio por escrito. O cancelamento não isenta o pagamento proporcional pelos serviços já executados.`,

  3: `3.1 Fornecer todas as informações necessárias à realização do serviço.

3.2 Validar as entregas em até 5 (cinco) dias úteis da disponibilização. Na ausência de manifestação dentro deste prazo, a entrega será considerada automaticamente validada.

3.3 Arcar com todos os pagamentos de tecnologias necessárias para o projeto – desde infraestrutura de desenvolvimento a softwares necessários para criar o sistema. Todos esses gastos serão previamente validados pela contratante.

3.4 Caso o contratante deixe de fornecer informações, materiais ou acessos necessários para execução do projeto, os prazos de entrega poderão ser automaticamente prorrogados pelo período correspondente ao atraso.`,

  4: `4.1 Entregar um produto funcional dentro das especificações acordadas.

4.2 Responsabilizar-se legalmente, tanto no aspecto fiscal quanto trabalhista, pela mão de obra atuante no projeto.

4.3 Emitir nota fiscal relativa aos valores pagos.

4.4 Prestar suporte apenas para o que é objeto do escopo e durante a prestação do serviço, que se encerra com a validação ou final do prazo de validação previsto neste contrato.`,

  5: `5.1 Ajustes decorrentes de erro técnico comprovado em funcionalidades previstas no escopo contratado serão realizados pela contratada sem custo adicional.

5.2 Alterações de comportamento do sistema, melhorias de usabilidade, mudanças de fluxo, novas integrações ou funcionalidades adicionais serão consideradas evolução ou alteração de escopo, podendo gerar novo orçamento e prazo adicional.`,

  6: `6.1 A contratada garante a correção de eventuais falhas técnicas relacionadas às funcionalidades previstas no escopo contratado pelo prazo de 15 (quinze) dias após a validação final do projeto.

6.2 Após este período, eventuais ajustes, melhorias ou evoluções poderão ser contratados separadamente mediante novo orçamento.`,

  7: `7.1 A FlowCode possui autonomia para a contratação, gestão de profissionais e eventuais desligamentos de sua equipe.

7.2 Não haverá vínculo empregatício entre o CONTRATANTE e os profissionais da CONTRATADA.`,

  8: `8.1 Qualquer uma das partes poderá rescindir este contrato mediante notificação escrita à outra parte com antecedência mínima de 30 (trinta) dias.

8.2 No caso de rescisão unilateral por parte da contratante, esta deverá efetuar o pagamento proporcional aos serviços já prestados até a data da notificação da rescisão.

8.3 No caso de rescisão unilateral por parte da contratada, esta deverá entregar todos os trabalhos já realizados até a data da notificação da rescisão.

8.4 A rescisão do contrato não afetará obrigações que, por sua natureza, devam sobreviver ao término do contrato, incluindo confidencialidade e propriedade intelectual.`,

  9: `9.1 As partes se comprometem a manter confidenciais todas as informações relacionadas à prestação do serviço.

9.2 A obrigação de confidencialidade permanecerá válida por 5 (cinco) anos após o término deste contrato.`,

  10: `10.1 Após a quitação integral dos valores contratados, a propriedade intelectual do sistema desenvolvido será da CONTRATANTE.

10.2 A transmissão de propriedade intelectual é plena, total e irrestrita, incluindo, mas não se limitando, à cessão do direito à exploração econômica permanente e exclusiva, enquanto perdurar a proteção da propriedade intelectual, conforme a legislação vigente.`,

  11: `11.1 O CONTRATANTE compromete-se a não contratar, aliciar ou estabelecer vínculo profissional direto ou indireto com qualquer profissional, colaborador ou prestador de serviços da CONTRATADA que tenha participado do projeto.

11.2 Esta restrição permanecerá válida durante toda a vigência do contrato e por 12 (doze) meses após o término da relação contratual.

11.3 Em caso de descumprimento desta cláusula, o CONTRATANTE deverá pagar à CONTRATADA multa equivalente a 12 (doze) vezes o valor mensal médio pago no contrato.`,

  12: `12.1 O funcionamento do sistema poderá depender de serviços, APIs ou plataformas de terceiros.

12.2 A CONTRATADA não se responsabiliza por indisponibilidade, falhas ou alterações decorrentes desses serviços externos.`,

  13: `13.1 Nosso horário de atendimento é de 10h às 18h no horário de Brasília.

13.2 Nossa comunicação ocorre por grupo de WhatsApp e as demandas serão respondidas por ali e analisadas em até 24 horas, respeitando os dias úteis.

13.3 Todas as calls poderão ser gravadas e alterações de escopo solicitadas via call poderão ser registradas para melhor acompanhamento do projeto.`,

  14: `14.1 A CONTRATADA poderá mencionar o projeto desenvolvido e exibir imagens ou descrições do sistema para fins de portfólio e divulgação institucional, desde que não sejam divulgadas informações confidenciais da CONTRATANTE.`,

  15: `15.1 Para dirimir quaisquer controvérsias decorrentes deste contrato, as partes elegem o foro da Comarca do Rio de Janeiro – RJ.`,
};

// ══════════════════════════════════════════════
// ── TEMPLATE MAP ──
// ══════════════════════════════════════════════

const TEMPLATES: Record<string, TemplateData> = {
  open_scope: {
    label: "Contrato de Prestação de Serviços",
    badgeColor: "bg-blue-500/20 text-blue-300",
    badgeText: "Escopo Aberto",
    badgeBorder: "border-blue-500/30",
    clauses: OPEN_SCOPE_CLAUSES,
    rawTexts: OPEN_SCOPE_RAW_TEXTS,
  },
  closed_scope: {
    label: "Contrato de Prestação de Serviços – FlowCode",
    badgeColor: "bg-violet-500/20 text-violet-300",
    badgeText: "Escopo Fechado",
    badgeBorder: "border-violet-500/30",
    clauses: CLOSED_SCOPE_CLAUSES,
    rawTexts: CLOSED_SCOPE_RAW_TEXTS,
  },
};

// ── Contract interface ──

interface ClientData {
  name: string;
  email?: string;
  type?: string;
  cpf?: string;
  cnpj?: string;
  partner_cpf?: string;
  partner_name?: string;
  address?: string;
  company_name?: string;
}

interface ContractData {
  id: number;
  contract_id?: string;
  contract_type?: string;
  contractor_type?: string;
  scope?: string;
  total_value?: number;
  installments?: number;
  installment_value?: number;
  installment_value_text?: string;
  start_date?: string;
  data_assinatura_flowcode?: string;
  status?: string;
  clients?: ClientData | null;
}

// ══════════════════════════════════════════════
// ── COMPONENT ──
// ══════════════════════════════════════════════

export default function ContractVisualViewer() {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [contract, setContract] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(true);
  const [currentClause, setCurrentClause] = useState(0);
  const [visitedClauses, setVisitedClauses] = useState<Set<number>>(new Set([0]));
  const [expandedText, setExpandedText] = useState(false);

  useEffect(() => {
    fetchContract();
  }, [contractId]);

  const fetchContract = async () => {
    if (!contractId) return;

    try {
      const { data, error } = await supabase
        .from("contratos")
        .select("*")
        .eq("contract_id", contractId)
        .single();

      if (error) throw error;

      let clientData: ClientData | null = null;
      if (data?.client_id) {
        const { data: client } = await supabase
          .from("clients")
          .select("name, email, type, cpf, cnpj, partner_cpf, partner_name, address, company_name")
          .eq("id", data.client_id)
          .single();
        clientData = client;
      }

      setContract({ ...data, clients: clientData });
    } catch (err) {
      console.error("Error fetching contract:", err);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o contrato.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Resolve template
  const template = contract?.contract_type ? TEMPLATES[contract.contract_type] : null;
  const clauses = template?.clauses || [];
  const rawTexts = template?.rawTexts || {};
  const totalClauses = clauses.length;
  const progress = totalClauses > 0 ? (visitedClauses.size / totalClauses) * 100 : 0;
  const allVisited = visitedClauses.size === totalClauses && totalClauses > 0;
  const clause = clauses[currentClause];

  const goToClause = (index: number) => {
    if (index < 0 || index >= totalClauses) return;
    setCurrentClause(index);
    setVisitedClauses((prev) => new Set([...prev, index]));
    setExpandedText(false);
  };

  const interpolateText = (text: string): string => {
    if (!contract) return text;
    return text
      .replace("{{scope}}", contract.scope || "[Escopo do projeto]")
      .replace(
        "{{installment_info}}",
        contract.installment_value_text ||
          (contract.installments && contract.installment_value
            ? `${contract.installments}x de R$ ${Number(contract.installment_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
            : "[Condições de pagamento]")
      );
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-white">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-lg">Carregando contrato...</span>
        </div>
      </div>
    );
  }

  // ── Not found ──
  if (!contract) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white/5 border-white/10">
          <CardContent className="text-center py-12">
            <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Contrato não encontrado</h2>
            <p className="text-slate-400">O contrato solicitado não existe ou não está disponível.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── No template for this type ──
  if (!template || !clause) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white/5 border-white/10">
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Visualização não disponível</h2>
            <p className="text-slate-400">
              Não há template visual configurado para este tipo de contrato
              {contract.contract_type ? ` (${contract.contract_type})` : ""}.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const ClauseIcon = clause.icon;

  // ── Helper: format document (CPF/CNPJ) ──
  const clientDoc = contract.clients?.type === "pj"
    ? contract.clients?.cnpj
    : contract.clients?.cpf || contract.clients?.partner_cpf;

  const clientDocLabel = contract.clients?.type === "pj" ? "CNPJ" : "CPF";

  const formatSigningDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString("pt-BR");
    } catch {
      return dateStr;
    }
  };

  // ── Intro screen (parties) ──
  if (showIntro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl w-full"
        >
          {/* Logo / Title */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 border border-white/20 mb-4">
              <FileSignature className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{template.label}</h1>
            <Badge className={`${template.badgeColor} ${template.badgeBorder} text-sm`}>
              {template.badgeText}
            </Badge>
          </div>

          {/* Parties */}
          <div className="space-y-4 mb-10">
            {/* Contratante */}
            <Card className="bg-white/[0.04] border-white/10">
              <CardContent className="p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-3">
                  Contratante
                </p>
                <p className="text-xl font-semibold text-white mb-2">
                  {contract.clients?.name || "[Nome do contratante]"}
                </p>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-400">
                  {clientDoc && (
                    <span>{clientDocLabel}: {clientDoc}</span>
                  )}
                  {contract.clients?.address && (
                    <span>{contract.clients.address}</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contratada */}
            <Card className="bg-white/[0.04] border-white/10">
              <CardContent className="p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-purple-400 mb-3">
                  Contratada
                </p>
                <p className="text-xl font-semibold text-white mb-2">
                  FlowCode Sistemas LTDA
                </p>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-400">
                  <span>CNPJ: 48.493.939/0001-61</span>
                  <span>Rio de Janeiro – RJ</span>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  Representada por Lucas Gouvea Carmo
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Contract info summary */}
          <div className="grid grid-cols-2 gap-3 mb-10">
            {contract.scope && (
              <div className="col-span-2 rounded-xl bg-white/[0.03] border border-white/10 p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Escopo</p>
                <p className="text-sm text-slate-300 line-clamp-3">{contract.scope}</p>
              </div>
            )}
            {contract.total_value && (
              <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Valor</p>
                <p className="text-lg font-semibold text-emerald-400">
                  R$ {Number(contract.total_value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}
            {contract.installment_value_text && (
              <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Parcelas</p>
                <p className="text-sm font-medium text-slate-300">{contract.installment_value_text}</p>
              </div>
            )}
            {formatSigningDate(contract.data_assinatura_flowcode || contract.start_date) && (
              <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Data</p>
                <p className="text-sm font-medium text-slate-300">
                  Rio de Janeiro, {formatSigningDate(contract.data_assinatura_flowcode || contract.start_date)}
                </p>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="text-center">
            <Button
              onClick={() => setShowIntro(false)}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white px-8 py-6 text-lg"
            >
              Ler Cláusulas do Contrato
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
            <p className="text-xs text-slate-500 mt-4">
              {totalClauses} cláusulas para revisar antes da assinatura
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* ── Header ── */}
      <div className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-semibold">{template.label}</h1>
              {contract.clients?.name && (
                <p className="text-sm text-slate-400">{contract.clients.name}</p>
              )}
            </div>
            <Badge className={`${template.badgeColor} ${template.badgeBorder}`}>
              {template.badgeText}
            </Badge>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-3">
            <Progress value={progress} className="flex-1 h-2 bg-white/10" />
            <span className="text-xs text-slate-400 whitespace-nowrap">
              {visitedClauses.size}/{totalClauses} cláusulas
            </span>
          </div>

          {/* Mini nav dots */}
          <div className="flex gap-1.5 mt-3 justify-center flex-wrap">
            {clauses.map((c, i) => {
              const DotIcon = c.icon;
              return (
                <button
                  key={i}
                  onClick={() => goToClause(i)}
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200
                    ${i === currentClause
                      ? `${c.bgColor} ${c.borderColor} border-2 scale-110`
                      : visitedClauses.has(i)
                        ? "bg-white/10 border border-white/20"
                        : "bg-white/5 border border-white/10 opacity-50"
                    }
                  `}
                  title={`Cláusula ${c.number} – ${c.title}`}
                >
                  <DotIcon className={`h-3.5 w-3.5 ${i === currentClause ? c.color : "text-slate-400"}`} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentClause}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* Clause header */}
            <div className="flex items-center gap-4 mb-6">
              <div className={`p-3 rounded-2xl ${clause.bgColor} ${clause.borderColor} border`}>
                <ClauseIcon className={`h-7 w-7 ${clause.color}`} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Cláusula {clause.number} de {totalClauses}</p>
                <h2 className="text-2xl font-bold">{clause.title}</h2>
              </div>
            </div>

            {/* Summary card */}
            <Card className={`mb-6 bg-white/[0.03] ${clause.borderColor} border`}>
              <CardContent className="p-6">
                <p className={`text-xs font-semibold uppercase tracking-wider ${clause.color} mb-4`}>
                  Resumo
                </p>
                <ul className="space-y-3">
                  {clause.summary.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className={`h-5 w-5 mt-0.5 shrink-0 ${clause.color}`} />
                      <span className="text-slate-200 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Highlights / Infographic */}
            <div className={`grid gap-3 mb-6 ${clause.highlights.length === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}>
              {clause.highlights.map((h, i) => {
                const HIcon = h.icon;
                return (
                  <div
                    key={i}
                    className={`rounded-xl p-4 ${clause.bgColor} border ${clause.borderColor} text-center`}
                  >
                    <HIcon className={`h-6 w-6 mx-auto mb-2 ${clause.color}`} />
                    <p className="text-sm font-semibold text-white">{h.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{h.description}</p>
                  </div>
                );
              })}
            </div>

            {/* Full text collapsible */}
            <Collapsible open={expandedText} onOpenChange={setExpandedText}>
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors mb-2 w-full">
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${expandedText ? "rotate-180" : ""}`}
                  />
                  <span>{expandedText ? "Ocultar" : "Ver"} texto completo da cláusula</span>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="bg-white/[0.02] border-white/10">
                    <CardContent className="p-6">
                      <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                        {interpolateText(rawTexts[clause.number] || "")}
                      </pre>
                    </CardContent>
                  </Card>
                </motion.div>
              </CollapsibleContent>
            </Collapsible>
          </motion.div>
        </AnimatePresence>

        {/* ── Navigation ── */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/10">
          <Button
            variant="outline"
            onClick={() => goToClause(currentClause - 1)}
            disabled={currentClause === 0}
            className="bg-white/5 border-white/20 text-white hover:bg-white/10 disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>

          <span className="text-sm text-slate-500">
            {currentClause + 1} / {totalClauses}
          </span>

          {currentClause < totalClauses - 1 ? (
            <Button
              onClick={() => goToClause(currentClause + 1)}
              className={`${clause.bgColor} ${clause.borderColor} border text-white hover:brightness-125`}
            >
              Próxima
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={() => navigate(`/contract-signing/${contractId}?fromVisual=true`)}
              disabled={!allVisited}
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white disabled:opacity-40"
            >
              <FileSignature className="h-4 w-4 mr-2" />
              {allVisited ? "Ir para Assinatura" : `Leia todas (${visitedClauses.size}/${totalClauses})`}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
