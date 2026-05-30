import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function NewClientPage() {
  const { user } = useAuth();
  const { addClient } = useData();
  const navigate = useNavigate();
  
  const isAdmin = user?.role === 'admin';
  const basePath = isAdmin ? '/admin' : '/operador';
  
  const [formData, setFormData] = useState({
    nome: '',
    endereco: '',
    telefone: '',
    celular: '',
    observacoes: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const newClient = await addClient(formData);
    
    if (newClient) {
      toast.success('Cliente cadastrado com sucesso!', {
        description: `${newClient.nome} foi adicionado ao sistema.`,
        icon: <CheckCircle className="w-5 h-5 text-success" />,
      });
      navigate(`${basePath}/clientes/${newClient.id}`);
    } else {
      toast.error('Erro ao cadastrar cliente', {
        description: 'Tente novamente.',
      });
    }
    
    setIsSubmitting(false);
  };

  return (
    <DashboardLayout 
      title="Novo Cliente" 
      subtitle="Preencha os dados para cadastrar um novo cliente"
      actions={
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      }
    >
      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="card-industrial space-y-6">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome / Razão Social *</Label>
            <Input
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              placeholder="Nome completo ou razão social"
              className="h-12"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço</Label>
            <Input
              id="endereco"
              name="endereco"
              value={formData.endereco}
              onChange={handleChange}
              placeholder="Rua, número, bairro, cidade"
              className="h-12"
            />
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                placeholder="(00) 0000-0000"
                className="h-12"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="celular">Celular</Label>
              <Input
                id="celular"
                name="celular"
                value={formData.celular}
                onChange={handleChange}
                placeholder="(00) 00000-0000"
                className="h-12"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              name="observacoes"
              value={formData.observacoes}
              onChange={handleChange}
              placeholder="Informações adicionais sobre o cliente..."
              rows={4}
            />
          </div>
          
          <div className="flex justify-end gap-4 pt-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="btn-industrial-accent"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="spinner" />
                  Salvando...
                </span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar Cliente
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
