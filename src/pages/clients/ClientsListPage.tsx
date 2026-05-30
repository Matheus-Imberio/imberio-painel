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
  Phone,
  MapPin,
  History,
  Plus
} from 'lucide-react';
import { exportClientToPDF } from '@/lib/pdfExport';

export default function ClientsListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useAuth();
  const {
    clients,
    getBudgetsByClient,
    isLoading,
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
  }, [searchQuery, pageSize, clients.length]);

  const dataLoading =
    isLoading ||
    (clientsLoading && !clientsLoaded) ||
    (budgetsLoading && !budgetsLoaded);

  if (dataLoading) {
    return (
      <DashboardLayout title="Carregando...">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando clientes...</p>
        </div>
      </DashboardLayout>
    );
  }
  
  const isAdmin = user?.role === 'admin';
  const basePath = isAdmin ? '/admin' : '/operador';
  
  const filteredClients = searchQuery.trim()
    ? clients.filter(c => 
        c.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.telefone?.includes(searchQuery) ||
        c.celular?.includes(searchQuery)
      )
    : clients;

  const totalClients = filteredClients.length;
  const totalPages = Math.max(1, Math.ceil(totalClients / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedClients = filteredClients.slice(startIndex, endIndex);

  return (
    <DashboardLayout 
      title="Clientes" 
      subtitle={`${clients.length} clientes cadastrados`}
      actions={
        <Button 
          className="btn-industrial-accent"
          onClick={() => navigate(`${basePath}/clientes/novo`)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      }
    >
      {/* Search */}
      <div className="max-w-md mb-6 sm:mb-8">
        <div className="search-industrial">
          <Search className="w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar clientes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {paginatedClients.map((client) => {
          const budgets = getBudgetsByClient(client.id);
          return (
            <div key={client.id} className="card-industrial">
              <div className="flex items-start justify-between mb-4">
                <h4 className="text-lg font-semibold text-foreground">
                  {client.nome}
                </h4>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="btn-pdf"
                  onClick={() => exportClientToPDF(client, budgets)}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-2 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{client.endereco || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span>{client.telefone || client.celular || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 flex-shrink-0 text-primary" />
                  <span className="text-primary font-medium">
                    {budgets.length} orçamento(s)
                  </span>
                </div>
              </div>
              
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => navigate(`${basePath}/clientes/${client.id}`)}
              >
                Ver Detalhes
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          );
        })}
      </div>

      {filteredClients.length === 0 && (
        <div className="card-industrial text-center py-12">
          <p className="text-muted-foreground">
            {searchQuery ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado.'}
          </p>
        </div>
      )}

      {filteredClients.length > 0 && (
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
      )}
    </DashboardLayout>
  );
}
