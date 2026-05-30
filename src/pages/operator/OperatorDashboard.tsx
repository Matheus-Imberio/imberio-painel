import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useData } from '@/contexts/DataContext';
import type { Client } from '@/lib/database.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Plus, 
  FileText, 
  Download, 
  History,
  Phone,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { exportClientToPDF } from '@/lib/pdfExport';

export default function OperatorDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const {
    searchClients,
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

  const dataLoading =
    isLoading ||
    (clientsLoading && !clientsLoaded) ||
    (budgetsLoading && !budgetsLoaded);

  if (dataLoading) {
    return (
      <DashboardLayout 
        title="Área do Operador" 
        subtitle="Busque clientes ou cadastre novos orçamentos"
      >
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </DashboardLayout>
    );
  }
  
  const filteredClients = searchQuery.trim() ? searchClients(searchQuery) : [];
  const showResults = searchQuery.trim().length > 0;

  const handleNewClient = () => {
    navigate('/operador/clientes/novo');
  };

  const handleNewBudget = (clientId: string) => {
    navigate(`/operador/orcamento/novo/${clientId}`);
  };

  const handleViewClient = (clientId: string) => {
    navigate(`/operador/clientes/${clientId}`);
  };

  const handleExportClient = (client: Client) => {
    const budgets = getBudgetsByClient(client.id);
    exportClientToPDF(client, budgets);
  };

  return (
    <DashboardLayout 
      title="Área do Operador" 
      subtitle="Busque clientes ou cadastre novos orçamentos"
    >
      {/* Search Section */}
      <div className="max-w-2xl mx-auto mb-6 sm:mb-8">
        <div className="card-industrial">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Buscar Cliente</h2>
          <div className="search-industrial">
            <Search className="w-5 h-5" />
            <input
              type="text"
              placeholder="Nome, telefone ou celular..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Quick Action */}
          <div className="mt-4 flex justify-center">
            <Button 
              onClick={handleNewClient}
              className="btn-industrial-accent w-full sm:w-auto"
            >
              <Plus className="w-5 h-5 mr-2" />
              Novo Cliente
            </Button>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {showResults && (
        <div className="max-w-4xl mx-auto">
          <h3 className="text-lg font-semibold mb-4">
            {filteredClients.length > 0 
              ? `${filteredClients.length} cliente(s) encontrado(s)`
              : 'Nenhum cliente encontrado'
            }
          </h3>
          
          {filteredClients.length === 0 ? (
            <div className="card-industrial text-center py-8 sm:py-12">
              <p className="text-muted-foreground mb-4">
                Não encontramos nenhum cliente com esses dados.
              </p>
              <Button 
                onClick={handleNewClient}
                className="btn-industrial-accent"
              >
                <Plus className="w-5 h-5 mr-2" />
                Cadastrar Novo Cliente
              </Button>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {filteredClients.map((client) => {
                const budgets = getBudgetsByClient(client.id);
                return (
                  <div key={client.id} className="card-industrial">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="text-base sm:text-lg font-semibold text-foreground">
                          {client.nome}
                        </h4>
                        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 shrink-0" />
                            <span className="truncate">{client.endereco || '-'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 shrink-0" />
                            <span>{client.telefone || client.celular || '-'}</span>
                            {client.celular && client.telefone && (
                              <span className="hidden sm:inline">/ {client.celular}</span>
                            )}
                          </div>
                        </div>
                        
                        {/* Budget Count */}
                        <div className="mt-3 flex items-center gap-2 text-sm">
                          <History className="w-4 h-4 text-primary" />
                          <span className="text-primary font-medium">
                            {budgets.length} orçamento(s)
                          </span>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex flex-col sm:flex-col gap-2">
                        <Button 
                          onClick={() => handleNewBudget(client.id)}
                          className="btn-industrial-accent w-full sm:w-auto"
                          size="sm"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Novo Orçamento
                        </Button>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline"
                            size="sm"
                            className="flex-1 sm:flex-none"
                            onClick={() => handleViewClient(client.id)}
                          >
                            Ver Detalhes
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                          <Button 
                            variant="ghost"
                            size="sm"
                            className="btn-pdf shrink-0"
                            onClick={() => handleExportClient(client)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!showResults && (
        <div className="max-w-4xl mx-auto">
          <div className="card-industrial text-center py-6 sm:py-8">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-accent/10 flex items-center justify-center">
              <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-accent" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold mb-2">Novo Cliente</h3>
            <p className="text-muted-foreground text-xs sm:text-sm mb-3 sm:mb-4">
              Cadastre um novo cliente para criar orçamentos
            </p>
            <Button 
              onClick={handleNewClient}
              variant="outline"
              size="sm"
            >
              Cadastrar Cliente
            </Button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
