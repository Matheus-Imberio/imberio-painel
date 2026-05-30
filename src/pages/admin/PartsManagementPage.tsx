import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useData, Part } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Package,
  Save,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function PartsManagementPage() {
  const {
    parts,
    addPart,
    updatePart,
    deletePart,
    isLoading,
    ensurePartsLoaded,
    partsLoaded,
    partsLoading,
  } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [deletingPart, setDeletingPart] = useState<Part | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    tipo: '',
    valor: '',
    unidade: 'un',
    observacoes: '',
  });

  useEffect(() => {
    ensurePartsLoaded();
  }, [ensurePartsLoaded]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize, parts.length]);

  const dataLoading = isLoading || (partsLoading && !partsLoaded);

  if (dataLoading) {
    return (
      <DashboardLayout title="Carregando...">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando peças...</p>
        </div>
      </DashboardLayout>
    );
  }

  const filteredParts = searchQuery.trim()
    ? parts.filter(p => 
        p.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tipo?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : parts;

  const totalParts = filteredParts.length;
  const totalPages = Math.max(1, Math.ceil(totalParts / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedParts = filteredParts.slice(startIndex, endIndex);

  // Group parts by type (apenas itens da página atual)
  const partsByType = paginatedParts.reduce((acc, part) => {
    const tipo = part.tipo || 'Sem categoria';
    if (!acc[tipo]) acc[tipo] = [];
    acc[tipo].push(part);
    return acc;
  }, {} as Record<string, Part[]>);

  const handleOpenModal = (part?: Part) => {
    if (part) {
      setEditingPart(part);
      setFormData({
        nome: part.nome,
        tipo: part.tipo || '',
        valor: part.valor.toString(),
        unidade: part.unidade || 'un',
        observacoes: part.observacoes || '',
      });
    } else {
      setEditingPart(null);
      setFormData({
        nome: '',
        tipo: '',
        valor: '',
        unidade: 'un',
        observacoes: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPart(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const partData = {
      nome: formData.nome,
      tipo: formData.tipo,
      valor: parseFloat(formData.valor) || 0,
      unidade: formData.unidade,
      observacoes: formData.observacoes,
    };

    if (editingPart) {
      updatePart(editingPart.id, partData);
      toast.success('Peça atualizada com sucesso!', {
        icon: <CheckCircle className="w-5 h-5 text-success" />,
      });
    } else {
      addPart(partData);
      toast.success('Peça cadastrada com sucesso!', {
        icon: <CheckCircle className="w-5 h-5 text-success" />,
      });
    }

    handleCloseModal();
  };

  const handleOpenDeleteDialog = (part: Part) => {
    setDeletingPart(part);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingPart) {
      await deletePart(deletingPart.id);
      toast.success('Peça excluída com sucesso!');
      setIsDeleteDialogOpen(false);
      setDeletingPart(null);
    }
  };

  return (
    <DashboardLayout 
      title="Gestão de Peças" 
      subtitle={`${parts.length} peças e serviços cadastrados`}
      actions={
        <Button 
          className="btn-industrial-accent"
          onClick={() => handleOpenModal()}
        >
          <Plus className="w-4 h-4" />
          Nova Peça
        </Button>
      }
    >
      {/* Search */}
      <div className="max-w-md mb-8">
        <div className="search-industrial">
          <Search className="w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar peças..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Parts by Category */}
      <div className="space-y-8">
        {Object.entries(partsByType).map(([tipo, items]) => (
          <div key={tipo} className="card-industrial">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{tipo}</h3>
                <p className="text-sm text-muted-foreground">{items.length} item(s)</p>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="table-industrial">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th className="text-right">Valor</th>
                    <th>Unidade</th>
                    <th>Observações</th>
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(part => (
                    <tr key={part.id}>
                      <td className="font-medium">{part.nome}</td>
                      <td className="text-right font-mono">
                        R$ {part.valor.toFixed(2)}
                      </td>
                      <td>{part.unidade || '-'}</td>
                      <td className="text-muted-foreground text-sm">
                        {part.observacoes || '-'}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenModal(part)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleOpenDeleteDialog(part)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {filteredParts.length === 0 && (
        <div className="card-industrial text-center py-12">
          <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            {searchQuery ? 'Nenhuma peça encontrada.' : 'Nenhuma peça cadastrada.'}
          </p>
        </div>
      )}

      {filteredParts.length > 0 && (
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

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingPart ? 'Editar Peça' : 'Nova Peça'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Nome da peça"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo *</Label>
                <Input
                  id="tipo"
                  value={formData.tipo}
                  onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                  placeholder="Ex: Rolamento"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="unidade">Unidade</Label>
                <Input
                  id="unidade"
                  value={formData.unidade}
                  onChange={(e) => setFormData(prev => ({ ...prev, unidade: e.target.value }))}
                  placeholder="un, serv, etc"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$) *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor}
                onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Input
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Observações opcionais"
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Cancelar
              </Button>
              <Button type="submit" className="btn-industrial-accent">
                <Save className="w-4 h-4" />
                {editingPart ? 'Salvar' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Peça</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a peça "{deletingPart?.nome}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingPart(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
