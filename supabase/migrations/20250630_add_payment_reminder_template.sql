
-- Insert default payment reminder template if none exists
SELECT insert_template_if_not_exists(
  'clients',
  'reminder',
  'Lembrete de Pagamento em Atraso',
  'Lembrete de pagamento em atraso - {nome_cliente}',
  E'Olá, {nome_responsavel}!\n\nEstamos entrando em contato para lembrar que há um pagamento em atraso para {nome_cliente}.\n\nDetalhes do pagamento:\n- Valor: {valor_cobranca}\n- Data de vencimento: {data_vencimento}\n- Dias em atraso: {dias_atraso}\n- Descrição: {descricao_servico}\n\nPor favor, regularize o pagamento o mais breve possível para evitar possíveis restrições de crédito.\n\nCaso já tenha efetuado o pagamento, por favor desconsidere esta mensagem.\n\nForma de pagamento preferencial: {forma_pagamento}\n\nAtenciosamente,\nEquipe Financeira'
);
