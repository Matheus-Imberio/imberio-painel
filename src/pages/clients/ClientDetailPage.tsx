import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  Phone, 
  MapPin,
  Calendar,
  Edit,
  ChevronRight,
  Trash2,
  X,
  Save,
  MessageCircle
} from 'lucide-react';
import { exportClientToPDF, exportBudgetToPDF, exportMotorHeaderToPDF, sendBudgetViaWhatsApp } from '@/lib/pdfExport';
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
import { toast } from 'sonner';

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const {
    getClient,
    getBudgetsByClient,
    updateClient,
    deleteClient,
    isLoading,
    ensureClientsLoaded,
    ensureBudgetsLoaded,
    clientsLoaded,
    budgetsLoaded,
    clientsLoading,
    budgetsLoading,
  } = useData();
  const navigate = useNavigate();
  
  const isAdmin = user?.role === 'admin';
  const basePath = isAdmin ? '/admin' : '/operador';
  
  const client = getClient(id || '');
  const budgets = getBudgetsByClient(id || '');

  useEffect(() => {
    ensureClientsLoaded();
    ensureBudgetsLoaded();
  }, [ensureClientsLoaded, ensureBudgetsLoaded]);
  
  const dataLoading =
    isLoading ||
    (clientsLoading && !clientsLoaded) ||
    (budgetsLoading && !budgetsLoaded);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editData, setEditData] = useState({
    nome: client?.nome || '',
    endereco: client?.endereco || '',
    telefone: client?.telefone || '',
    celular: client?.celular || '',
    observacoes: client?.observacoes || '',
  });

  const handleEdit = () => {
    setEditData({
      nome: client?.nome || '',
      endereco: client?.endereco || '',
      telefone: client?.telefone || '',
      celular: client?.celular || '',
      observacoes: client?.observacoes || '',
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!client) return;
    await updateClient(client.id, editData);
    setIsEditing(false);
    toast.success('Cliente atualizado com sucesso!');
  };

  const handleDelete = async () => {
    if (!client) return;
    setIsDeleting(true);
    await deleteClient(client.id);
    setIsDeleting(false);
    toast.success('Cliente excluído com sucesso!');
    navigate(`${basePath}/clientes`);
  };

  if (dataLoading) {
    return (
      <DashboardLayout title="Carregando...">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados do cliente...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!client) {
    return (
      <DashboardLayout title="Cliente não encontrado">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">O cliente solicitado não foi encontrado.</p>
          <Button onClick={() => navigate(basePath)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const handleNewBudget = () => {
    navigate(`${basePath}/orcamento/novo/${client.id}`);
  };

  const handleExportClient = () => {
    exportClientToPDF(client, budgets);
  };

  return (
    <DashboardLayout 
      title={client.nome}
      subtitle="Detalhes do cliente"
      actions={
        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="sm" className="hidden sm:flex" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="btn-pdf"
            onClick={handleExportClient}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline ml-2">Exportar PDF</span>
          </Button>
          <Button 
            size="sm"
            className="btn-industrial-accent"
            onClick={handleNewBudget}
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline ml-2">Novo Orçamento</span>
          </Button>
        </div>
      }
    >
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Client Info */}
        <div className="card-industrial">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {isEditing ? 'Editar Cliente' : 'Informações'}
            </h3>
            {!isEditing && (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleEdit}>
                  <Edit className="w-4 h-4" />
                </Button>
                {isAdmin && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Cliente</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir o cliente "{client.nome}"? 
                          {budgets.length > 0 && (
                            <span className="block mt-2 text-destructive font-medium">
                              Atenção: Este cliente possui {budgets.length} orçamento(s) vinculado(s).
                            </span>
                          )}
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
              </div>
            )}
            {isEditing && (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                  <X className="w-4 h-4" />
                </Button>
                <Button size="sm" onClick={handleSaveEdit} className="btn-industrial-accent">
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
          
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Nome</label>
                <Input
                  value={editData.nome}
                  onChange={(e) => setEditData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Nome do cliente"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Endereço</label>
                <Input
                  value={editData.endereco}
                  onChange={(e) => setEditData(prev => ({ ...prev, endereco: e.target.value }))}
                  placeholder="Endereço"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Telefone</label>
                <Input
                  value={editData.telefone}
                  onChange={(e) => setEditData(prev => ({ ...prev, telefone: e.target.value }))}
                  placeholder="Telefone"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Celular</label>
                <Input
                  value={editData.celular}
                  onChange={(e) => setEditData(prev => ({ ...prev, celular: e.target.value }))}
                  placeholder="Celular"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Observações</label>
                <Textarea
                  value={editData.observacoes}
                  onChange={(e) => setEditData(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Observações"
                  rows={3}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Endereço</p>
                  <p className="font-medium">{client.endereco || '-'}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium">{client.telefone || '-'}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Celular</p>
                  <p className="font-medium">{client.celular || '-'}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Cliente desde</p>
                  <p className="font-medium">
                    {new Date(client.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              
              {client.observacoes && (
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-1">Observações</p>
                  <p className="text-sm">{client.observacoes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Budget History */}
        <div className="lg:col-span-2 card-industrial">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
            Histórico de Orçamentos ({budgets.length})
          </h3>
          
          {budgets.length > 0 ? (
            <div className="space-y-3">
              {budgets.map((budget) => (
                <div 
                  key={budget.id}
                  className="p-3 sm:p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  {/* Mobile Layout */}
                  <div className="sm:hidden">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-muted-foreground">
                          #{budget.id.toUpperCase().substring(0, 6)}
                        </span>
                        <span className={
                          budget.status === 'baixado' ? 'badge-success text-xs' :
                          budget.status === 'concluido' ? 'badge-warning text-xs' :
                          budget.status === 'pre_orcamento' ? 'px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                          'badge-pending text-xs'
                        }>
                          {budget.status === 'baixado' ? 'Baixado' :
                           budget.status === 'concluido' ? 'Concluído' : 
                           budget.status === 'pre_orcamento' ? 'Pré-Orç.' : 'Pendente'}
                        </span>
                      </div>
                      <p className="font-mono font-bold text-primary shrink-0">
                        R$ {budget.valor_total.toFixed(2)}
                      </p>
                    </div>
                    <p className="font-medium text-sm mb-1">
                      {budget.motor?.marca || ''} {budget.motor?.modelo || ''} {budget.motor?.cv ? `- ${budget.motor.cv} CV` : ''}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {new Date(budget.data).toLocaleDateString('pt-BR')} • {budget.items.length} item(s)
                      </p>
                      <div className="flex items-center gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Download className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => exportBudgetToPDF(budget)}>
                              <FileText className="w-4 h-4 mr-2" />
                              PDF do Orçamento
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              const clientPhone = client?.telefone || client?.celular || '';
                              exportMotorHeaderToPDF(budget, clientPhone);
                            }}>
                              <Download className="w-4 h-4 mr-2" />
                              PDF da Etiqueta
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
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
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => navigate(`${basePath}/orcamento/${budget.id}`)}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden sm:flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono text-sm text-muted-foreground">
                          #{budget.id.toUpperCase().substring(0, 6)}
                        </span>
                        <span className={
                          budget.status === 'baixado' ? 'badge-success' :
                          budget.status === 'concluido' ? 'badge-warning' :
                          budget.status === 'pre_orcamento' ? 'px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                          'badge-pending'
                        }>
                          {budget.status === 'baixado' ? 'Baixado' :
                           budget.status === 'concluido' ? 'Concluído' : 
                           budget.status === 'pre_orcamento' ? 'Pré-Orçamento' : 'Pendente'}
                        </span>
                      </div>
                      <p className="font-medium">
                        {budget.motor?.marca || ''} {budget.motor?.modelo || ''} - {budget.motor?.cv || '-'} CV
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(budget.data).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">
                          R$ {budget.valor_total.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {budget.items.length} item(s)
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="btn-pdf"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => exportBudgetToPDF(budget)}>
                              <FileText className="w-4 h-4 mr-2" />
                              PDF do Orçamento
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              const clientPhone = client?.telefone || client?.celular || '';
                              exportMotorHeaderToPDF(budget, clientPhone);
                            }}>
                              <Download className="w-4 h-4 mr-2" />
                              PDF da Etiqueta
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
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
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`${basePath}/orcamento/${budget.id}`)}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground mb-4">
                Nenhum orçamento registrado para este cliente.
              </p>
              <Button 
                onClick={handleNewBudget}
                className="btn-industrial-accent"
              >
                <FileText className="w-4 h-4" />
                Criar Primeiro Orçamento
              </Button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
