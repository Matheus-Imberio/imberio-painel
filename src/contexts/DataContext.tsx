import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { 
  Client, 
  Part, 
  Motor, 
  Budget, 
  BudgetPhoto,
  BudgetItem,
  ClientInsert,
  ClientUpdate,
  PartInsert,
  PartUpdate,
  MotorInsert,
  BudgetInsert,
  BudgetItemInsert,
  BudgetWithRelations,
  Profile
} from '@/lib/database.types';

// Re-exportar tipos para compatibilidade
export type { Client, Part, Motor, Budget, BudgetItem };

export interface BudgetPhotoExpanded extends BudgetPhoto {
  public_url: string;
}

// Tipo expandido de Budget para uso na UI
export interface BudgetExpanded {
  id: string;
  client_id: string;
  client_name: string;
  operador_id: string;
  operador_name: string;
  motor: Motor;
  photos: BudgetPhotoExpanded[];
  items: {
    id: string;
    part_id: string;
    part_name: string;
    quantidade: number;
    valor_unitario: number;
    subtotal: number;
  }[];
  data: string;
  valor_total: number;
  desconto_percentual?: number;
  laudo_tecnico: string;
  observacoes: string;
  status: 'pre_orcamento' | 'pendente' | 'concluido' | 'baixado';
  tipo_pagamento?: string | null;
}

interface DataContextType {
  // Estado
  clients: Client[];
  parts: Part[];
  budgets: BudgetExpanded[];
  /** True apenas enquanto a autenticação está sendo verificada (não espera dados). */
  isLoading: boolean;
  clientsLoaded: boolean;
  partsLoaded: boolean;
  budgetsLoaded: boolean;
  clientsLoading: boolean;
  partsLoading: boolean;
  budgetsLoading: boolean;
  ensureClientsLoaded: () => Promise<void>;
  ensurePartsLoaded: () => Promise<void>;
  ensureBudgetsLoaded: () => Promise<void>;

  // Clientes
  addClient: (client: Omit<ClientInsert, 'id' | 'created_at'>) => Promise<Client | null>;
  updateClient: (id: string, client: ClientUpdate) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  getClient: (id: string) => Client | undefined;
  searchClients: (query: string) => Client[];
  refreshClients: () => Promise<void>;
  
  // Peças
  addPart: (part: Omit<PartInsert, 'id' | 'created_at'>) => Promise<Part | null>;
  updatePart: (id: string, part: PartUpdate) => Promise<void>;
  deletePart: (id: string) => Promise<void>;
  refreshParts: () => Promise<void>;
  
  // Orçamentos
  addBudget: (budget: {
    client_id: string;
    operador_id: string;
    motor: Omit<MotorInsert, 'id' | 'created_at'>;
    items: { part_id: string; quantidade: number; valor_unitario: number }[];
    valor_total: number;
    desconto_percentual?: number;
    laudo_tecnico?: string;
    observacoes?: string;
    data?: string;
    status?: 'pre_orcamento' | 'pendente' | 'concluido' | 'baixado';
  }) => Promise<BudgetExpanded | null>;
  updateBudget: (id: string, budget: Partial<BudgetExpanded>) => Promise<void>;
  addBudgetPhotos: (budgetId: string, files: File[]) => Promise<boolean>;
  setBudgetCoverPhoto: (budgetId: string, photoId: string) => Promise<boolean>;
  deleteBudgetPhoto: (budgetId: string, photoId: string) => Promise<boolean>;
  updateBudgetMotor: (budgetId: string, motorData: Partial<Motor>) => Promise<boolean>;
  addBudgetItem: (budgetId: string, item: { part_id: string; quantidade: number; valor_unitario: number }) => Promise<boolean>;
  updateBudgetItem: (itemId: string, item: { quantidade: number; valor_unitario: number }) => Promise<boolean>;
  removeBudgetItem: (budgetId: string, itemId: string) => Promise<boolean>;
  deleteBudget: (id: string) => Promise<boolean>;
  getBudgetsByClient: (clientId: string) => BudgetExpanded[];
  getBudget: (id: string) => BudgetExpanded | undefined;
  refreshBudgets: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);
const BUDGET_PHOTOS_BUCKET = 'budget-photos';

const getBudgetPhotoPublicUrl = (storagePath: string) => {
  const { data } = supabase.storage.from(BUDGET_PHOTOS_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
};

const buildBudgetPhotoPath = (budgetId: string, file: File, index: number) => {
  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const unique = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${budgetId}/${Date.now()}-${index}-${unique}.${extension}`;
};

const defaultMotor = {
  id: '',
  equipamento: null,
  tipo: null,
  modelo: null,
  cv: null,
  tensao: null,
  rpm: null,
  passe: null,
  espiras: null,
  fios: null,
  ligacao: null,
  diametro_externo: null,
  comprimento_externo: null,
  numero_serie: null,
  marca: null,
  original: null,
  partida: null,
  trabalho: null,
  created_at: '',
};

export function DataProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [budgets, setBudgets] = useState<BudgetExpanded[]>([]);
  const [clientsLoaded, setClientsLoaded] = useState(false);
  const [partsLoaded, setPartsLoaded] = useState(false);
  const [budgetsLoaded, setBudgetsLoaded] = useState(false);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [partsLoading, setPartsLoading] = useState(false);
  const [budgetsLoading, setBudgetsLoading] = useState(false);

  // isLoading = só auth (não bloqueia tela esperando todos os dados)
  const isLoading = authLoading;

  // ========== FETCH FUNCTIONS ==========
  
  const fetchClients = useCallback(async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('nome');
    
    if (error) {
      console.error('Erro ao buscar clientes:', error);
      return;
    }
    
    setClients(data || []);
  }, []);

  const fetchParts = useCallback(async () => {
    const { data, error } = await supabase
      .from('parts')
      .select('*')
      .order('nome');
    
    if (error) {
      console.error('Erro ao buscar peças:', error);
      return;
    }
    
    setParts(data || []);
  }, []);

  const fetchBudgets = useCallback(async () => {
    const { data: budgetsData, error: budgetsError } = await supabase
      .from('budgets')
      .select(`
        *,
        client:clients(*),
        operador:profiles(*),
        motor:motors(*),
        photos:budget_photos(*),
        items:budget_items(
          *,
          part:parts(*)
        )
      `)
      .order('data', { ascending: false });

    if (budgetsError) {
      console.error('Erro ao buscar orçamentos:', budgetsError);
      return;
    }

    const expandedBudgets: BudgetExpanded[] = ((budgetsData || []) as any[]).map(budget => {
      const items = ((budget.items || []) as any[]).map((item: any) => ({
        id: item.id,
        part_id: item.part_id || '',
        part_name: item.part?.nome || 'Peça não encontrada',
        quantidade: item.quantidade,
        valor_unitario: Number(item.valor_unitario),
        subtotal: Number(item.subtotal),
      }));
      const photos = ((budget.photos || []) as BudgetPhoto[])
        .map(photo => ({
          ...photo,
          public_url: getBudgetPhotoPublicUrl(photo.storage_path),
        }))
        .sort((a, b) => {
          if (a.is_cover !== b.is_cover) return a.is_cover ? -1 : 1;
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });

      return {
        id: budget.id,
        client_id: budget.client_id || '',
        client_name: budget.client?.nome || 'Cliente não encontrado',
        operador_id: budget.operador_id || '',
        operador_name: budget.operador?.name || 'Operador não encontrado',
        motor: budget.motor || defaultMotor,
        photos,
        items,
        data: budget.data,
        valor_total: Number(budget.valor_total) || 0,
        desconto_percentual: budget.desconto_percentual ? Number(budget.desconto_percentual) : undefined,
        laudo_tecnico: budget.laudo_tecnico || '',
        observacoes: budget.observacoes || '',
        status: budget.status || 'pendente',
        tipo_pagamento: budget.tipo_pagamento ?? null,
      };
    });

    setBudgets(expandedBudgets);
  }, []);

  const ensureClientsLoaded = useCallback(async () => {
    if (clientsLoaded || clientsLoading) return;
    setClientsLoading(true);
    try {
      await fetchClients();
      setClientsLoaded(true);
    } finally {
      setClientsLoading(false);
    }
  }, [clientsLoaded, clientsLoading, fetchClients]);

  const ensurePartsLoaded = useCallback(async () => {
    if (partsLoaded || partsLoading) return;
    setPartsLoading(true);
    try {
      await fetchParts();
      setPartsLoaded(true);
    } finally {
      setPartsLoading(false);
    }
  }, [partsLoaded, partsLoading, fetchParts]);

  const ensureBudgetsLoaded = useCallback(async () => {
    if (budgetsLoaded || budgetsLoading) return;
    setBudgetsLoading(true);
    try {
      await fetchBudgets();
      setBudgetsLoaded(true);
    } finally {
      setBudgetsLoading(false);
    }
  }, [budgetsLoaded, budgetsLoading, fetchBudgets]);

  // Logout: limpa dados e flags para recarregar sob demanda na próxima sessão
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setClients([]);
      setParts([]);
      setBudgets([]);
      setClientsLoaded(false);
      setPartsLoaded(false);
      setBudgetsLoaded(false);
    }
  }, [authLoading, isAuthenticated]);

  // ========== CLIENTS ==========

  const addClient = async (clientData: Omit<ClientInsert, 'id' | 'created_at'>): Promise<Client | null> => {
    const { data, error } = await supabase
      .from('clients')
      .insert(clientData as any)
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar cliente:', error);
      return null;
    }

    setClients(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)));
    return data;
  };

  const updateClient = async (id: string, clientData: ClientUpdate) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('clients') as any)
      .update(clientData)
      .eq('id', id);

    if (error) {
      console.error('Erro ao atualizar cliente:', error);
      return;
    }

    setClients(prev => prev.map(c => c.id === id ? { ...c, ...clientData } : c));
  };

  const deleteClient = async (id: string) => {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar cliente:', error);
      return;
    }

    setClients(prev => prev.filter(c => c.id !== id));
  };

  const getClient = (id: string) => clients.find(c => c.id === id);

  const searchClients = (query: string) => {
    if (!query.trim()) return clients;
    const lowerQuery = query.toLowerCase();
    return clients.filter(c => 
      c.nome.toLowerCase().includes(lowerQuery) ||
      c.telefone?.includes(query) ||
      c.celular?.includes(query)
    );
  };

  const refreshClients = async () => {
    await fetchClients();
  };

  // ========== PARTS ==========

  const addPart = async (partData: Omit<PartInsert, 'id' | 'created_at'>): Promise<Part | null> => {
    const { data, error } = await supabase
      .from('parts')
      .insert(partData as any)
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar peça:', error);
      return null;
    }

    setParts(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)));
    return data;
  };

  const updatePart = async (id: string, partData: PartUpdate) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('parts') as any)
      .update(partData)
      .eq('id', id);

    if (error) {
      console.error('Erro ao atualizar peça:', error);
      return;
    }

    setParts(prev => prev.map(p => p.id === id ? { ...p, ...partData } : p));
  };

  const deletePart = async (id: string) => {
    const { error } = await supabase
      .from('parts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar peça:', error);
      return;
    }

    setParts(prev => prev.filter(p => p.id !== id));
  };

  const refreshParts = async () => {
    await fetchParts();
  };

  // ========== BUDGETS ==========

  const addBudget = async (budgetData: {
    client_id: string;
    operador_id: string;
    motor: Omit<MotorInsert, 'id' | 'created_at'>;
    items: { part_id: string; quantidade: number; valor_unitario: number }[];
    valor_total: number;
    desconto_percentual?: number;
    laudo_tecnico?: string;
    observacoes?: string;
    data?: string;
    status?: 'pre_orcamento' | 'pendente' | 'concluido' | 'baixado';
  }): Promise<BudgetExpanded | null> => {
    // 1. Criar o motor primeiro
    const { data: motorData, error: motorError } = await supabase
      .from('motors')
      .insert(budgetData.motor as any)
      .select()
      .single();

    if (motorError || !motorData) {
      console.error('Erro ao criar motor:', motorError);
      return null;
    }

    // 2. Criar o orçamento
    const budgetInsert: Record<string, unknown> = {
      client_id: budgetData.client_id,
      operador_id: budgetData.operador_id,
      motor_id: (motorData as any).id,
      valor_total: budgetData.valor_total,
      desconto_percentual: budgetData.desconto_percentual || null,
      laudo_tecnico: budgetData.laudo_tecnico,
      observacoes: budgetData.observacoes,
      status: budgetData.status || 'pendente',
    };

    if (budgetData.data) {
      budgetInsert.data = budgetData.data;
    } else {
      budgetInsert.data = new Date().toISOString();
    }

    const { data: budgetResult, error: budgetError } = await supabase
      .from('budgets')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(budgetInsert as any)
      .select()
      .single();

    if (budgetError || !budgetResult) {
      console.error('Erro ao criar orçamento:', budgetError);
      return null;
    }

    // 3. Criar os itens do orçamento
    const itemsToInsert = budgetData.items.map(item => ({
      budget_id: (budgetResult as any).id,
      part_id: item.part_id,
      quantidade: item.quantidade,
      valor_unitario: item.valor_unitario,
    }));

    const { data: itemsData, error: itemsError } = await supabase
      .from('budget_items')
      .insert(itemsToInsert as any)
      .select(`
        *,
        part:parts(*)
      `);

    if (itemsError) {
      console.error('Erro ao criar itens:', itemsError);
    }

    // 4. Buscar dados relacionados para montar o objeto expandido
    const client = clients.find(c => c.id === budgetData.client_id);
    
    const { data: operador } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', budgetData.operador_id)
      .single();

    const expandedBudget: BudgetExpanded = {
      id: (budgetResult as any).id,
      client_id: budgetData.client_id,
      client_name: client?.nome || 'Cliente não encontrado',
      operador_id: budgetData.operador_id,
      operador_name: (operador as any)?.name || 'Operador não encontrado',
      motor: motorData as any,
      items: ((itemsData || []) as any[]).map(item => ({
        id: item.id,
        part_id: item.part_id || '',
        part_name: item.part?.nome || 'Peça não encontrada',
        quantidade: item.quantidade,
        valor_unitario: Number(item.valor_unitario),
        subtotal: Number(item.subtotal),
      })),
      photos: [],
      data: (budgetResult as any).data,
      valor_total: budgetData.valor_total,
      desconto_percentual: budgetData.desconto_percentual,
      laudo_tecnico: budgetData.laudo_tecnico || '',
      observacoes: budgetData.observacoes || '',
      status: budgetData.status || 'pendente',
    };

    setBudgets(prev => [expandedBudget, ...prev]);
    return expandedBudget;
  };

  const updateBudget = async (id: string, budgetData: Partial<BudgetExpanded>) => {
    const updateData: Record<string, unknown> = {};
    
    if (budgetData.valor_total !== undefined) updateData.valor_total = budgetData.valor_total;
    if (budgetData.laudo_tecnico !== undefined) updateData.laudo_tecnico = budgetData.laudo_tecnico;
    if (budgetData.observacoes !== undefined) updateData.observacoes = budgetData.observacoes;
    if (budgetData.status !== undefined) updateData.status = budgetData.status;
    if (budgetData.tipo_pagamento !== undefined) updateData.tipo_pagamento = budgetData.tipo_pagamento;
    if (budgetData.data !== undefined) updateData.data = budgetData.data;

    if (Object.keys(updateData).length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('budgets') as any)
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar orçamento:', error);
        return;
      }
    }

    setBudgets(prev => prev.map(b => b.id === id ? { ...b, ...budgetData } : b));
  };

  const addBudgetPhotos = async (budgetId: string, files: File[]): Promise<boolean> => {
    if (files.length === 0) return true;

    const budget = budgets.find(b => b.id === budgetId);
    const shouldSetFirstAsCover = !budget?.photos.some(photo => photo.is_cover);
    const uploadedPaths: string[] = [];

    try {
      const records: { budget_id: string; storage_path: string; is_cover: boolean }[] = [];

      for (const [index, file] of files.entries()) {
        const storagePath = buildBudgetPhotoPath(budgetId, file, index);
        const { error: uploadError } = await supabase.storage
          .from(BUDGET_PHOTOS_BUCKET)
          .upload(storagePath, file, {
            contentType: file.type || 'image/jpeg',
            upsert: false,
          });

        if (uploadError) throw uploadError;
        uploadedPaths.push(storagePath);

        records.push({
          budget_id: budgetId,
          storage_path: storagePath,
          is_cover: shouldSetFirstAsCover && index === 0,
        });
      }

      const { data, error } = await supabase
        .from('budget_photos')
        .insert(records)
        .select();

      if (error || !data) {
        await supabase.storage.from(BUDGET_PHOTOS_BUCKET).remove(uploadedPaths);
        console.error('Erro ao salvar fotos do orçamento:', error);
        return false;
      }

      const newPhotos: BudgetPhotoExpanded[] = (data as BudgetPhoto[]).map(photo => ({
        ...photo,
        public_url: getBudgetPhotoPublicUrl(photo.storage_path),
      }));

      setBudgets(prev => prev.map(b => (
        b.id === budgetId
          ? { ...b, photos: [...b.photos, ...newPhotos].sort((a, b) => Number(b.is_cover) - Number(a.is_cover)) }
          : b
      )));

      return true;
    } catch (error) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from(BUDGET_PHOTOS_BUCKET).remove(uploadedPaths);
      }
      console.error('Erro ao enviar fotos do orçamento:', error);
      return false;
    }
  };

  const setBudgetCoverPhoto = async (budgetId: string, photoId: string): Promise<boolean> => {
    const { error: clearError } = await (supabase.from('budget_photos') as any)
      .update({ is_cover: false })
      .eq('budget_id', budgetId);

    if (clearError) {
      console.error('Erro ao limpar capa do orçamento:', clearError);
      return false;
    }

    const { error: coverError } = await (supabase.from('budget_photos') as any)
      .update({ is_cover: true })
      .eq('id', photoId);

    if (coverError) {
      console.error('Erro ao definir capa do orçamento:', coverError);
      return false;
    }

    setBudgets(prev => prev.map(b => (
      b.id === budgetId
        ? {
            ...b,
            photos: b.photos
              .map(photo => ({ ...photo, is_cover: photo.id === photoId }))
              .sort((a, b) => Number(b.is_cover) - Number(a.is_cover)),
          }
        : b
    )));

    return true;
  };

  const deleteBudgetPhoto = async (budgetId: string, photoId: string): Promise<boolean> => {
    const budget = budgets.find(b => b.id === budgetId);
    const photo = budget?.photos.find(item => item.id === photoId);
    if (!budget || !photo) return false;

    const remainingPhotos = budget.photos.filter(item => item.id !== photoId);

    const { error } = await supabase
      .from('budget_photos')
      .delete()
      .eq('id', photoId);

    if (error) {
      console.error('Erro ao remover foto do orçamento:', error);
      return false;
    }

    await supabase.storage.from(BUDGET_PHOTOS_BUCKET).remove([photo.storage_path]);

    let updatedRemaining = remainingPhotos;
    if (photo.is_cover && remainingPhotos.length > 0 && !remainingPhotos.some(item => item.is_cover)) {
      const nextCover = remainingPhotos[0];
      const { error: coverError } = await (supabase.from('budget_photos') as any)
        .update({ is_cover: true })
        .eq('id', nextCover.id);

      if (!coverError) {
        updatedRemaining = remainingPhotos.map(item => ({ ...item, is_cover: item.id === nextCover.id }));
      }
    }

    setBudgets(prev => prev.map(b => (
      b.id === budgetId ? { ...b, photos: updatedRemaining } : b
    )));

    return true;
  };

  const updateBudgetMotor = async (budgetId: string, motorData: Partial<Motor>): Promise<boolean> => {
    const budget = budgets.find(b => b.id === budgetId);
    if (!budget || !budget.motor?.id) return false;

    const { id, created_at, ...updateData } = motorData as Motor;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('motors') as any)
      .update(updateData)
      .eq('id', budget.motor.id);

    if (error) {
      console.error('Erro ao atualizar motor:', error);
      return false;
    }

    setBudgets(prev => prev.map(b => 
      b.id === budgetId 
        ? { ...b, motor: { ...b.motor, ...motorData } }
        : b
    ));
    return true;
  };

  const addBudgetItem = async (budgetId: string, item: { part_id: string; quantidade: number; valor_unitario: number }): Promise<boolean> => {
    const subtotal = item.quantidade * item.valor_unitario;
    
    const { data, error } = await supabase
      .from('budget_items')
      .insert({
        budget_id: budgetId,
        part_id: item.part_id,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
      } as any)
      .select(`
        *,
        part:parts(*)
      `)
      .single();

    if (error || !data) {
      console.error('Erro ao adicionar item:', error);
      return false;
    }

    const part = parts.find(p => p.id === item.part_id);
    const newItem = {
      id: (data as any).id,
      part_id: item.part_id,
      part_name: part?.nome || 'Peça não encontrada',
      quantidade: item.quantidade,
      valor_unitario: item.valor_unitario,
      subtotal: Number((data as any).subtotal) || subtotal,
    };

    setBudgets(prev => prev.map(b => {
      if (b.id === budgetId) {
        const newItems = [...b.items, newItem];
        const newTotal = newItems.reduce((sum, i) => sum + i.subtotal, 0);
        return { ...b, items: newItems, valor_total: newTotal };
      }
      return b;
    }));

    // Atualizar valor total no banco
    const budget = budgets.find(b => b.id === budgetId);
    if (budget) {
      const newTotal = budget.items.reduce((sum, i) => sum + i.subtotal, 0) + subtotal;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('budgets') as any)
        .update({ valor_total: newTotal })
        .eq('id', budgetId);
    }

    return true;
  };

  const updateBudgetItem = async (itemId: string, item: { quantidade: number; valor_unitario: number }): Promise<boolean> => {
    const subtotal = item.quantidade * item.valor_unitario;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('budget_items') as any)
      .update({
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
      })
      .eq('id', itemId);

    if (error) {
      console.error('Erro ao atualizar item:', error);
      return false;
    }

    let budgetToUpdate: BudgetExpanded | undefined;
    
    setBudgets(prev => prev.map(b => {
      const itemIndex = b.items.findIndex(i => i.id === itemId);
      if (itemIndex !== -1) {
        const newItems = [...b.items];
        newItems[itemIndex] = { ...newItems[itemIndex], ...item, subtotal };
        const newTotal = newItems.reduce((sum, i) => sum + i.subtotal, 0);
        budgetToUpdate = { ...b, items: newItems, valor_total: newTotal };
        return budgetToUpdate;
      }
      return b;
    }));

    // Atualizar valor total no banco
    if (budgetToUpdate) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('budgets') as any)
        .update({ valor_total: budgetToUpdate.valor_total })
        .eq('id', budgetToUpdate.id);
    }

    return true;
  };

  const removeBudgetItem = async (budgetId: string, itemId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('budget_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Erro ao remover item:', error);
      return false;
    }

    let newTotal = 0;
    
    setBudgets(prev => prev.map(b => {
      if (b.id === budgetId) {
        const newItems = b.items.filter(i => i.id !== itemId);
        newTotal = newItems.reduce((sum, i) => sum + i.subtotal, 0);
        return { ...b, items: newItems, valor_total: newTotal };
      }
      return b;
    }));

    // Atualizar valor total no banco
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('budgets') as any)
      .update({ valor_total: newTotal })
      .eq('id', budgetId);

    return true;
  };

  const deleteBudget = async (id: string): Promise<boolean> => {
    const budget = budgets.find(b => b.id === id);
    if (!budget) return false;

    // Deletar itens do orçamento primeiro
    const { error: itemsError } = await supabase
      .from('budget_items')
      .delete()
      .eq('budget_id', id);

    if (itemsError) {
      console.error('Erro ao deletar itens do orçamento:', itemsError);
      return false;
    }

    // Deletar o orçamento
    const { error: budgetError } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id);

    if (budgetError) {
      console.error('Erro ao deletar orçamento:', budgetError);
      return false;
    }

    // Deletar o motor associado (se existir)
    if (budget.motor?.id) {
      await supabase
        .from('motors')
        .delete()
        .eq('id', budget.motor.id);
    }

    setBudgets(prev => prev.filter(b => b.id !== id));
    return true;
  };

  const getBudgetsByClient = (clientId: string) => budgets.filter(b => b.client_id === clientId);

  const getBudget = (id: string) => budgets.find(b => b.id === id);

  const refreshBudgets = async () => {
    await fetchBudgets();
  };

  return (
    <DataContext.Provider value={{
      clients,
      parts,
      budgets,
      isLoading,
      clientsLoaded,
      partsLoaded,
      budgetsLoaded,
      clientsLoading,
      partsLoading,
      budgetsLoading,
      ensureClientsLoaded,
      ensurePartsLoaded,
      ensureBudgetsLoaded,
      addClient,
      updateClient,
      deleteClient,
      getClient,
      searchClients,
      refreshClients,
      addPart,
      updatePart,
      deletePart,
      refreshParts,
      addBudget,
      updateBudget,
      addBudgetPhotos,
      setBudgetCoverPhoto,
      deleteBudgetPhoto,
      updateBudgetMotor,
      addBudgetItem,
      updateBudgetItem,
      removeBudgetItem,
      deleteBudget,
      getBudgetsByClient,
      getBudget,
      refreshBudgets,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
