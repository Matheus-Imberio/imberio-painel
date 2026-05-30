import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { BudgetExpanded, Client } from '@/contexts/DataContext';

// Extend jsPDF type to include lastAutoTable
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: { finalY: number };
  }
}

const COMPANY_NAME = 'DYQUE & DAYA';
const COMPANY_SUBTITLE = 'REBOBINAGEM DE MOTORES ELÉTRICOS';
const COMPANY_PHONE = '(44) 3524-2171 / 98846-7576 / 98437-4616';
const COMPANY_ADDRESS = 'RUA DUQUE DE CAXIAS, 166 (FUNDOS) - JD. LAR PARANÁ - CAMPO MOURÃO - PR';

// Função auxiliar para limpar e validar número de telefone
function cleanPhoneNumber(phone: string): string | null {
  if (!phone) return null;
  
  // Remove tudo exceto números
  const cleaned = phone.replace(/\D/g, '');
  
  // Valida se tem pelo menos 10 dígitos (formato brasileiro mínimo)
  if (cleaned.length < 10) return null;
  
  // Se começar com 0, remove
  const withoutLeadingZero = cleaned.startsWith('0') ? cleaned.substring(1) : cleaned;
  
  // Se não começar com 55 (código do Brasil), adiciona
  const withCountryCode = withoutLeadingZero.startsWith('55') 
    ? withoutLeadingZero 
    : `55${withoutLeadingZero}`;
  
  return withCountryCode;
}

// Função para enviar orçamento via WhatsApp
// Função auxiliar para gerar o documento PDF sem salvar
function generateBudgetPDFDoc(budget: BudgetExpanded): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  
  // Calcular complexidade do conteúdo
  const itemCount = budget.items.length;
  const hasLaudo = !!budget.laudo_tecnico;
  const laudoLength = budget.laudo_tecnico?.length || 0;
  
  // Determinar nível de compactação
  let compactLevel = 0;
  if (itemCount > 15 || (itemCount > 10 && hasLaudo && laudoLength > 200)) {
    compactLevel = 3;
  } else if (itemCount > 10 || (itemCount > 6 && hasLaudo && laudoLength > 150)) {
    compactLevel = 2;
  } else if (itemCount > 6 || (hasLaudo && laudoLength > 100)) {
    compactLevel = 1;
  }
  
  // Configurações responsivas
  const config = {
    headerHeight: [45, 40, 35, 32][compactLevel],
    headerFontSize: [20, 18, 16, 14][compactLevel],
    headerSubFontSize: [9, 8, 7, 7][compactLevel],
    sectionTitleSize: [12, 11, 10, 9][compactLevel],
    motorFontSize: [8, 8, 7, 7][compactLevel],
    motorPadding: [2.5, 2, 1.8, 1.5][compactLevel],
    laudoFontSize: [9, 8, 8, 7][compactLevel],
    itemFontSize: [9, 8, 7, 6][compactLevel],
    itemPadding: [3, 2.5, 2, 1.5][compactLevel],
    sectionSpacing: [10, 8, 6, 4][compactLevel],
    signatureSpacing: [35, 30, 25, 20][compactLevel],
  };

  // Header com background
  doc.setFillColor(26, 54, 71);
  doc.rect(0, 0, pageWidth, config.headerHeight, 'F');

  // Company Info
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(config.headerFontSize);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY_NAME, margin, config.headerHeight * 0.35);

  doc.setFontSize(config.headerSubFontSize);
  doc.setFont('helvetica', 'normal');
  doc.text(COMPANY_SUBTITLE, margin, config.headerHeight * 0.52);
  doc.text(`Fone: ${COMPANY_PHONE}`, margin, config.headerHeight * 0.68);
  doc.text(COMPANY_ADDRESS, margin, config.headerHeight * 0.85);

  // Data no canto direito
  doc.setFontSize(config.headerSubFontSize + 1);
  doc.text(`Data: ${new Date(budget.data).toLocaleDateString('pt-BR')}`, pageWidth - margin, config.headerHeight * 0.35, { align: 'right' });

  // Cliente
  let yPos = config.headerHeight + config.sectionSpacing;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(config.sectionTitleSize);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENTE: ', margin, yPos);
  doc.setFont('helvetica', 'normal');
  const clientTextWidth = doc.getTextWidth('CLIENTE: ');
  doc.text(budget.client_name, margin + clientTextWidth, yPos);

  // Motor Data
  yPos += config.sectionSpacing;
  doc.setFontSize(config.sectionTitleSize);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DO MOTOR', margin, yPos);

  yPos += 3;
  // motor já foi declarado acima no cabeçalho
  
  const motorFields: { label: string; value: string }[] = [];
  if (motor?.equipamento) motorFields.push({ label: 'Equipamento', value: motor.equipamento });
  if (motor?.marca) motorFields.push({ label: 'Marca', value: motor.marca });
  if (motor?.modelo) motorFields.push({ label: 'Modelo', value: motor.modelo });
  if (motor?.numero_serie) motorFields.push({ label: 'Nº Série', value: motor.numero_serie });
  if (motor?.cv) motorFields.push({ label: 'CV', value: motor.cv });
  if (motor?.tensao) motorFields.push({ label: 'Tensão', value: motor.tensao });
  if (motor?.rpm) motorFields.push({ label: 'RPM', value: motor.rpm });
  if (motor?.tipo) motorFields.push({ label: 'Tipo', value: motor.tipo });
  if (motor?.passe) motorFields.push({ label: 'Passe', value: motor.passe });
  if (motor?.espiras) motorFields.push({ label: 'Espiras', value: motor.espiras });
  if (motor?.fios) motorFields.push({ label: 'Nº Fios', value: motor.fios });
  if (motor?.ligacao) motorFields.push({ label: 'Ligação', value: motor.ligacao });
  if (motor?.diametro_externo) motorFields.push({ label: 'Diâm. Ext.', value: motor.diametro_externo });
  if (motor?.comprimento_externo) motorFields.push({ label: 'Comp. Ext.', value: motor.comprimento_externo });
  if (motor?.original !== null && motor?.original !== undefined) motorFields.push({ label: 'Original', value: motor.original ? 'Sim' : 'Não' });

  const motorData: string[][] = [];
  const colsPerRow = compactLevel >= 2 ? 4 : 2;
  
  for (let i = 0; i < motorFields.length; i += colsPerRow) {
    const row: string[] = [];
    for (let j = 0; j < colsPerRow; j++) {
      if (i + j < motorFields.length) {
        row.push(motorFields[i + j].label, motorFields[i + j].value);
      } else {
        row.push('', '');
      }
    }
    motorData.push(row);
  }

  if (motorData.length === 0) {
    motorData.push(['Sem dados', '-', '', '']);
  }

  const motorColumnStyles = compactLevel >= 2 ? {
    0: { fontStyle: 'bold', cellWidth: 18, fillColor: [245, 247, 250] },
    1: { cellWidth: 25 },
    2: { fontStyle: 'bold', cellWidth: 18, fillColor: [245, 247, 250] },
    3: { cellWidth: 25 },
    4: { fontStyle: 'bold', cellWidth: 18, fillColor: [245, 247, 250] },
    5: { cellWidth: 25 },
    6: { fontStyle: 'bold', cellWidth: 18, fillColor: [245, 247, 250] },
    7: { cellWidth: 25 },
  } : {
    0: { fontStyle: 'bold', cellWidth: 30, fillColor: [245, 247, 250] },
    1: { cellWidth: 55 },
    2: { fontStyle: 'bold', cellWidth: 30, fillColor: [245, 247, 250] },
    3: { cellWidth: 55 },
  };

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: motorData,
    theme: 'grid',
    styles: { fontSize: config.motorFontSize, cellPadding: config.motorPadding },
    columnStyles: motorColumnStyles as any,
    margin: { left: margin, right: margin },
  });

  // Laudo Técnico
  yPos = doc.lastAutoTable.finalY + config.sectionSpacing;
  if (hasLaudo) {
    doc.setFontSize(config.sectionTitleSize);
    doc.setFont('helvetica', 'bold');
    doc.text('LAUDO TÉCNICO', margin, yPos);
    yPos += 4;
    doc.setFontSize(config.laudoFontSize);
    doc.setFont('helvetica', 'normal');
    
    const maxLaudoChars = compactLevel === 3 ? 200 : (compactLevel === 2 ? 350 : 1000);
    const laudoText = laudoLength > maxLaudoChars 
      ? budget.laudo_tecnico!.substring(0, maxLaudoChars) + '...'
      : budget.laudo_tecnico!;
    const laudoLines = doc.splitTextToSize(laudoText, pageWidth - (margin * 2));
    doc.text(laudoLines, margin, yPos);
    yPos += laudoLines.length * (config.laudoFontSize * 0.4) + config.sectionSpacing;
  }

  // Peças e Serviços
  doc.setFontSize(config.sectionTitleSize);
  doc.setFont('helvetica', 'bold');
  doc.text('PEÇAS E SERVIÇOS', margin, yPos);

  yPos += 3;
  const itemsData = budget.items.map(item => [
    item.part_name,
    item.quantidade.toString(),
    `R$ ${item.valor_unitario.toFixed(2)}`,
    `R$ ${item.subtotal.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Descrição', 'Qtd', 'Valor Unit.', 'Subtotal']],
    body: itemsData,
    theme: 'striped',
    headStyles: { 
      fillColor: [26, 54, 71], 
      textColor: 255, 
      fontStyle: 'bold', 
      fontSize: config.itemFontSize,
      cellPadding: config.itemPadding 
    },
    styles: { fontSize: config.itemFontSize, cellPadding: config.itemPadding },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'center', cellWidth: 20 },
      2: { halign: 'right', cellWidth: 30 },
      3: { halign: 'right', cellWidth: 30 },
    },
    margin: { left: margin, right: margin },
  });

  // Total com desconto se houver
  yPos = doc.lastAutoTable.finalY + 5;
  const subtotalValue = budget.items.reduce((sum, item) => sum + item.subtotal, 0);
  const descontoPercentual = budget.desconto_percentual || 0;
  const descontoValue = descontoPercentual > 0 ? (subtotalValue * descontoPercentual) / 100 : 0;
  
  if (descontoPercentual > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(`Subtotal: R$ ${subtotalValue.toFixed(2)}`, pageWidth - margin - 5, yPos, { align: 'right' });
    yPos += 5;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(220, 38, 38);
    doc.text(`Desconto (${descontoPercentual}%): - R$ ${descontoValue.toFixed(2)}`, pageWidth - margin - 5, yPos, { align: 'right' });
    yPos += 5;
  }
  
  // Total
  doc.setFillColor(245, 247, 250);
  doc.rect(pageWidth - margin - 70, yPos, 70, 14, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 54, 71);
  doc.text(`TOTAL: R$ ${budget.valor_total.toFixed(2)}`, pageWidth - margin - 5, yPos + 10, { align: 'right' });

  // Assinaturas
  const signatureY = pageHeight - 20;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  doc.line(margin, signatureY, margin + 75, signatureY);
  doc.text('Assinatura do Técnico', margin + 37.5, signatureY + 5, { align: 'center' });

  doc.line(pageWidth - margin - 75, signatureY, pageWidth - margin, signatureY);
  doc.text('Assinatura do Cliente', pageWidth - margin - 37.5, signatureY + 5, { align: 'center' });

  return doc;
}

export function sendBudgetViaWhatsApp(budget: BudgetExpanded, clientPhone?: string): boolean {
  // Validar se tem número de telefone
  if (!clientPhone) {
    return false;
  }
  
  const cleanPhone = cleanPhoneNumber(clientPhone);
  
  if (!cleanPhone) {
    return false;
  }
  
  // Preparar mensagem descritiva completa (sem emojis, texto simples)
  const statusText = budget.status === 'pre_orcamento' ? 'Pré-Orçamento' : 'Orçamento';
  const subtotalValue = budget.items.reduce((sum, item) => sum + item.subtotal, 0);
  const descontoPercentual = budget.desconto_percentual || 0;
  const descontoValue = descontoPercentual > 0 ? (subtotalValue * descontoPercentual) / 100 : 0;
  
  let message = `Olá ${budget.client_name}!\n\n`;
  message += `Segue o ${statusText} #${budget.id.toUpperCase().substring(0, 8)}\n\n`;
  message += `*Detalhes:*\n`;
  message += `Cliente: ${budget.client_name}\n`;
  message += `Data: ${new Date(budget.data).toLocaleDateString('pt-BR')}\n\n`;
  
  // Dados do motor se disponíveis
  if (budget.motor) {
    message += `*Dados do Motor:*\n`;
    if (budget.motor.marca) message += `Marca: ${budget.motor.marca}\n`;
    if (budget.motor.modelo) message += `Modelo: ${budget.motor.modelo}\n`;
    if (budget.motor.cv) message += `CV: ${budget.motor.cv}\n`;
    if (budget.motor.tipo) message += `Tipo: ${budget.motor.tipo}\n`;
    message += `\n`;
  }
  
  // Itens do orçamento
  if (budget.items.length > 0) {
    message += `*Peças e Serviços:*\n`;
    budget.items.forEach((item, index) => {
      message += `${index + 1}. ${item.part_name} - Qtd: ${item.quantidade} - R$ ${item.subtotal.toFixed(2)}\n`;
    });
    message += `\n`;
  }
  
  // Valores
  if (descontoPercentual > 0) {
    message += `Subtotal: R$ ${subtotalValue.toFixed(2)}\n`;
    message += `Desconto (${descontoPercentual}%): - R$ ${descontoValue.toFixed(2)}\n`;
  }
  message += `*Valor Total: R$ ${budget.valor_total.toFixed(2)}*\n\n`;
  
  // Laudo técnico se disponível
  if (budget.laudo_tecnico) {
    const laudoPreview = budget.laudo_tecnico.length > 200 
      ? budget.laudo_tecnico.substring(0, 200) + '...'
      : budget.laudo_tecnico;
    message += `*Laudo Técnico:*\n${laudoPreview}\n\n`;
  }
  
  message += `Atenciosamente,\n`;
  message += `DYQUE & DAYA - Rebobinagem de Motores Elétricos`;
  
  // Abrir WhatsApp apenas com a mensagem (sem gerar/download de PDF)
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
  
  return true;
}

export function exportBudgetToPDF(budget: BudgetExpanded) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  
  // Calcular complexidade do conteúdo
  const itemCount = budget.items.length;
  const hasLaudo = !!budget.laudo_tecnico;
  const laudoLength = budget.laudo_tecnico?.length || 0;
  
  // Determinar nível de compactação (0 = normal, 1 = médio, 2 = compacto, 3 = muito compacto)
  let compactLevel = 0;
  if (itemCount > 15 || (itemCount > 10 && hasLaudo && laudoLength > 200)) {
    compactLevel = 3;
  } else if (itemCount > 10 || (itemCount > 6 && hasLaudo && laudoLength > 150)) {
    compactLevel = 2;
  } else if (itemCount > 6 || (hasLaudo && laudoLength > 100)) {
    compactLevel = 1;
  }
  
  // Configurações responsivas baseadas no nível de compactação
  const config = {
    headerHeight: [45, 40, 35, 32][compactLevel],
    headerFontSize: [20, 18, 16, 14][compactLevel],
    headerSubFontSize: [9, 8, 7, 7][compactLevel],
    sectionTitleSize: [12, 11, 10, 9][compactLevel],
    motorFontSize: [8, 8, 7, 7][compactLevel],
    motorPadding: [2.5, 2, 1.8, 1.5][compactLevel],
    laudoFontSize: [9, 8, 8, 7][compactLevel],
    itemFontSize: [9, 8, 7, 6][compactLevel],
    itemPadding: [3, 2.5, 2, 1.5][compactLevel],
    sectionSpacing: [10, 8, 6, 4][compactLevel],
    signatureSpacing: [35, 30, 25, 20][compactLevel],
  };

  // Header com background
  doc.setFillColor(26, 54, 71);
  doc.rect(0, 0, pageWidth, config.headerHeight, 'F');

  // Company Info
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(config.headerFontSize);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY_NAME, margin, config.headerHeight * 0.35);

  doc.setFontSize(config.headerSubFontSize);
  doc.setFont('helvetica', 'normal');
  doc.text(COMPANY_SUBTITLE, margin, config.headerHeight * 0.52);
  doc.text(`Fone: ${COMPANY_PHONE}`, margin, config.headerHeight * 0.68);
  doc.text(COMPANY_ADDRESS, margin, config.headerHeight * 0.85);

  // Data no canto direito
  doc.setFontSize(config.headerSubFontSize + 1);
  doc.text(`Data: ${new Date(budget.data).toLocaleDateString('pt-BR')}`, pageWidth - margin, config.headerHeight * 0.35, { align: 'right' });

  // Cliente
  let yPos = config.headerHeight + config.sectionSpacing;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(config.sectionTitleSize);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENTE: ', margin, yPos);
  doc.setFont('helvetica', 'normal');
  const clientTextWidth = doc.getTextWidth('CLIENTE: ');
  doc.text(budget.client_name, margin + clientTextWidth, yPos);

  // Motor Data
  yPos += config.sectionSpacing;
  doc.setFontSize(config.sectionTitleSize);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DO MOTOR', margin, yPos);

  yPos += 3;
  const motor = budget.motor;
  
  // Criar lista de campos do motor apenas com valores não nulos/vazios
  const motorFields: { label: string; value: string }[] = [];
  
  if (motor?.equipamento) motorFields.push({ label: 'Equipamento', value: motor.equipamento });
  if (motor?.marca) motorFields.push({ label: 'Marca', value: motor.marca });
  if (motor?.modelo) motorFields.push({ label: 'Modelo', value: motor.modelo });
  if (motor?.numero_serie) motorFields.push({ label: 'Nº Série', value: motor.numero_serie });
  if (motor?.cv) motorFields.push({ label: 'CV', value: motor.cv });
  if (motor?.tensao) motorFields.push({ label: 'Tensão', value: motor.tensao });
  if (motor?.rpm) motorFields.push({ label: 'RPM', value: motor.rpm });
  if (motor?.tipo) motorFields.push({ label: 'Tipo', value: motor.tipo });
  if (motor?.passe) motorFields.push({ label: 'Passe', value: motor.passe });
  if (motor?.espiras) motorFields.push({ label: 'Espiras', value: motor.espiras });
  if (motor?.fios) motorFields.push({ label: 'Nº Fios', value: motor.fios });
  if (motor?.ligacao) motorFields.push({ label: 'Ligação', value: motor.ligacao });
  if (motor?.diametro_externo) motorFields.push({ label: 'Diâm. Ext.', value: motor.diametro_externo });
  if (motor?.comprimento_externo) motorFields.push({ label: 'Comp. Ext.', value: motor.comprimento_externo });
  if (motor?.original !== null && motor?.original !== undefined) motorFields.push({ label: 'Original', value: motor.original ? 'Sim' : 'Não' });

  // Organizar em linhas de 4 colunas (2 pares label/valor)
  const motorData: string[][] = [];
  const colsPerRow = compactLevel >= 2 ? 4 : 2; // 4 pares (8 cols) ou 2 pares (4 cols)
  
  for (let i = 0; i < motorFields.length; i += colsPerRow) {
    const row: string[] = [];
    for (let j = 0; j < colsPerRow; j++) {
      if (i + j < motorFields.length) {
        row.push(motorFields[i + j].label, motorFields[i + j].value);
      } else {
        row.push('', ''); // Células vazias para completar a linha
      }
    }
    motorData.push(row);
  }

  // Se não houver campos, adicionar linha vazia
  if (motorData.length === 0) {
    motorData.push(['Sem dados', '-', '', '']);
  }

  const motorColumnStyles = compactLevel >= 2 ? {
    0: { fontStyle: 'bold', cellWidth: 18, fillColor: [245, 247, 250] },
    1: { cellWidth: 25 },
    2: { fontStyle: 'bold', cellWidth: 18, fillColor: [245, 247, 250] },
    3: { cellWidth: 25 },
    4: { fontStyle: 'bold', cellWidth: 18, fillColor: [245, 247, 250] },
    5: { cellWidth: 25 },
    6: { fontStyle: 'bold', cellWidth: 18, fillColor: [245, 247, 250] },
    7: { cellWidth: 25 },
  } : {
    0: { fontStyle: 'bold', cellWidth: 30, fillColor: [245, 247, 250] },
    1: { cellWidth: 55 },
    2: { fontStyle: 'bold', cellWidth: 30, fillColor: [245, 247, 250] },
    3: { cellWidth: 55 },
  };

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: motorData,
    theme: 'grid',
    styles: { fontSize: config.motorFontSize, cellPadding: config.motorPadding },
    columnStyles: motorColumnStyles as any,
    margin: { left: margin, right: margin },
  });

  // Laudo Técnico
  yPos = doc.lastAutoTable.finalY + config.sectionSpacing;
  if (hasLaudo) {
    doc.setFontSize(config.sectionTitleSize);
    doc.setFont('helvetica', 'bold');
    doc.text('LAUDO TÉCNICO', margin, yPos);
    yPos += 4;
    doc.setFontSize(config.laudoFontSize);
    doc.setFont('helvetica', 'normal');
    
    // Limitar laudo apenas se muito compacto
    const maxLaudoChars = compactLevel === 3 ? 200 : (compactLevel === 2 ? 350 : 1000);
    const laudoText = laudoLength > maxLaudoChars 
      ? budget.laudo_tecnico!.substring(0, maxLaudoChars) + '...'
      : budget.laudo_tecnico!;
    const laudoLines = doc.splitTextToSize(laudoText, pageWidth - (margin * 2));
    doc.text(laudoLines, margin, yPos);
    yPos += laudoLines.length * (config.laudoFontSize * 0.4) + config.sectionSpacing;
  }

  // Peças e Serviços
  doc.setFontSize(config.sectionTitleSize);
  doc.setFont('helvetica', 'bold');
  doc.text('PEÇAS E SERVIÇOS', margin, yPos);

  yPos += 3;
  const itemsData = budget.items.map(item => [
    item.part_name,
    item.quantidade.toString(),
    `R$ ${item.valor_unitario.toFixed(2)}`,
    `R$ ${item.subtotal.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Descrição', 'Qtd', 'Valor Unit.', 'Subtotal']],
    body: itemsData,
    theme: 'striped',
    headStyles: { 
      fillColor: [26, 54, 71], 
      textColor: 255, 
      fontStyle: 'bold', 
      fontSize: config.itemFontSize,
      cellPadding: config.itemPadding 
    },
    styles: { fontSize: config.itemFontSize, cellPadding: config.itemPadding },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'center', cellWidth: 20 },
      2: { halign: 'right', cellWidth: 30 },
      3: { halign: 'right', cellWidth: 30 },
    },
    margin: { left: margin, right: margin },
  });

  // Total com desconto se houver
  yPos = doc.lastAutoTable.finalY + 5;
  const subtotalValue = budget.items.reduce((sum, item) => sum + item.subtotal, 0);
  const descontoPercentual = budget.desconto_percentual || 0;
  const descontoValue = descontoPercentual > 0 ? (subtotalValue * descontoPercentual) / 100 : 0;
  
  if (descontoPercentual > 0) {
    // Subtotal
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(`Subtotal: R$ ${subtotalValue.toFixed(2)}`, pageWidth - margin - 5, yPos, { align: 'right' });
    yPos += 5;
    
    // Desconto
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(220, 38, 38);
    doc.text(`Desconto (${descontoPercentual}%): - R$ ${descontoValue.toFixed(2)}`, pageWidth - margin - 5, yPos, { align: 'right' });
    yPos += 5;
  }
  
  // Total
  doc.setFillColor(245, 247, 250);
  doc.rect(pageWidth - margin - 70, yPos, 70, 14, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 54, 71);
  doc.text(`TOTAL: R$ ${budget.valor_total.toFixed(2)}`, pageWidth - margin - 5, yPos + 10, { align: 'right' });

  // Assinaturas - SEMPRE fixas no final da página
  const signatureY = pageHeight - 20;
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  // Linha e texto do técnico
  doc.line(margin, signatureY, margin + 75, signatureY);
  doc.text('Assinatura do Técnico', margin + 37.5, signatureY + 5, { align: 'center' });

  // Linha e texto do cliente
  doc.line(pageWidth - margin - 75, signatureY, pageWidth - margin, signatureY);
  doc.text('Assinatura do Cliente', pageWidth - margin - 37.5, signatureY + 5, { align: 'center' });

  // Save
  doc.save(`orcamento_${budget.id}_${budget.client_name.replace(/\s+/g, '_')}.pdf`);
}

export function exportMotorHeaderToPDF(budget: BudgetExpanded, clientPhone?: string) {
  // Formato de etiqueta pequena para impressora térmica
  // Tamanho: 50mm x 30mm (largura x altura) - formato retangular (landscape)
  const labelWidth = 50; // mm
  const labelHeight = 30; // mm

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [labelHeight, labelWidth] // [height, width] em landscape
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const margin = 1.5; // Margem ajustada para evitar corte
  const motor = budget.motor;
  const isPreOrcamento = budget.status === 'pre_orcamento';

  // Borda da etiqueta
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);
  doc.rect(margin, margin, pageWidth - (margin * 2), pageHeight - (margin * 2), 'S');

  // Tipo no header (sem fundo colorido, apenas texto)
  // Ajustar posição inicial para dar espaço suficiente para o texto não cortar
  let yPos = margin + 3; // Aumentado de 1.5 para 3mm para evitar corte
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  const headerTitle = isPreOrcamento ? 'PRÉ-ORÇAMENTO' : 'ORÇAMENTO';
  doc.text(headerTitle, pageWidth / 2, yPos, { align: 'center' });

  // Linha 1: Nome do cliente (maior destaque)
  yPos += 4; // Espaçamento ajustado
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  
  // Truncar nome se muito longo (máximo ~35 caracteres para 50mm em landscape)
  const maxNameLength = 35;
  const clientName = budget.client_name.length > maxNameLength
    ? budget.client_name.substring(0, maxNameLength) + '...'
    : budget.client_name;
  
  doc.text(clientName, pageWidth / 2, yPos, { align: 'center', maxWidth: pageWidth - (margin * 2) });

  // Linha 2: Telefone
  yPos += 3.5;
  if (clientPhone) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    // Formatar telefone se necessário
    const formattedPhone = clientPhone.length > 20 
      ? clientPhone.substring(0, 20) + '...'
      : clientPhone;
    doc.text(`Tel: ${formattedPhone}`, pageWidth / 2, yPos, { align: 'center' });
  }

  // Linha 3: Modelo do motor (se couber)
  yPos += 3;
  const motorModel = [
    motor?.marca,
    motor?.modelo
  ].filter(Boolean).join(' ') || '-';

  if (motorModel && motorModel !== '-') {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text('Motor:', margin + 1.5, yPos);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    // Truncar modelo se muito longo (máximo ~30 caracteres em landscape)
    const maxMotorLength = 30;
    const truncatedMotor = motorModel.length > maxMotorLength
      ? motorModel.substring(0, maxMotorLength) + '...'
      : motorModel;
    doc.text(truncatedMotor, margin + 1.5, yPos + 2.5);
    yPos += 2.5; // Ajustar posição após o modelo
  }

  // Linha 4: Potência e polos (se disponível)
  if (motor?.cv) {
    yPos += 2.5; // Espaçamento reduzido para caber tudo
    let potenciaInfo = `${motor.cv} cv`;
    // Tentar extrair polos do campo tipo ou rpm
    const tipoLower = motor.tipo?.toLowerCase() || '';
    const rpmValue = motor.rpm ? parseInt(motor.rpm) : null;
    
    // Extrair polos do campo tipo se contiver "polos" ou número seguido de "p"
    const polosMatch = tipoLower.match(/(\d+)\s*(?:polos?|p)/);
    let polos = polosMatch ? polosMatch[1] : null;
    
    // Se não encontrou nos polos, tentar calcular pelo RPM (aproximado)
    if (!polos && rpmValue) {
      if (rpmValue >= 3000) polos = '2';
      else if (rpmValue >= 1500) polos = '4';
      else if (rpmValue >= 1000) polos = '6';
    }
    
    if (polos) {
      potenciaInfo += ` ${polos} polos`;
    }
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`Potência: ${potenciaInfo}`, margin + 1.5, yPos);
  }

  // Linha 5: Data de entrada (se disponível)
  yPos += 3;
  const dataEntrada = new Date(budget.data).toLocaleDateString('pt-BR');
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`Entrada: ${dataEntrada}`, margin + 1.5, yPos);

  // Linha 6: Número do orçamento (canto inferior direito)
  const shortId = budget.id.toUpperCase().substring(0, 6);
  doc.setFontSize(5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`#${shortId}`, pageWidth - margin - 1, pageHeight - margin - 0.5, { align: 'right' });

  // Save
  doc.save(`etiqueta_motor_${budget.id}_${budget.client_name.replace(/\s+/g, '_')}.pdf`);
}

export function exportClientToPDF(client: Client, budgets: BudgetExpanded[]) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(26, 54, 71);
  doc.rect(0, 0, pageWidth, 55, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY_NAME, 20, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(COMPANY_SUBTITLE, 20, 26);

  doc.setFontSize(8);
  doc.text(`Fone: ${COMPANY_PHONE}`, 20, 34);
  doc.text(COMPANY_ADDRESS, 20, 41);

  doc.setFontSize(12);
  doc.text('Ficha do Cliente', pageWidth - 20, 18, { align: 'right' });
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - 20, 28, { align: 'right' });

  // Client Info
  let yPos = 65;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(client.nome, 20, yPos);

  yPos += 12;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  const clientInfo = [
    ['Endereço', client.endereco || '-'],
    ['Telefone', client.telefone || '-'],
    ['Celular', client.celular || '-'],
    ['Data de Cadastro', new Date(client.created_at).toLocaleDateString('pt-BR')],
    ['Observações', client.observacoes || '-'],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: clientInfo,
    theme: 'plain',
    styles: { fontSize: 11, cellPadding: 4 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40, textColor: [100, 100, 100] },
      1: { cellWidth: 120 },
    },
    margin: { left: 20, right: 20 },
  });

  // Budget History
  yPos = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Histórico de Orçamentos', 20, yPos);

  if (budgets.length > 0) {
    yPos += 5;
    const budgetData = budgets.map(b => [
      `#${b.id.toUpperCase().substring(0, 6)}`,
      new Date(b.data).toLocaleDateString('pt-BR'),
      `${b.motor?.marca || ''} ${b.motor?.modelo || ''}`.trim() || '-',
      `R$ ${b.valor_total.toFixed(2)}`,
      b.status === 'baixado' ? 'Baixado' : b.status === 'concluido' ? 'Concluído' : 'Pendente',
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Código', 'Data', 'Motor', 'Valor', 'Status']],
      body: budgetData,
      theme: 'striped',
      headStyles: { fillColor: [26, 54, 71], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 4 },
      margin: { left: 20, right: 20 },
    });
  } else {
    yPos += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text('Nenhum orçamento registrado.', 20, yPos);
  }

  // Save
  doc.save(`cliente_${client.nome.replace(/\s+/g, '_')}.pdf`);
}
