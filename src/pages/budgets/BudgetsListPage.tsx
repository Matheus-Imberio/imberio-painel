import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Download, 
  ChevronRight,
  Filter,
  FileText,
  Image as ImageIcon,
  MessageCircle
} from 'lucide-react';
import { exportBudgetToPDF, exportMotorHeaderToPDF, sendBudgetViaWhatsApp } from '@/lib/pdfExport';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function BudgetsListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pageSize, setPageSize] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useAuth();
  const {
    budgets,
    isLoading,
    getClient,
    ensureClientsLoaded,
    ensureBudgetsLoaded,
    clientsLoaded,
    budgetsLoaded,
    clientsLoading,
    budgetsLoading,
  } = useData();
  const navigate = useNavigate();

  useEffect(() => {
    ensureClientsLoaded();
    ensureBudgetsLoaded();
  }, [ensureClientsLoaded, ensureBudgetsLoaded]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, pageSize, budgets.length]);

  const dataLoading =
    isLoading ||
    (clientsLoading && !clientsLoaded) ||
    (budgetsLoading && !budgetsLoaded);

  if (dataLoading) {
    return (
      <DashboardLayout title="Carregando...">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando orçamentos...</p>
        </div>
      </DashboardLayout>
    );
  }
  
  const isAdmin = user?.role === 'admin';
  const basePath = isAdmin ? '/admin' : '/operador';
  
  let filteredBudgets = budgets;
  
  if (statusFilter !== 'all') {
    filteredBudgets = filteredBudgets.filter(b => b.status === statusFilter);
  }
  
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filteredBudgets = filteredBudgets.filter(b => 
      b.client_name.toLowerCase().includes(query) ||
      b.motor?.marca?.toLowerCase().includes(query) ||
      b.motor?.modelo?.toLowerCase().includes(query)
    );
  }
  
  // Sort by date descending
  filteredBudgets = [...filteredBudgets].sort((a, b) => 
    new Date(b.data).getTime() - new Date(a.data).getTime()
  );

  const totalBudgets = filteredBudgets.length;
  const totalPages = Math.max(1, Math.ceil(totalBudgets / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedBudgets = filteredBudgets.slice(startIndex, endIndex);

  const TIPOS_PAGAMENTO_LABELS: Record<string, string> = {
    dinheiro: 'Dinheiro',
    pix: 'PIX',
    cartao_credito: 'Cartão de Crédito',
    cartao_debito: 'Cartão de Débito',
    transferencia: 'Transferência Bancária',
    boleto: 'Boleto',
    outro: 'Outro',
  };
  const getTipoPagamentoLabel = (value: string) => TIPOS_PAGAMENTO_LABELS[value] ?? value;
  const getCoverPhoto = (budget: (typeof budgets)[number]) =>
    budget.photos.find(photo => photo.is_cover) || budget.photos[0];

  return (
    <DashboardLayout 
      title="Orçamentos" 
      subtitle={`${budgets.length} orçamentos registrados`}
    >
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="flex-1 sm:max-w-md">
          <div className="search-industrial">
            <Search className="w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por cliente ou motor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground hidden sm:block" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pre_orcamento">Pré-Orçamento</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
              <SelectItem value="baixado">Baixado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Budgets - Mobile Cards */}
      {filteredBudgets.length > 0 ? (
        <>
          {/* Mobile/Tablet View - Cards */}
          <div className="lg:hidden space-y-3">
            {paginatedBudgets.map((budget) => (
              <div 
                key={budget.id} 
                className="card-industrial p-4 cursor-pointer active:scale-[0.99] transition-transform"
                onClick={() => navigate(`${basePath}/orcamento/${budget.id}`)}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                    {getCoverPhoto(budget) ? (
                      <img
                        src={getCoverPhoto(budget)!.public_url}
                        alt="Capa do orçamento"
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-base truncate">{budget.client_name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {budget.motor?.marca || ''} {budget.motor?.modelo || ''}
                    </p>
                  </div>
                  <span className={
                    budget.status === 'baixado' ? 'badge-success text-xs' :
                    budget.status === 'concluido' ? 'badge-warning text-xs' :
                    budget.status === 'pre_orcamento' ? 'px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                    'badge-pending text-xs'
                  }>
                    {budget.status === 'baixado' ? 'Baixado' :
                     budget.status === 'concluido' ? 'Concluído' : 
                     budget.status === 'pre_orcamento' ? 'Pré-Orç.' : 'Pendente'}
                  </span>
                </div>
                {budget.status === 'baixado' && budget.tipo_pagamento && (
                  <p className="text-xs text-muted-foreground mb-2">
                    Pagamento: {getTipoPagamentoLabel(budget.tipo_pagamento)}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="font-mono">#{budget.id.toUpperCase().substring(0, 6)}</span>
                    <span>{new Date(budget.data).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <p className="font-mono font-bold text-base">
                    R$ {budget.valor_total.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-border">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-9"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Exportar
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); exportBudgetToPDF(budget); }}>
                        <FileText className="w-4 h-4 mr-2" />
                        PDF do Orçamento
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        const client = getClient(budget.client_id);
                        const clientPhone = client?.telefone || client?.celular || '';
                        exportMotorHeaderToPDF(budget, clientPhone);
                      }}>
                        <Download className="w-4 h-4 mr-2" />
                        PDF da Etiqueta
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
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
                  <Button 
                    variant="default" 
                    size="sm"
                    className="h-9"
                    onClick={(e) => { e.stopPropagation(); navigate(`${basePath}/orcamento/${budget.id}`); }}
                  >
                    Ver detalhes
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View - Table */}
          <div className="hidden lg:block card-industrial overflow-x-auto">
            <table className="table-industrial">
              <thead>
                <tr>
                  <th>Capa</th>
                  <th>Código</th>
                  <th>Cliente</th>
                  <th>Motor</th>
                  <th>Data</th>
                  <th className="text-right">Valor</th>
                  <th>Status</th>
                  <th>Tipo de Pagamento</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBudgets.map((budget) => (
                  <tr key={budget.id}>
                    <td>
                      <div className="h-12 w-12 overflow-hidden rounded-md border border-border bg-muted">
                        {getCoverPhoto(budget) ? (
                          <img
                            src={getCoverPhoto(budget)!.public_url}
                            alt="Capa do orçamento"
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                            <ImageIcon className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="font-mono text-sm">
                      #{budget.id.toUpperCase().substring(0, 6)}
                    </td>
                    <td className="font-medium">{budget.client_name}</td>
                    <td className="text-muted-foreground">
                      {budget.motor?.marca || ''} {budget.motor?.modelo || ''}
                    </td>
                    <td className="text-muted-foreground">
                      {new Date(budget.data).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="text-right font-mono font-semibold">
                      R$ {budget.valor_total.toFixed(2)}
                    </td>
                    <td>
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
                    </td>
                    <td className="text-muted-foreground text-sm whitespace-nowrap">
                      {budget.status === 'baixado' && budget.tipo_pagamento
                        ? getTipoPagamentoLabel(budget.tipo_pagamento)
                        : '—'}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
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
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`${basePath}/orcamento/${budget.id}`)}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Exibir</span>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => setPageSize(Number(value))}
              >
                <SelectTrigger className="w-24 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[15, 25, 50, 100].map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>por página</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
              >
                Próxima
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="card-industrial text-center py-12">
          <p className="text-muted-foreground">
            {searchQuery || statusFilter !== 'all' 
              ? 'Nenhum orçamento encontrado com os filtros aplicados.' 
              : 'Nenhum orçamento registrado ainda.'
            }
          </p>
        </div>
      )}
    </DashboardLayout>
  );
}
