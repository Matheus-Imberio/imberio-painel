import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useData, Motor } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowLeft, 
  Download, 
  Edit,
  Trash2,
  Save,
  X,
  Cog,
  FileText,
  User,
  Calendar,
  Camera,
  CheckCircle,
  ArrowRight,
  Plus,
  Pencil,
  MessageCircle,
  Check,
  ChevronsUpDown,
  Image as ImageIcon,
  Star
} from 'lucide-react';
import { exportBudgetToPDF, exportMotorHeaderToPDF, sendBudgetViaWhatsApp } from '@/lib/pdfExport';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function BudgetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { 
    getBudget, 
    updateBudget, 
    deleteBudget, 
    getClient, 
    updateBudgetMotor,
    addBudgetItem,
    updateBudgetItem,
    removeBudgetItem,
    addBudgetPhotos,
    setBudgetCoverPhoto,
    deleteBudgetPhoto,
    refreshBudgets,
    parts,
    isLoading,
    ensureClientsLoaded,
    ensurePartsLoaded,
    ensureBudgetsLoaded,
    clientsLoaded,
    partsLoaded,
    budgetsLoaded,
    clientsLoading,
    partsLoading,
    budgetsLoading,
  } = useData();
  const navigate = useNavigate();
  
  const isAdmin = user?.role === 'admin';
  const basePath = isAdmin ? '/admin' : '/operador';
  
  const budget = getBudget(id || '');

  useEffect(() => {
    ensureClientsLoaded();
    ensurePartsLoaded();
    ensureBudgetsLoaded();
  }, [ensureClientsLoaded, ensurePartsLoaded, ensureBudgetsLoaded]);

  const dataLoading =
    isLoading ||
    (clientsLoading && !clientsLoaded) ||
    (partsLoading && !partsLoaded) ||
    (budgetsLoading && !budgetsLoaded);
  
  // Calcular valores com desconto
  const subtotalValue = budget ? budget.items.reduce((sum, item) => sum + item.subtotal, 0) : 0;
  const descontoPercentual = budget?.desconto_percentual || 0;
  const descontoValue = descontoPercentual > 0 ? (subtotalValue * descontoPercentual) / 100 : 0;
  const valorTotalComDesconto = subtotalValue - descontoValue;
  
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingMotor, setIsEditingMotor] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [partComboboxOpen, setPartComboboxOpen] = useState(false);
  
  const [editData, setEditData] = useState({
    laudo_tecnico: budget?.laudo_tecnico || '',
    observacoes: budget?.observacoes || '',
    status: budget?.status || 'pendente' as 'pre_orcamento' | 'pendente' | 'concluido' | 'baixado',
    desconto_percentual: budget?.desconto_percentual || 0,
    data: budget ? budget.data.substring(0, 10) : '',
  });
  
  const [hasDescontoEdit, setHasDescontoEdit] = useState(!!budget?.desconto_percentual);
  
  const [motorData, setMotorData] = useState<Partial<Motor>>({
    equipamento: budget?.motor?.equipamento || '',
    marca: budget?.motor?.marca || '',
    modelo: budget?.motor?.modelo || '',
    numero_serie: budget?.motor?.numero_serie || '',
    cv: budget?.motor?.cv || '',
    tensao: budget?.motor?.tensao || '',
    rpm: budget?.motor?.rpm || '',
    tipo: budget?.motor?.tipo || '',
    passe: budget?.motor?.passe || '',
    espiras: budget?.motor?.espiras || '',
    fios: budget?.motor?.fios || '',
    ligacao: budget?.motor?.ligacao || '',
    diametro_externo: budget?.motor?.diametro_externo || '',
    comprimento_externo: budget?.motor?.comprimento_externo || '',
    original: budget?.motor?.original || false,
    partida: budget?.motor?.partida || '',
    trabalho: budget?.motor?.trabalho || '',
  });
  
  const [newItem, setNewItem] = useState({
    part_id: '',
    quantidade: 1,
    valor_unitario: 0,
  });
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedTipoPagamento, setSelectedTipoPagamento] = useState<string>('');
  // Estado local do campo R$ para permitir digitar livremente (ex: "5,50"); null = mostrar valor calculado
  const [descontoReaisInput, setDescontoReaisInput] = useState<string | null>(null);
  const [descontoPercentualInput, setDescontoPercentualInput] = useState<string | null>(null);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const rearCameraInputRef = useRef<HTMLInputElement>(null);
  const frontCameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const TIPOS_PAGAMENTO = [
    { value: 'dinheiro', label: 'Dinheiro' },
    { value: 'pix', label: 'PIX' },
    { value: 'cartao_credito', label: 'Cartão de Crédito' },
    { value: 'cartao_debito', label: 'Cartão de Débito' },
    { value: 'transferencia', label: 'Transferência Bancária' },
    { value: 'boleto', label: 'Boleto' },
    { value: 'outro', label: 'Outro' },
  ];
  const getTipoPagamentoLabel = (value: string) => TIPOS_PAGAMENTO.find(t => t.value === value)?.label ?? value;

  // Atualizar estados quando o budget mudar
  useEffect(() => {
    if (budget) {
      setEditData({
        laudo_tecnico: budget.laudo_tecnico || '',
        observacoes: budget.observacoes || '',
        status: budget.status || 'pendente',
        desconto_percentual: budget.desconto_percentual || 0,
        data: budget.data ? budget.data.substring(0, 10) : '',
      });
      setHasDescontoEdit(!!budget.desconto_percentual);
      setMotorData({
        equipamento: budget.motor?.equipamento || '',
        marca: budget.motor?.marca || '',
        modelo: budget.motor?.modelo || '',
        numero_serie: budget.motor?.numero_serie || '',
        cv: budget.motor?.cv || '',
        tensao: budget.motor?.tensao || '',
        rpm: budget.motor?.rpm || '',
        tipo: budget.motor?.tipo || '',
        passe: budget.motor?.passe || '',
        espiras: budget.motor?.espiras || '',
        fios: budget.motor?.fios || '',
        ligacao: budget.motor?.ligacao || '',
        diametro_externo: budget.motor?.diametro_externo || '',
        comprimento_externo: budget.motor?.comprimento_externo || '',
        original: budget.motor?.original || false,
        partida: budget.motor?.partida || '',
        trabalho: budget.motor?.trabalho || '',
      });
    }
  }, [budget]);

  if (dataLoading) {
    return (
      <DashboardLayout title="Carregando...">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados do orçamento...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!budget) {
    return (
      <DashboardLayout title="Orçamento não encontrado">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">O orçamento solicitado não foi encontrado.</p>
          <Button onClick={() => navigate(basePath)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const handleEdit = () => {
    setEditData({
      laudo_tecnico: budget.laudo_tecnico || '',
      observacoes: budget.observacoes || '',
      status: budget.status || 'pendente',
      desconto_percentual: budget.desconto_percentual || 0,
      data: budget.data ? budget.data.substring(0, 10) : '',
    });
    setHasDescontoEdit(!!budget.desconto_percentual);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setIsEditingMotor(false);
    setIsAddingItem(false);
    setEditingItemId(null);
    setEditData({
      laudo_tecnico: budget.laudo_tecnico || '',
      observacoes: budget.observacoes || '',
      status: budget.status || 'pendente',
      desconto_percentual: budget.desconto_percentual || 0,
      data: budget.data ? budget.data.substring(0, 10) : '',
    });
    setHasDescontoEdit(!!budget.desconto_percentual);
    setMotorData({
      equipamento: budget?.motor?.equipamento || '',
      marca: budget?.motor?.marca || '',
      modelo: budget?.motor?.modelo || '',
      numero_serie: budget?.motor?.numero_serie || '',
      cv: budget?.motor?.cv || '',
      tensao: budget?.motor?.tensao || '',
      rpm: budget?.motor?.rpm || '',
      tipo: budget?.motor?.tipo || '',
      passe: budget?.motor?.passe || '',
      espiras: budget?.motor?.espiras || '',
      fios: budget?.motor?.fios || '',
      ligacao: budget?.motor?.ligacao || '',
      diametro_externo: budget?.motor?.diametro_externo || '',
      comprimento_externo: budget?.motor?.comprimento_externo || '',
      original: budget?.motor?.original || false,
      partida: budget?.motor?.partida || '',
      trabalho: budget?.motor?.trabalho || '',
    });
    setNewItem({ part_id: '', quantidade: 1, valor_unitario: 0 });
  };

  const performSave = async (payload: { status: typeof editData.status; tipo_pagamento?: string | null }) => {
    const subtotal = budget.items.reduce((sum, item) => sum + item.subtotal, 0);
    const desconto = hasDescontoEdit && editData.desconto_percentual > 0
      ? (subtotal * editData.desconto_percentual) / 100
      : 0;
    const novoValorTotal = subtotal - desconto;
    await updateBudget(budget.id, {
      ...editData,
      ...payload,
      valor_total: novoValorTotal,
      desconto_percentual: hasDescontoEdit ? editData.desconto_percentual : undefined,
    });
    setIsEditing(false);
    setIsEditingMotor(false);
    setIsAddingItem(false);
    setEditingItemId(null);
    setShowPaymentModal(false);
    setSelectedTipoPagamento('');
    await refreshBudgets();
    toast.success('Orçamento atualizado com sucesso!');
  };

  const handleSaveEdit = async () => {
    // Validar desconto para operador (máximo 7%)
    if (hasDescontoEdit && !isAdmin && editData.desconto_percentual > 7) {
      toast.error('Operadores podem dar no máximo 7% de desconto.');
      return;
    }
    
    // Validar desconto para admin (máximo 100%)
    if (hasDescontoEdit && isAdmin && editData.desconto_percentual > 100) {
      toast.error('O desconto máximo é de 100%.');
      return;
    }

    if (!editData.data) {
      toast.error('Informe a data do orçamento.');
      return;
    }

    // Ao marcar como Baixado, abrir modal para escolher tipo de pagamento
    if (editData.status === 'baixado') {
      setShowPaymentModal(true);
      return;
    }
    
    await performSave({ status: editData.status });
  };

  const handleConfirmBaixado = async () => {
    if (!selectedTipoPagamento) {
      toast.error('Selecione o tipo de pagamento.');
      return;
    }
    await performSave({ status: 'baixado', tipo_pagamento: selectedTipoPagamento });
  };

  const handleEditMotor = () => {
    setMotorData({
      equipamento: budget?.motor?.equipamento || '',
      marca: budget?.motor?.marca || '',
      modelo: budget?.motor?.modelo || '',
      numero_serie: budget?.motor?.numero_serie || '',
      cv: budget?.motor?.cv || '',
      tensao: budget?.motor?.tensao || '',
      rpm: budget?.motor?.rpm || '',
      tipo: budget?.motor?.tipo || '',
      passe: budget?.motor?.passe || '',
      espiras: budget?.motor?.espiras || '',
      fios: budget?.motor?.fios || '',
      ligacao: budget?.motor?.ligacao || '',
      diametro_externo: budget?.motor?.diametro_externo || '',
      comprimento_externo: budget?.motor?.comprimento_externo || '',
      original: budget?.motor?.original || false,
      partida: budget?.motor?.partida || '',
      trabalho: budget?.motor?.trabalho || '',
    });
    setIsEditingMotor(true);
  };

  const handleSaveMotor = async () => {
    const success = await updateBudgetMotor(budget.id, motorData);
    if (success) {
      setIsEditingMotor(false);
      await refreshBudgets();
      toast.success('Dados do motor atualizados com sucesso!');
    } else {
      toast.error('Erro ao atualizar dados do motor');
    }
  };

  const handleAddItem = () => {
    setNewItem({ part_id: '', quantidade: 1, valor_unitario: 0 });
    setIsAddingItem(true);
  };

  const handleSaveItem = async () => {
    if (!newItem.part_id) {
      toast.error('Selecione uma peça ou serviço');
      return;
    }
    if (newItem.quantidade <= 0) {
      toast.error('Quantidade deve ser maior que zero');
      return;
    }
    if (newItem.valor_unitario <= 0) {
      toast.error('Valor unitário deve ser maior que zero');
      return;
    }
    
    const success = await addBudgetItem(budget.id, newItem);
    if (success) {
      setIsAddingItem(false);
      setNewItem({ part_id: '', quantidade: 1, valor_unitario: 0 });
      await refreshBudgets();
      toast.success('Peça adicionada com sucesso!');
    } else {
      toast.error('Erro ao adicionar peça');
    }
  };

  const handleEditItem = (itemId: string) => {
    const item = budget.items.find(i => i.id === itemId);
    if (item) {
      setNewItem({
        part_id: item.part_id,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
      });
      setEditingItemId(itemId);
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItemId) return;
    if (newItem.quantidade <= 0) {
      toast.error('Quantidade deve ser maior que zero');
      return;
    }
    if (newItem.valor_unitario <= 0) {
      toast.error('Valor unitário deve ser maior que zero');
      return;
    }
    
    const success = await updateBudgetItem(editingItemId, {
      quantidade: newItem.quantidade,
      valor_unitario: newItem.valor_unitario,
    });
    if (success) {
      setEditingItemId(null);
      setNewItem({ part_id: '', quantidade: 1, valor_unitario: 0 });
      await refreshBudgets();
      toast.success('Peça atualizada com sucesso!');
    } else {
      toast.error('Erro ao atualizar peça');
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    const success = await removeBudgetItem(budget.id, itemId);
    if (success) {
      await refreshBudgets();
      toast.success('Peça removida com sucesso!');
    } else {
      toast.error('Erro ao remover peça');
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const success = await deleteBudget(budget.id);
    setIsDeleting(false);
    
    if (success) {
      toast.success('Orçamento excluído com sucesso!');
      navigate(`${basePath}/orcamentos`);
    } else {
      toast.error('Erro ao excluir orçamento');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pre_orcamento':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">Pré-Orçamento</span>;
      case 'baixado':
        return <span className="badge-success">Baixado</span>;
      case 'concluido':
        return <span className="badge-warning">Concluído</span>;
      default:
        return <span className="badge-pending">Pendente</span>;
    }
  };

  // Opções de status baseadas no role do usuário (operador vê todas as fases: pendente, concluído, baixado)
  const getStatusOptions = () => {
    const currentStatus = budget?.status || 'pendente';
    
    if (isAdmin) {
      // Admin pode mudar para qualquer status
      return ['pre_orcamento', 'pendente', 'concluido', 'baixado'];
    } else {
      // Operador: a partir de pendente já vê Pendente, Concluído e Baixado (não precisa passar por Concluído)
      if (currentStatus === 'pre_orcamento') {
        return ['pre_orcamento', 'pendente'];
      } else if (currentStatus === 'pendente' || currentStatus === 'concluido') {
        return ['pendente', 'concluido', 'baixado'];
      } else {
        return [currentStatus]; // Baixado - não pode mudar
      }
    }
  };

  // Converter pré-orçamento em orçamento
  const handleConvertToOrcamento = async () => {
    if (budget.items.length === 0) {
      toast.error('Adicione peças e serviços antes de converter para orçamento.');
      return;
    }
    setIsConverting(true);
    await updateBudget(budget.id, { status: 'pendente' });
    setIsConverting(false);
    toast.success('Pré-orçamento convertido em orçamento!');
  };

  const handlePhotoSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []).filter(file => 
      file.type.startsWith('image/') || 
      ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'].some(ext => file.name.toLowerCase().endsWith('.' + ext)) ||
      !file.type || 
      file.type === 'application/octet-stream'
    );
    if (files.length === 0) {
      toast.error('Selecione uma ou mais imagens.');
      event.target.value = '';
      return;
    }

    setIsUploadingPhotos(true);
    const success = await addBudgetPhotos(budget.id, files);
    setIsUploadingPhotos(false);
    event.target.value = '';

    if (success) {
      toast.success(files.length === 1 ? 'Foto adicionada ao orçamento.' : 'Fotos adicionadas ao orçamento.');
    } else {
      toast.error('Erro ao adicionar fotos. Verifique o tamanho dos arquivos e tente novamente.');
    }
  };

  const handleSetCoverPhoto = async (photoId: string) => {
    const success = await setBudgetCoverPhoto(budget.id, photoId);
    if (success) {
      toast.success('Capa do orçamento atualizada.');
    } else {
      toast.error('Erro ao definir a capa do orçamento.');
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    const success = await deleteBudgetPhoto(budget.id, photoId);
    if (success) {
      toast.success('Foto removida do orçamento.');
    } else {
      toast.error('Erro ao remover foto do orçamento.');
    }
  };

  return (
    <DashboardLayout 
      title={`Orçamento #${budget.id.toUpperCase().substring(0, 8)}`}
      subtitle={`Cliente: ${budget.client_name}`}
      actions={
        <div className="flex max-w-full flex-wrap items-center justify-end gap-1.5 sm:gap-2">
          {/* Voltar - ícone no mobile */}
          <Button variant="ghost" size="sm" className="hidden md:flex h-9 px-2 lg:px-3" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          
          {/* Exportar PDF */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="btn-pdf h-9 px-2 lg:px-3">
                <Download className="w-4 h-4 lg:mr-2" />
                <span className="hidden lg:inline">Exportar</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportBudgetToPDF(budget)}>
                <FileText className="w-4 h-4 mr-2" />
                PDF do Orçamento
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                const client = getClient(budget.client_id);
                const clientPhone = client?.telefone || client?.celular || '';
                exportMotorHeaderToPDF(budget, clientPhone);
              }}>
                <Download className="w-4 h-4 mr-2" />
                PDF da Etiqueta
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                const client = getClient(budget.client_id);
                const clientPhone = client?.telefone || client?.celular || '';
                const success = sendBudgetViaWhatsApp(budget, clientPhone);
                if (!success) {
                  toast.error('Cliente não possui número de WhatsApp cadastrado ou número inválido.');
                } else {
                  toast.success('WhatsApp aberto! O PDF foi baixado e pode ser anexado na conversa.');
                }
              }}>
                <MessageCircle className="w-4 h-4 mr-2" />
                Enviar via WhatsApp
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {!isEditing ? (
            <>
              {budget.status === 'pre_orcamento' && (
                <Button 
                  onClick={handleConvertToOrcamento}
                  disabled={isConverting}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white h-9 px-2 lg:px-3"
                >
                  {isConverting ? '...' : (
                    <>
                      <ArrowRight className="w-4 h-4 lg:mr-2" />
                      <span className="hidden lg:inline">Converter</span>
                    </>
                  )}
                </Button>
              )}
              
              <Button variant="outline" size="sm" className="h-9 px-2 lg:px-3" onClick={handleEdit}>
                <Edit className="w-4 h-4 lg:mr-2" />
                <span className="hidden lg:inline">Editar</span>
              </Button>
              
              {isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="h-9 px-2 lg:px-3">
                      <Trash2 className="w-4 h-4 lg:mr-2" />
                      <span className="hidden lg:inline">Excluir</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir Orçamento</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={isDeleting}
                      >
                        {isDeleting ? 'Excluindo...' : 'Excluir'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="h-9 px-2 lg:px-3" onClick={handleCancelEdit}>
                <X className="w-4 h-4 lg:mr-2" />
                <span className="hidden lg:inline">Cancelar</span>
              </Button>
              <Button onClick={handleSaveEdit} size="sm" className="btn-industrial-accent h-9 px-2 lg:px-3">
                <Save className="w-4 h-4 lg:mr-2" />
                <span className="hidden lg:inline">Salvar</span>
              </Button>
            </>
          )}
        </div>
      }
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Header Info */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          <div className="card-industrial p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs text-muted-foreground">Cliente</p>
              <p className="font-semibold text-xs sm:text-sm truncate">{budget.client_name}</p>
            </div>
          </div>
          
          <div className="card-industrial p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs text-muted-foreground">Data</p>
              {isEditing ? (
                <Input
                  type="date"
                  className="mt-1 h-7 sm:h-8 text-xs sm:text-sm"
                  value={editData.data}
                  onChange={(e) => setEditData(prev => ({ ...prev, data: e.target.value }))}
                />
              ) : (
                <p className="font-semibold text-xs sm:text-sm">
                  {new Date(budget.data).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
          </div>
          
          <div className="card-industrial p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs text-muted-foreground">Status</p>
              {isEditing ? (
                <Select 
                  value={editData.status} 
                  onValueChange={(v) => setEditData(prev => ({ ...prev, status: v as 'pre_orcamento' | 'pendente' | 'concluido' | 'baixado' }))}
                  disabled={getStatusOptions().length <= 1}
                >
                  <SelectTrigger className="h-7 sm:h-8 w-full mt-1 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getStatusOptions().includes('pre_orcamento') && (
                      <SelectItem value="pre_orcamento">Pré-Orçamento</SelectItem>
                    )}
                    {getStatusOptions().includes('pendente') && (
                      <SelectItem value="pendente">Pendente</SelectItem>
                    )}
                    {getStatusOptions().includes('concluido') && (
                      <SelectItem value="concluido">Concluído</SelectItem>
                    )}
                    {getStatusOptions().includes('baixado') && (
                      <SelectItem value="baixado">Baixado</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              ) : (
                <div>
                  <div className="text-xs sm:text-sm">{getStatusBadge(budget.status)}</div>
                  {budget.status === 'baixado' && budget.tipo_pagamento && (
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                      Pagamento: {getTipoPagamentoLabel(budget.tipo_pagamento)}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="card-industrial p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
              <span className="text-sm sm:text-base font-bold text-accent">R$</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs text-muted-foreground">Valor Total</p>
              <p className="font-bold text-sm sm:text-lg text-primary">
                R$ {budget.valor_total.toFixed(2)}
                {descontoPercentual > 0 && (
                  <span className="text-[10px] sm:text-xs font-normal text-muted-foreground block">
                    ({descontoPercentual}% desc.)
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Fotos do Orçamento */}
        <div className="card-industrial">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm sm:text-lg font-semibold">Fotos do Orçamento</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {budget.photos.length} foto(s) anexada(s)
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                ref={rearCameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoSelection}
              />
              <input
                ref={frontCameraInputRef}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={handlePhotoSelection}
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoSelection}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                disabled={isUploadingPhotos}
                onClick={() => rearCameraInputRef.current?.click()}
              >
                {isUploadingPhotos ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="spinner h-4 w-4" />
                    Enviando...
                  </span>
                ) : (
                  <>
                    <Camera className="w-4 h-4 mr-2" />
                    Traseira
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                disabled={isUploadingPhotos}
                onClick={() => frontCameraInputRef.current?.click()}
              >
                <Camera className="w-4 h-4 mr-2" />
                Frontal
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                disabled={isUploadingPhotos}
                onClick={() => galleryInputRef.current?.click()}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Galeria
              </Button>
            </div>
          </div>

          {budget.photos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {budget.photos.map(photo => (
                <div key={photo.id} className="rounded-lg border border-border bg-muted/30 overflow-hidden">
                  <div className="relative aspect-square bg-muted">
                    <img
                      src={photo.public_url}
                      alt={photo.is_cover ? 'Capa do orçamento' : 'Foto do orçamento'}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    {photo.is_cover && (
                      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-1 text-xs font-semibold text-accent-foreground">
                        <Star className="h-3 w-3 fill-current" />
                        Capa
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-1 p-2">
                    <Button
                      type="button"
                      variant={photo.is_cover ? 'secondary' : 'outline'}
                      size="sm"
                      className="h-8 px-2 text-xs"
                      disabled={photo.is_cover}
                      onClick={() => handleSetCoverPhoto(photo.id)}
                    >
                      <Star className="h-3.5 w-3.5 sm:mr-1" />
                      <span className="hidden sm:inline">Capa</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs text-destructive hover:text-destructive"
                      onClick={() => handleDeletePhoto(photo.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 sm:mr-1" />
                      <span className="hidden sm:inline">Remover</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border-2 border-dashed border-border bg-muted/20 p-6 text-center">
              <Camera className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">Nenhuma foto adicionada ainda.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Use a câmera do celular ou selecione imagens do dispositivo.
              </p>
            </div>
          )}
        </div>

        {/* Motor Data */}
        <div className="card-industrial">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Cog className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm sm:text-lg font-semibold">Dados Técnicos do Motor</h3>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Especificações do motor</p>
              </div>
            </div>
            {isEditing && !isEditingMotor && (
              <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={handleEditMotor}>
                <Pencil className="w-4 h-4 mr-2" />
                Editar Motor
              </Button>
            )}
            {isEditingMotor && (
              <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="ghost" size="sm" className="flex-1 sm:flex-none" onClick={() => {
                  setIsEditingMotor(false);
                  setMotorData({
                    equipamento: budget?.motor?.equipamento || '',
                    marca: budget?.motor?.marca || '',
                    modelo: budget?.motor?.modelo || '',
                    numero_serie: budget?.motor?.numero_serie || '',
                    cv: budget?.motor?.cv || '',
                    tensao: budget?.motor?.tensao || '',
                    rpm: budget?.motor?.rpm || '',
                    tipo: budget?.motor?.tipo || '',
                    passe: budget?.motor?.passe || '',
                    espiras: budget?.motor?.espiras || '',
                    fios: budget?.motor?.fios || '',
                    ligacao: budget?.motor?.ligacao || '',
                    diametro_externo: budget?.motor?.diametro_externo || '',
                    comprimento_externo: budget?.motor?.comprimento_externo || '',
                    original: budget?.motor?.original || false,
                    partida: budget?.motor?.partida || '',
                    trabalho: budget?.motor?.trabalho || '',
                  });
                }}>
                  <X className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Cancelar</span>
                </Button>
                <Button size="sm" className="flex-1 sm:flex-none btn-industrial-accent" onClick={handleSaveMotor}>
                  <Save className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Salvar</span>
                </Button>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-lg bg-muted/50">
              <Label className="text-[10px] sm:text-xs text-muted-foreground uppercase mb-1 block">Equipamento</Label>
              {isEditingMotor ? (
                <Input
                  value={motorData.equipamento || ''}
                  onChange={(e) => setMotorData(prev => ({ ...prev, equipamento: e.target.value }))}
                  className="mt-1 h-8 sm:h-9 text-xs sm:text-sm"
                />
              ) : (
                <p className="font-medium text-xs sm:text-sm truncate">{budget.motor?.equipamento || '-'}</p>
              )}
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-muted/50">
              <Label className="text-[10px] sm:text-xs text-muted-foreground uppercase mb-1 block">Marca</Label>
              {isEditingMotor ? (
                <Input
                  value={motorData.marca || ''}
                  onChange={(e) => setMotorData(prev => ({ ...prev, marca: e.target.value }))}
                  className="mt-1 h-8 sm:h-9 text-xs sm:text-sm"
                />
              ) : (
                <p className="font-medium text-xs sm:text-sm truncate">{budget.motor?.marca || '-'}</p>
              )}
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-muted/50">
              <Label className="text-[10px] sm:text-xs text-muted-foreground uppercase mb-1 block">Modelo</Label>
              {isEditingMotor ? (
                <Input
                  value={motorData.modelo || ''}
                  onChange={(e) => setMotorData(prev => ({ ...prev, modelo: e.target.value }))}
                  className="mt-1 h-8 sm:h-9 text-xs sm:text-sm"
                />
              ) : (
                <p className="font-medium text-xs sm:text-sm truncate">{budget.motor?.modelo || '-'}</p>
              )}
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-muted/50">
              <Label className="text-[10px] sm:text-xs text-muted-foreground uppercase mb-1 block">Nº Série</Label>
              {isEditingMotor ? (
                <Input
                  value={motorData.numero_serie || ''}
                  onChange={(e) => setMotorData(prev => ({ ...prev, numero_serie: e.target.value }))}
                  className="mt-1 h-8 sm:h-9 text-xs sm:text-sm"
                />
              ) : (
                <p className="font-medium text-xs sm:text-sm truncate">{budget.motor?.numero_serie || '-'}</p>
              )}
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-muted/50">
              <Label className="text-[10px] sm:text-xs text-muted-foreground uppercase mb-1 block">CV</Label>
              {isEditingMotor ? (
                <Input
                  value={motorData.cv || ''}
                  onChange={(e) => setMotorData(prev => ({ ...prev, cv: e.target.value }))}
                  className="mt-1 h-8 sm:h-9 text-xs sm:text-sm"
                />
              ) : (
                <p className="font-medium text-xs sm:text-sm truncate">{budget.motor?.cv || '-'}</p>
              )}
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-muted/50">
              <Label className="text-[10px] sm:text-xs text-muted-foreground uppercase mb-1 block">Tensão</Label>
              {isEditingMotor ? (
                <Input
                  value={motorData.tensao || ''}
                  onChange={(e) => setMotorData(prev => ({ ...prev, tensao: e.target.value }))}
                  className="mt-1 h-8 sm:h-9 text-xs sm:text-sm"
                />
              ) : (
                <p className="font-medium text-xs sm:text-sm truncate">{budget.motor?.tensao || '-'}</p>
              )}
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-muted/50">
              <Label className="text-[10px] sm:text-xs text-muted-foreground uppercase mb-1 block">Passe</Label>
              {isEditingMotor ? (
                <Input
                  value={motorData.passe || ''}
                  onChange={(e) => setMotorData(prev => ({ ...prev, passe: e.target.value }))}
                  className="mt-1 h-8 sm:h-9 text-xs sm:text-sm"
                />
              ) : (
                <p className="font-medium text-xs sm:text-sm truncate">{budget.motor?.passe || '-'}</p>
              )}
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-muted/50">
              <Label className="text-[10px] sm:text-xs text-muted-foreground uppercase mb-1 block">Espiras</Label>
              {isEditingMotor ? (
                <Input
                  value={motorData.espiras || ''}
                  onChange={(e) => setMotorData(prev => ({ ...prev, espiras: e.target.value }))}
                  className="mt-1 h-8 sm:h-9 text-xs sm:text-sm"
                />
              ) : (
                <p className="font-medium text-xs sm:text-sm truncate">{budget.motor?.espiras || '-'}</p>
              )}
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-muted/50">
              <Label className="text-[10px] sm:text-xs text-muted-foreground uppercase mb-1 block">Nº Fios</Label>
              {isEditingMotor ? (
                <Input
                  value={motorData.fios || ''}
                  onChange={(e) => setMotorData(prev => ({ ...prev, fios: e.target.value }))}
                  className="mt-1 h-8 sm:h-9 text-xs sm:text-sm"
                />
              ) : (
                <p className="font-medium text-xs sm:text-sm truncate">{budget.motor?.fios || '-'}</p>
              )}
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-muted/50">
              <Label className="text-[10px] sm:text-xs text-muted-foreground uppercase mb-1 block">Ligação</Label>
              {isEditingMotor ? (
                <Input
                  value={motorData.ligacao || ''}
                  onChange={(e) => setMotorData(prev => ({ ...prev, ligacao: e.target.value }))}
                  className="mt-1 h-8 sm:h-9 text-xs sm:text-sm"
                />
              ) : (
                <p className="font-medium text-xs sm:text-sm truncate">{budget.motor?.ligacao || '-'}</p>
              )}
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-muted/50">
              <Label className="text-[10px] sm:text-xs text-muted-foreground uppercase mb-1 block">RPM</Label>
              {isEditingMotor ? (
                <Input
                  value={motorData.rpm || ''}
                  onChange={(e) => setMotorData(prev => ({ ...prev, rpm: e.target.value }))}
                  className="mt-1 h-8 sm:h-9 text-xs sm:text-sm"
                />
              ) : (
                <p className="font-medium text-xs sm:text-sm truncate">{budget.motor?.rpm || '-'}</p>
              )}
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-muted/50">
              <Label className="text-[10px] sm:text-xs text-muted-foreground uppercase mb-1 block">Tipo</Label>
              {isEditingMotor ? (
                <Input
                  value={motorData.tipo || ''}
                  onChange={(e) => setMotorData(prev => ({ ...prev, tipo: e.target.value }))}
                  className="mt-1 h-8 sm:h-9 text-xs sm:text-sm"
                />
              ) : (
                <p className="font-medium text-xs sm:text-sm truncate">{budget.motor?.tipo || '-'}</p>
              )}
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-muted/50">
              <Label className="text-[10px] sm:text-xs text-muted-foreground uppercase mb-1 block">Diâm. Externo</Label>
              {isEditingMotor ? (
                <Input
                  value={motorData.diametro_externo || ''}
                  onChange={(e) => setMotorData(prev => ({ ...prev, diametro_externo: e.target.value }))}
                  className="mt-1 h-8 sm:h-9 text-xs sm:text-sm"
                />
              ) : (
                <p className="font-medium text-xs sm:text-sm truncate">{budget.motor?.diametro_externo || '-'}</p>
              )}
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-muted/50">
              <Label className="text-[10px] sm:text-xs text-muted-foreground uppercase mb-1 block">Comp. Externo</Label>
              {isEditingMotor ? (
                <Input
                  value={motorData.comprimento_externo || ''}
                  onChange={(e) => setMotorData(prev => ({ ...prev, comprimento_externo: e.target.value }))}
                  className="mt-1 h-8 sm:h-9 text-xs sm:text-sm"
                />
              ) : (
                <p className="font-medium text-xs sm:text-sm truncate">{budget.motor?.comprimento_externo || '-'}</p>
              )}
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-muted/50">
              <Label className="text-[10px] sm:text-xs text-muted-foreground uppercase mb-1 block">Original</Label>
              {isEditingMotor ? (
                <div className="flex items-center gap-2 mt-2">
                  <Checkbox
                    checked={motorData.original || false}
                    onCheckedChange={(checked) => setMotorData(prev => ({ ...prev, original: checked === true }))}
                  />
                  <span className="text-sm">Sim</span>
                </div>
              ) : (
                <p className="font-medium text-xs sm:text-sm truncate">{budget.motor?.original ? 'Sim' : 'Não'}</p>
              )}
            </div>
            {/* Partida e Trabalho – apenas para motores monofásicos */}
            {(isEditingMotor
              ? (motorData.tipo?.toLowerCase().includes('mono') || motorData.tensao?.includes('110') || motorData.tensao?.includes('220'))
              : (budget.motor?.tipo?.toLowerCase().includes('mono') || budget.motor?.tensao?.includes('110') || budget.motor?.tensao?.includes('220'))
            ) && (
              <>
                <div className="p-2 sm:p-3 rounded-lg bg-muted/50">
                  <Label className="text-[10px] sm:text-xs text-muted-foreground uppercase mb-1 block">Partida</Label>
                  {isEditingMotor ? (
                    <Input
                      value={motorData.partida || ''}
                      onChange={(e) => setMotorData(prev => ({ ...prev, partida: e.target.value }))}
                      className="mt-1 h-8 sm:h-9 text-xs sm:text-sm"
                      placeholder="Ex: Capacitor"
                    />
                  ) : (
                    <p className="font-medium text-xs sm:text-sm truncate">{budget.motor?.partida || '-'}</p>
                  )}
                </div>
                <div className="p-2 sm:p-3 rounded-lg bg-muted/50">
                  <Label className="text-[10px] sm:text-xs text-muted-foreground uppercase mb-1 block">Trabalho</Label>
                  {isEditingMotor ? (
                    <Input
                      value={motorData.trabalho || ''}
                      onChange={(e) => setMotorData(prev => ({ ...prev, trabalho: e.target.value }))}
                      className="mt-1 h-8 sm:h-9 text-xs sm:text-sm"
                      placeholder="Ex: Permanente"
                    />
                  ) : (
                    <p className="font-medium text-xs sm:text-sm truncate">{budget.motor?.trabalho || '-'}</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Laudo Técnico */}
        <div className="card-industrial">
          <h3 className="text-lg font-semibold mb-4">Laudo Técnico</h3>
          {isEditing ? (
            <Textarea
              value={editData.laudo_tecnico}
              onChange={(e) => setEditData(prev => ({ ...prev, laudo_tecnico: e.target.value }))}
              placeholder="Descreva o problema encontrado, diagnóstico e serviços necessários..."
              rows={4}
            />
          ) : (
            <p className="text-muted-foreground whitespace-pre-wrap">
              {budget.laudo_tecnico || 'Nenhum laudo técnico registrado.'}
            </p>
          )}
        </div>

        {/* Items */}
        <div className="card-industrial">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Peças e Serviços</h3>
            {isEditing && !isAddingItem && !editingItemId && (
              <Button variant="outline" size="sm" onClick={handleAddItem}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Peça ou Serviço
              </Button>
            )}
          </div>
          
          {(isAddingItem || editingItemId) && (
            <div className="mb-4 p-3 sm:p-4 rounded-lg bg-muted/50 border-2 border-dashed">
              <h4 className="font-semibold mb-3 text-sm sm:text-base">{editingItemId ? 'Editar Peça ou Serviço' : 'Nova Peça ou Serviço'}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="sm:col-span-2 lg:col-span-1">
                  <Label className="text-sm">Peça</Label>
                  <Popover open={partComboboxOpen} onOpenChange={setPartComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={partComboboxOpen}
                        className="w-full justify-between font-normal mt-1 h-10"
                        disabled={!!editingItemId}
                      >
                        <span className="truncate">
                          {newItem.part_id
                            ? parts.find(p => p.id === newItem.part_id)?.nome
                            : "Selecione uma peça ou serviço"}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[min(300px,calc(100vw-2rem))] p-0">
                      <Command>
                        <CommandInput placeholder="Buscar peça ou serviço..." />
                        <CommandList>
                          <CommandEmpty>Nenhuma peça ou serviço encontrado.</CommandEmpty>
                          <CommandGroup>
                            {parts.map(part => (
                              <CommandItem
                                key={part.id}
                                value={part.nome}
                                onSelect={() => {
                                  setNewItem(prev => ({
                                    ...prev,
                                    part_id: part.id,
                                    valor_unitario: part.valor || 0,
                                  }));
                                  setPartComboboxOpen(false);
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${newItem.part_id === part.id ? "opacity-100" : "opacity-0"}`}
                                />
                                {part.nome} - R$ {part.valor.toFixed(2)}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label className="text-sm">Quantidade</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newItem.quantidade}
                    onChange={(e) => setNewItem(prev => ({ ...prev, quantidade: parseInt(e.target.value) || 1 }))}
                    className="mt-1 h-10"
                  />
                </div>
                <div>
                  <Label className="text-sm">Valor Unitário</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newItem.valor_unitario}
                    onChange={(e) => setNewItem(prev => ({ ...prev, valor_unitario: parseFloat(e.target.value) || 0 }))}
                    className="mt-1 h-10"
                  />
                </div>
                <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => {
                      setIsAddingItem(false);
                      setEditingItemId(null);
                      setNewItem({ part_id: '', quantidade: 1, valor_unitario: 0 });
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={editingItemId ? handleUpdateItem : handleSaveItem}
                    className="btn-industrial-accent flex-1 sm:flex-none h-10"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    <span className="sm:hidden lg:inline">Salvar</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {budget.items.length > 0 ? (
            <>
              {/* Mobile View - Cards */}
              <div className="md:hidden space-y-3">
                {budget.items.map(item => (
                  <div key={item.id} className="p-3 rounded-lg bg-muted/30 border border-border">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="font-medium text-sm flex-1">{item.part_name}</p>
                      {isEditing && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditItem(item.id)}
                            disabled={isAddingItem || (editingItemId !== null && editingItemId !== item.id)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={isAddingItem || editingItemId !== null}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <span>Qtd: {item.quantidade}</span>
                        <span>R$ {item.valor_unitario.toFixed(2)}/un</span>
                      </div>
                      <p className="font-mono font-semibold">R$ {item.subtotal.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
                
                {/* Mobile Totals */}
                <div className="pt-3 border-t border-border space-y-2">
                  {(descontoPercentual > 0 || (isEditing && hasDescontoEdit)) && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="font-mono font-medium">R$ {subtotalValue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-destructive">
                        <span>Desconto ({descontoPercentual}%):</span>
                        <span className="font-mono font-medium">- R$ {descontoValue.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-semibold">TOTAL:</span>
                    <span className="font-mono font-bold text-lg text-primary">R$ {budget.valor_total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Desktop View - Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="table-industrial">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th className="text-center">Qtd</th>
                      <th className="text-right">Valor Unit.</th>
                      <th className="text-right">Subtotal</th>
                      {isEditing && <th className="text-center">Ações</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {budget.items.map(item => (
                      <tr key={item.id}>
                        <td className="font-medium">{item.part_name}</td>
                        <td className="text-center">{item.quantidade}</td>
                        <td className="text-right font-mono">R$ {item.valor_unitario.toFixed(2)}</td>
                        <td className="text-right font-mono font-semibold">R$ {item.subtotal.toFixed(2)}</td>
                        {isEditing && (
                          <td className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditItem(item.id)}
                                disabled={isAddingItem || (editingItemId !== null && editingItemId !== item.id)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveItem(item.id)}
                                disabled={isAddingItem || editingItemId !== null}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    {(descontoPercentual > 0 || (isEditing && hasDescontoEdit)) && (
                      <>
                        <tr>
                          <td colSpan={isEditing ? 4 : 3} className="text-right font-semibold">
                            Subtotal:
                          </td>
                          <td className="text-right font-mono font-semibold">
                            R$ {subtotalValue.toFixed(2)}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={isEditing ? 4 : 3} className="text-right font-semibold text-destructive">
                            Desconto ({descontoPercentual}%):
                          </td>
                          <td className="text-right font-mono font-semibold text-destructive">
                            - R$ {descontoValue.toFixed(2)}
                          </td>
                        </tr>
                      </>
                    )}
                    <tr>
                      <td colSpan={isEditing ? 4 : 3} className="text-right font-semibold text-lg">TOTAL:</td>
                      <td className="text-right font-mono font-bold text-xl text-primary">
                        R$ {budget.valor_total.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Nenhum item registrado neste orçamento.
            </p>
          )}
          
          {/* Desconto Section - Only when editing */}
          {isEditing && budget.items.length > 0 && (
            <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-3 mb-3">
                <Checkbox
                  id="hasDescontoEdit"
                  checked={hasDescontoEdit}
                  onCheckedChange={(checked) => {
                    setHasDescontoEdit(checked === true);
                    if (!checked) {
                      setEditData(prev => ({ ...prev, desconto_percentual: 0 }));
                      setDescontoReaisInput(null);
                      setDescontoPercentualInput(null);
                    }
                  }}
                />
                <Label htmlFor="hasDescontoEdit" className="font-semibold cursor-pointer">
                  Aplicar desconto
                </Label>
              </div>
              
              {hasDescontoEdit && (
                <div className="ml-7 space-y-3">
                  <div className="flex flex-wrap items-center gap-3 gap-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="descontoPercentualEdit" className="w-28">
                        Desconto (%):
                      </Label>
                      <Input
                        id="descontoPercentualEdit"
                        type="text"
                        inputMode="decimal"
                        value={descontoPercentualInput !== null
                          ? descontoPercentualInput
                          : (editData.desconto_percentual > 0 ? String(editData.desconto_percentual).replace('.', ',') : '')}
                        onChange={(e) => {
                          const raw = e.target.value.replace(',', '.');
                          setDescontoPercentualInput(e.target.value);
                          const value = raw === '' ? 0 : parseFloat(raw) || 0;
                          if (value > 0) {
                            if (!isAdmin && value > 7) {
                              toast.error('Operadores podem dar no máximo 7% de desconto.');
                              setEditData(prev => ({ ...prev, desconto_percentual: 7 }));
                            } else if (isAdmin && value > 100) {
                              toast.error('O desconto máximo é de 100%.');
                              setEditData(prev => ({ ...prev, desconto_percentual: 100 }));
                            } else {
                              setEditData(prev => ({ ...prev, desconto_percentual: value }));
                            }
                          } else {
                            setEditData(prev => ({ ...prev, desconto_percentual: 0 }));
                          }
                          setDescontoReaisInput(null);
                        }}
                        onFocus={() => setDescontoPercentualInput(editData.desconto_percentual > 0 ? String(editData.desconto_percentual).replace('.', ',') : '')}
                        onBlur={() => setDescontoPercentualInput(null)}
                        className="w-24"
                        placeholder="%"
                      />
                    </div>
                    <span className="text-muted-foreground hidden sm:inline">ou</span>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="descontoReaisEdit" className="w-28">
                        Desconto (R$):
                      </Label>
                      <Input
                        id="descontoReaisEdit"
                        type="text"
                        inputMode="decimal"
                        value={descontoReaisInput !== null
                          ? descontoReaisInput
                          : (subtotalValue > 0 && editData.desconto_percentual > 0
                            ? ((subtotalValue * editData.desconto_percentual) / 100).toFixed(2).replace('.', ',')
                            : '')}
                        onChange={(e) => {
                          const raw = e.target.value.replace(',', '.');
                          setDescontoReaisInput(e.target.value);
                          if (subtotalValue <= 0) return;
                          const reais = raw === '' ? 0 : parseFloat(raw) || 0;
                          const percent = reais <= 0 ? 0 : Math.min((reais / subtotalValue) * 100, isAdmin ? 100 : 7);
                          if (!isAdmin && percent > 7) {
                            setEditData(prev => ({ ...prev, desconto_percentual: 7 }));
                            toast.error('Operadores podem dar no máximo 7% de desconto.');
                          } else {
                            setEditData(prev => ({ ...prev, desconto_percentual: Math.round(percent * 100) / 100 }));
                          }
                          setDescontoPercentualInput(null);
                        }}
                        onFocus={() => setDescontoReaisInput(subtotalValue > 0 && editData.desconto_percentual > 0
                          ? ((subtotalValue * editData.desconto_percentual) / 100).toFixed(2).replace('.', ',')
                          : '')}
                        onBlur={() => setDescontoReaisInput(null)}
                        className="w-28"
                        placeholder="0,00"
                      />
                    </div>
                    {!isAdmin && (
                      <span className="text-sm text-muted-foreground">
                        (Máx. 7%)
                      </span>
                    )}
                    {isAdmin && (
                      <span className="text-sm text-muted-foreground">
                        (Máx. 100%)
                      </span>
                    )}
                  </div>
                  {hasDescontoEdit && editData.desconto_percentual > 0 && (
                    <div className="text-sm text-muted-foreground">
                      Valor do desconto: R$ {((subtotalValue * editData.desconto_percentual) / 100).toFixed(2).replace('.', ',')}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Observações */}
        <div className="card-industrial">
          <h3 className="text-lg font-semibold mb-4">Observações</h3>
          {isEditing ? (
            <Textarea
              value={editData.observacoes}
              onChange={(e) => setEditData(prev => ({ ...prev, observacoes: e.target.value }))}
              placeholder="Observações adicionais sobre o orçamento..."
              rows={3}
            />
          ) : (
            <p className="text-muted-foreground whitespace-pre-wrap">
              {budget.observacoes || 'Nenhuma observação registrada.'}
            </p>
          )}
        </div>
      </div>

      {/* Modal: tipo de pagamento ao marcar como Baixado */}
      <Dialog open={showPaymentModal} onOpenChange={(open) => { setShowPaymentModal(open); if (!open) setSelectedTipoPagamento(''); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tipo de pagamento</DialogTitle>
            <DialogDescription>
              Ao marcar o orçamento como Baixado, informe qual foi o tipo de pagamento recebido.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tipo-pagamento">Tipo de pagamento</Label>
              <Select value={selectedTipoPagamento} onValueChange={setSelectedTipoPagamento}>
                <SelectTrigger id="tipo-pagamento" className="w-full">
                  <SelectValue placeholder="Selecione o tipo de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_PAGAMENTO.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setShowPaymentModal(false); setSelectedTipoPagamento(''); }}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmBaixado} disabled={!selectedTipoPagamento}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
