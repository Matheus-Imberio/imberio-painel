import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import type { MotorInsert } from '@/lib/database.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  CheckCircle,
  Cog,
  Clock,
  Check,
  ChevronsUpDown
} from 'lucide-react';
import { toast } from 'sonner';

const MOTOR_TYPES = ['Monofásico', 'Trifásico', 'Bifásico'];
const LIGACAO_TYPES = ['Estrela', 'Triângulo', 'Mista'];

export default function NewBudgetPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const { user } = useAuth();
  const { 
    getClient, 
    parts, 
    addBudget, 
    clientsLoaded,
    partsLoaded,
    clientsLoading,
    partsLoading,
    ensureClientsLoaded,
    ensurePartsLoaded,
  } = useData();
  const navigate = useNavigate();
  
  const isAdmin = user?.role === 'admin';
  const basePath = isAdmin ? '/admin' : '/operador';
  
  const client = getClient(clientId || '');

  useEffect(() => {
    ensureClientsLoaded();
    ensurePartsLoaded();
  }, [ensureClientsLoaded, ensurePartsLoaded]);

  const dataLoading = (!clientsLoaded && clientsLoading) || (!partsLoaded && partsLoading);
  
  const [motorData, setMotorData] = useState<Omit<MotorInsert, 'id' | 'created_at'>>({
    equipamento: '',
    tipo: '',
    modelo: '',
    cv: '',
    tensao: '',
    rpm: '',
    passe: '',
    fios: '',
    espiras: '',
    ligacao: '',
    diametro_externo: '',
    comprimento_externo: '',
    numero_serie: '',
    marca: '',
    original: true,
    partida: '',
    trabalho: '',
  });
  
  const [laudoTecnico, setLaudoTecnico] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [hasDesconto, setHasDesconto] = useState(false);
  const [descontoPercentual, setDescontoPercentual] = useState<number | ''>('');
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [customDate, setCustomDate] = useState<string>('');
  
  interface LocalBudgetItem {
    id: string;
    part_id: string;
    part_name: string;
    quantidade: number;
    valor_unitario: number;
    subtotal: number;
  }
  
  const [selectedItems, setSelectedItems] = useState<LocalBudgetItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [partComboboxOpen, setPartComboboxOpen] = useState(false);

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

  const handleMotorChange = (field: keyof Omit<MotorInsert, 'id' | 'created_at'>, value: string | boolean | null) => {
    setMotorData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddItem = (partId: string) => {
    const part = parts.find(p => p.id === partId);
    if (!part) return;
    
    const existingItem = selectedItems.find(item => item.part_id === partId);
    if (existingItem) {
      setSelectedItems(prev => prev.map(item => 
        item.part_id === partId 
          ? { ...item, quantidade: item.quantidade + 1, subtotal: (item.quantidade + 1) * item.valor_unitario }
          : item
      ));
    } else {
      const newItem: LocalBudgetItem = {
        id: Math.random().toString(36).substr(2, 9),
        part_id: part.id,
        part_name: part.nome,
        quantidade: 1,
        valor_unitario: Number(part.valor),
        subtotal: Number(part.valor),
      };
      setSelectedItems(prev => [...prev, newItem]);
    }
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    setSelectedItems(prev => prev.map(item =>
      item.id === itemId
        ? { ...item, quantidade: quantity, subtotal: quantity * item.valor_unitario }
        : item
    ));
  };

  const handleRemoveItem = (itemId: string) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
  };

  const subtotalValue = selectedItems.reduce((sum, item) => sum + item.subtotal, 0);
  const descontoValue = hasDesconto && descontoPercentual !== '' && descontoPercentual > 0 
    ? (subtotalValue * Number(descontoPercentual)) / 100 
    : 0;
  const totalValue = subtotalValue - descontoValue;

  const handleSubmit = async (e: React.FormEvent, isPreOrcamento: boolean = false) => {
    e.preventDefault();
    
    // Se for orçamento normal, precisa de itens
    if (!isPreOrcamento && selectedItems.length === 0) {
      toast.error('Adicione pelo menos uma peça ou serviço ao orçamento.');
      return;
    }
    
    // Validar desconto para operador (máximo 7%)
    if (hasDesconto && descontoPercentual !== '' && !isAdmin && Number(descontoPercentual) > 7) {
      toast.error('Operadores podem dar no máximo 7% de desconto.');
      return;
    }
    
    // Validar desconto para admin (máximo 100%)
    if (hasDesconto && descontoPercentual !== '' && isAdmin && Number(descontoPercentual) > 100) {
      toast.error('O desconto máximo é de 100%.');
      return;
    }
    
    if (hasDesconto && (descontoPercentual === '' || Number(descontoPercentual) <= 0)) {
      toast.error('Informe uma porcentagem de desconto válida.');
      return;
    }

    if (useCustomDate && !customDate) {
      toast.error('Informe a data desejada para o orçamento.');
      return;
    }
    
    setIsSubmitting(true);
    
    const newBudget = await addBudget({
      client_id: client.id,
      operador_id: user?.id || '',
      motor: motorData,
      items: selectedItems.map(item => ({
        part_id: item.part_id,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
      })),
      valor_total: totalValue,
      desconto_percentual: hasDesconto && descontoPercentual !== '' ? Number(descontoPercentual) : undefined,
      laudo_tecnico: laudoTecnico,
      observacoes,
      data: useCustomDate && customDate ? customDate : undefined,
      status: isPreOrcamento ? 'pre_orcamento' : 'pendente',
    });
    
    if (newBudget) {
      if (isPreOrcamento) {
        toast.success('Pré-orçamento criado com sucesso!', {
          description: 'O motor foi registrado e aguarda orçamento.',
          icon: <Clock className="w-5 h-5 text-warning" />,
        });
      } else {
        toast.success('Orçamento criado com sucesso!', {
          description: `Valor total: R$ ${totalValue.toFixed(2)}`,
          icon: <CheckCircle className="w-5 h-5 text-success" />,
        });
      }
      navigate(`${basePath}/clientes/${client.id}`);
    } else {
      toast.error(`Erro ao criar ${isPreOrcamento ? 'pré-orçamento' : 'orçamento'}`, {
        description: 'Tente novamente.',
      });
    }
    
    setIsSubmitting(false);
  };

  // Group parts by type
  const partsByType = parts.reduce((acc, part) => {
    const tipo = part.tipo || 'Sem categoria';
    if (!acc[tipo]) acc[tipo] = [];
    acc[tipo].push(part);
    return acc;
  }, {} as Record<string, typeof parts>);

  return (
    <DashboardLayout 
      title="Novo Orçamento"
      subtitle={`Cliente: ${client.nome}`}
      actions={
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Motor Technical Data */}
        <div className="card-industrial">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Cog className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Dados Técnicos do Motor</h3>
              <p className="text-sm text-muted-foreground">Preencha as especificações do motor</p>
            </div>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Equipamento</Label>
              <Input
                value={motorData.equipamento}
                onChange={(e) => handleMotorChange('equipamento', e.target.value)}
                placeholder="Ex: Bomba, Compressor..."
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Marca</Label>
              <Input
                value={motorData.marca}
                onChange={(e) => handleMotorChange('marca', e.target.value)}
                placeholder="Ex: WEG"
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Modelo</Label>
              <Input
                value={motorData.modelo}
                onChange={(e) => handleMotorChange('modelo', e.target.value)}
                placeholder="Ex: W22"
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Nº de Série</Label>
              <Input
                value={motorData.numero_serie}
                onChange={(e) => handleMotorChange('numero_serie', e.target.value)}
                placeholder="Número de série"
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label>CV</Label>
              <Input
                value={motorData.cv}
                onChange={(e) => handleMotorChange('cv', e.target.value)}
                placeholder="Ex: 5"
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Tensão</Label>
              <Input
                value={motorData.tensao}
                onChange={(e) => handleMotorChange('tensao', e.target.value)}
                placeholder="Ex: 220/380V"
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Passe</Label>
              <Input
                value={motorData.passe}
                onChange={(e) => handleMotorChange('passe', e.target.value)}
                placeholder="Ex: 1-8"
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Espiras</Label>
              <Input
                value={motorData.espiras}
                onChange={(e) => handleMotorChange('espiras', e.target.value)}
                placeholder="Ex: 45"
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Nº de Fios</Label>
              <Input
                value={motorData.fios}
                onChange={(e) => handleMotorChange('fios', e.target.value)}
                placeholder="Ex: 6"
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Ligação</Label>
              <Select value={motorData.ligacao} onValueChange={(v) => handleMotorChange('ligacao', v)}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {LIGACAO_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>RPM</Label>
              <Input
                value={motorData.rpm}
                onChange={(e) => handleMotorChange('rpm', e.target.value)}
                placeholder="Ex: 1750"
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Tipo do Motor</Label>
              <Select value={motorData.tipo} onValueChange={(v) => handleMotorChange('tipo', v)}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {MOTOR_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Diâmetro Externo</Label>
              <Input
                value={motorData.diametro_externo}
                onChange={(e) => handleMotorChange('diametro_externo', e.target.value)}
                placeholder="Ex: 120mm"
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Comprimento Externo</Label>
              <Input
                value={motorData.comprimento_externo}
                onChange={(e) => handleMotorChange('comprimento_externo', e.target.value)}
                placeholder="Ex: 280mm"
                className="h-11"
              />
            </div>
          </div>
          
          <div className="mt-4 flex items-center gap-3">
            <Switch
              id="original"
              checked={motorData.original}
              onCheckedChange={(checked) => handleMotorChange('original', checked)}
            />
            <Label htmlFor="original">Motor Original</Label>
          </div>

          {/* Partida e Trabalho – apenas para motores monofásicos */}
          {motorData.tipo === 'Monofásico' && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
              <div className="space-y-2">
                <Label>Partida</Label>
                <Input
                  value={motorData.partida ?? ''}
                  onChange={(e) => handleMotorChange('partida', e.target.value)}
                  placeholder="Ex: Capacitor"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label>Trabalho</Label>
                <Input
                  value={motorData.trabalho ?? ''}
                  onChange={(e) => handleMotorChange('trabalho', e.target.value)}
                  placeholder="Ex: Permanente"
                  className="h-11"
                />
              </div>
            </div>
          )}
        </div>

        {/* Laudo Técnico */}
        <div className="card-industrial">
          <h3 className="text-lg font-semibold mb-4">Laudo Técnico</h3>
          <Textarea
            value={laudoTecnico}
            onChange={(e) => setLaudoTecnico(e.target.value)}
            placeholder="Descreva o problema encontrado, diagnóstico e serviços necessários..."
            rows={4}
          />
        </div>

        {/* Parts and Services */}
        <div className="card-industrial">
          <h3 className="text-lg font-semibold mb-4">Peças e Serviços</h3>
          
          {/* Part Selector */}
          <div className="mb-6">
            <Label className="mb-2 block">Adicionar Item</Label>
            <Popover open={partComboboxOpen} onOpenChange={setPartComboboxOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={partComboboxOpen}
                  className="h-11 w-full max-w-md justify-between font-normal"
                >
                  Selecione uma peça ou serviço
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput placeholder="Buscar peça ou serviço..." />
                  <CommandList>
                    <CommandEmpty>Nenhuma peça ou serviço encontrado.</CommandEmpty>
                    {Object.entries(partsByType).map(([tipo, items]) => (
                      <CommandGroup key={tipo} heading={tipo}>
                        {items.map(part => (
                          <CommandItem
                            key={part.id}
                            value={`${part.nome} ${tipo}`}
                            onSelect={() => {
                              handleAddItem(part.id);
                              setPartComboboxOpen(false);
                            }}
                          >
                            <Check className="mr-2 h-4 w-4 opacity-0" />
                            {part.nome} - R$ {part.valor.toFixed(2)}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Selected Items */}
          {selectedItems.length > 0 ? (
            <>
              {/* Mobile View - Cards */}
              <div className="md:hidden space-y-3">
                {selectedItems.map(item => (
                  <div key={item.id} className="p-3 rounded-lg bg-muted/30 border border-border">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <p className="font-medium text-sm flex-1">{item.part_name}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground">Qtd:</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantidade}
                          onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 0)}
                          className="w-16 h-8 text-center text-sm"
                        />
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">R$ {item.valor_unitario.toFixed(2)}/un</p>
                        <p className="font-mono font-semibold">R$ {item.subtotal.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Mobile Totals */}
                <div className="pt-3 border-t border-border space-y-2">
                  {hasDesconto && descontoPercentual > 0 && (
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
                    <span className="font-mono font-bold text-lg text-primary">R$ {totalValue.toFixed(2)}</span>
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
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItems.map(item => (
                      <tr key={item.id}>
                        <td className="font-medium">{item.part_name}</td>
                        <td className="text-center">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantidade}
                            onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 0)}
                            className="w-20 h-9 text-center mx-auto"
                          />
                        </td>
                        <td className="text-right font-mono">
                          R$ {item.valor_unitario.toFixed(2)}
                        </td>
                        <td className="text-right font-mono font-semibold">
                          R$ {item.subtotal.toFixed(2)}
                        </td>
                        <td className="text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    {hasDesconto && descontoPercentual > 0 && (
                      <>
                        <tr>
                          <td colSpan={3} className="text-right font-semibold">
                            Subtotal:
                          </td>
                          <td className="text-right font-mono font-semibold">
                            R$ {subtotalValue.toFixed(2)}
                          </td>
                          <td></td>
                        </tr>
                        <tr>
                          <td colSpan={3} className="text-right font-semibold text-destructive">
                            Desconto ({descontoPercentual}%):
                          </td>
                          <td className="text-right font-mono font-semibold text-destructive">
                            - R$ {descontoValue.toFixed(2)}
                          </td>
                          <td></td>
                        </tr>
                      </>
                    )}
                    <tr>
                      <td colSpan={3} className="text-right font-semibold text-lg">
                        TOTAL:
                      </td>
                      <td className="text-right font-mono font-bold text-xl text-primary">
                        R$ {totalValue.toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-lg">
              <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum item adicionado ainda.</p>
              <p className="text-sm">Use o seletor acima para adicionar peças e serviços.</p>
            </div>
          )}
          
          {/* Desconto Section */}
          {selectedItems.length > 0 && (
            <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-3 mb-3">
                <Checkbox
                  id="hasDesconto"
                  checked={hasDesconto}
                  onCheckedChange={(checked) => {
                    setHasDesconto(checked === true);
                    if (!checked) {
                      setDescontoPercentual('');
                    }
                  }}
                />
                <Label htmlFor="hasDesconto" className="font-semibold cursor-pointer">
                  Aplicar desconto
                </Label>
              </div>
              
              {hasDesconto && (
                <div className="ml-7 space-y-2">
                  <div className="flex items-center gap-3">
                    <Label htmlFor="descontoPercentual" className="w-32">
                      Desconto (%):
                    </Label>
                    <Input
                      id="descontoPercentual"
                      type="number"
                      min="0"
                      max={isAdmin ? undefined : 7}
                      step="1"
                      value={descontoPercentual !== '' && descontoPercentual > 0 ? descontoPercentual : ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
                        if (value !== '') {
                          if (!isAdmin && value > 7) {
                            toast.error('Operadores podem dar no máximo 7% de desconto.');
                            setDescontoPercentual(7);
                          } else if (isAdmin && value > 100) {
                            toast.error('O desconto máximo é de 100%.');
                            setDescontoPercentual(100);
                          } else {
                            setDescontoPercentual(value);
                          }
                        } else {
                          setDescontoPercentual(value);
                        }
                      }}
                      className="w-32"
                      placeholder="%"
                    />
                    {!isAdmin && (
                      <span className="text-sm text-muted-foreground">
                        (Máximo: 7%)
                      </span>
                    )}
                    {isAdmin && (
                      <span className="text-sm text-muted-foreground">
                        (Máximo: 100%)
                      </span>
                    )}
                  </div>
                  {hasDesconto && descontoPercentual > 0 && (
                    <div className="text-sm text-muted-foreground">
                      Valor do desconto: R$ {descontoValue.toFixed(2)}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Observations */}
        <div className="card-industrial">
          <h3 className="text-lg font-semibold mb-4">Observações</h3>
          <Textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Observações adicionais sobre o orçamento..."
            rows={3}
          />
        </div>

        {/* Data do Orçamento / Pré-orçamento */}
        <div className="card-industrial">
          <h3 className="text-lg font-semibold mb-4">Data do Orçamento</h3>
          <div className="flex items-center gap-3 mb-3">
            <Checkbox
              id="useCustomDate"
              checked={useCustomDate}
              onCheckedChange={(checked) => setUseCustomDate(checked === true)}
            />
            <Label htmlFor="useCustomDate" className="font-semibold cursor-pointer">
              Definir outra data (retroativa ou futura)
            </Label>
          </div>
          {useCustomDate && (
            <div className="mt-2 max-w-xs">
              <Label htmlFor="customDate">Data desejada</Label>
              <Input
                id="customDate"
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="h-11 mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Se não marcar essa opção, será usada a data atual automaticamente.
              </p>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-6 rounded-xl bg-muted/50 border border-border">
          <div className="text-center sm:text-left">
            <p className="text-xs sm:text-sm text-muted-foreground">Valor Total do Orçamento</p>
            <p className="text-2xl sm:text-3xl font-bold text-primary">
              R$ {totalValue.toFixed(2)}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button 
              type="button" 
              variant="outline"
              className="order-3 sm:order-1"
              onClick={() => navigate(-1)}
            >
              Cancelar
            </Button>
            <Button 
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={(e) => handleSubmit(e, true)}
              className="order-2 border-warning text-warning hover:bg-warning hover:text-warning-foreground"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="spinner" />
                  Salvando...
                </span>
              ) : (
                <>
                  <Clock className="w-5 h-5 mr-2" />
                  Salvar Pré-Orçamento
                </>
              )}
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting || selectedItems.length === 0}
              className="order-1 sm:order-3 btn-industrial-accent"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="spinner" />
                  Salvando...
                </span>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Salvar Orçamento
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
}
