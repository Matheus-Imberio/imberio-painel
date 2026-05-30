import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useData } from '@/contexts/DataContext';
import { 
  Users, 
  FileText, 
  Package, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
  const {
    clients,
    budgets,
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
  const [showMonthly, setShowMonthly] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return { month: now.getMonth(), year: now.getFullYear() };
  });

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

  if (dataLoading) {
    return (
      <DashboardLayout title="Carregando...">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </DashboardLayout>
    );
  }
  
  const pendingBudgets = budgets.filter(b => b.status === 'pendente').length;
  const completedBudgets = budgets.filter(b => b.status === 'concluido').length;
  const downloadedBudgets = budgets.filter(b => b.status === 'baixado').length;
  
  // Valor total de orçamentos (pendente, concluido, baixado)
  const totalBudgetsValue = budgets
    .filter(b => b.status === 'pendente' || b.status === 'concluido' || b.status === 'baixado')
    .reduce((sum, b) => sum + b.valor_total, 0);

  // Faturamento do mês selecionado (baixados e concluídos)
  const getMonthlyRevenue = (month: number, year: number) => {
    return budgets
      .filter(b => {
        if (b.status !== 'baixado' && b.status !== 'concluido') return false;
        const date = new Date(b.data);
        return date.getMonth() === month && date.getFullYear() === year;
      })
      .reduce((sum, b) => sum + b.valor_total, 0);
  };

  const monthlyRevenue = getMonthlyRevenue(selectedMonth.month, selectedMonth.year);

  // Navegação de meses
  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedMonth(prev => {
      let newMonth = prev.month + (direction === 'next' ? 1 : -1);
      let newYear = prev.year;
      
      if (newMonth > 11) {
        newMonth = 0;
        newYear++;
      } else if (newMonth < 0) {
        newMonth = 11;
        newYear--;
      }
      
      return { month: newMonth, year: newYear };
    });
  };

  // Nome do mês
  const getMonthName = (month: number, year: number) => {
    const date = new Date(year, month);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const stats = [
    { 
      icon: Users, 
      label: 'Clientes', 
      value: clients.length,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    { 
      icon: FileText, 
      label: 'Orçamentos', 
      value: budgets.length,
      color: 'text-accent',
      bgColor: 'bg-accent/10'
    },
    { 
      icon: Package, 
      label: 'Peças', 
      value: parts.length,
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
  ];

  const statusCards = [
    { icon: Clock, label: 'Pendentes', value: pendingBudgets, color: 'text-warning', bgColor: 'bg-warning/10' },
    { icon: AlertCircle, label: 'Concluídos', value: completedBudgets, color: 'text-accent', bgColor: 'bg-accent/10' },
    { icon: CheckCircle, label: 'Baixados', value: downloadedBudgets, color: 'text-success', bgColor: 'bg-success/10' },
  ];

  const recentBudgets = [...budgets]
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .slice(0, 5);

  return (
    <DashboardLayout 
      title="Dashboard" 
      subtitle="Visão geral do sistema"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="flex items-center justify-between">
              <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
            <div className="mt-4">
              <p className="stat-value">{stat.value}</p>
              <p className="stat-label">{stat.label}</p>
            </div>
          </div>
        ))}
        
        {/* Card de Faturamento Interativo */}
        <div 
          className="stat-card cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
          onClick={() => setShowMonthly(!showMonthly)}
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              {showMonthly ? (
                <Calendar className="w-6 h-6 text-primary" />
              ) : (
                <TrendingUp className="w-6 h-6 text-primary" />
              )}
            </div>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              {showMonthly ? 'Ver Total' : 'Ver Mensal'}
            </span>
          </div>
          
          {showMonthly ? (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0"
                  onClick={(e) => { e.stopPropagation(); navigateMonth('prev'); }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs text-muted-foreground capitalize">
                  {getMonthName(selectedMonth.month, selectedMonth.year)}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0"
                  onClick={(e) => { e.stopPropagation(); navigateMonth('next'); }}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <p className="stat-value">
                R$ {monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="stat-label">Valor Mensal (Baixados/Concluídos)</p>
            </div>
          ) : (
            <div className="mt-4">
              <p className="stat-value">
                R$ {totalBudgetsValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="stat-label">Valor Total Orçamentos</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Budget Status */}
        <div className="card-industrial">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Status dos Orçamentos</h3>
          <div className="space-y-3 sm:space-y-4">
            {statusCards.map((status) => (
              <div key={status.label} className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${status.bgColor} flex items-center justify-center`}>
                    <status.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${status.color}`} />
                  </div>
                  <span className="font-medium text-sm sm:text-base">{status.label}</span>
                </div>
                <span className={`text-xl sm:text-2xl font-bold ${status.color}`}>{status.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Budgets */}
        <div className="lg:col-span-2 card-industrial">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Orçamentos Recentes</h3>
          {recentBudgets.length > 0 ? (
            <>
              {/* Mobile View - Cards */}
              <div className="md:hidden space-y-3">
                {recentBudgets.map((budget) => (
                  <div key={budget.id} className="p-3 rounded-lg bg-muted/30 border border-border">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{budget.client_name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {budget.motor?.marca || ''} {budget.motor?.modelo || ''}
                        </p>
                      </div>
                      <span className={
                        budget.status === 'baixado' ? 'badge-success text-xs' :
                        budget.status === 'concluido' ? 'badge-warning text-xs' :
                        'badge-pending text-xs'
                      }>
                        {budget.status === 'baixado' ? 'Baixado' :
                         budget.status === 'concluido' ? 'Concluído' : 'Pendente'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {new Date(budget.data).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="font-mono font-semibold">
                        R$ {budget.valor_total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View - Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="table-industrial">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Motor</th>
                      <th>Valor</th>
                      <th>Status</th>
                      <th>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBudgets.map((budget) => (
                      <tr key={budget.id}>
                        <td className="font-medium">{budget.client_name}</td>
                        <td className="text-muted-foreground">
                          {budget.motor?.marca || ''} {budget.motor?.modelo || ''}
                        </td>
                        <td className="font-mono">
                          R$ {budget.valor_total.toFixed(2)}
                        </td>
                        <td>
                          <span className={
                            budget.status === 'baixado' ? 'badge-success' :
                            budget.status === 'concluido' ? 'badge-warning' :
                            'badge-pending'
                          }>
                            {budget.status === 'baixado' ? 'Baixado' :
                             budget.status === 'concluido' ? 'Concluído' : 'Pendente'}
                          </span>
                        </td>
                        <td className="text-muted-foreground">
                          {new Date(budget.data).toLocaleDateString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum orçamento registrado ainda.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
