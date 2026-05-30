import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(email, password);

      if (result.error) {
        setError(result.error);
      } else if (result.user) {
        const redirectPath = result.user.role === 'admin' ? '/admin' : '/operador';
        navigate(redirectPath, { replace: true });
      }
    } catch (err) {
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--accent)/0.24),transparent_28%),linear-gradient(135deg,hsl(var(--primary)),hsl(220_8%_34%))]" />

        <div className="relative z-10 flex flex-col justify-center p-12">
          <div className="flex items-center gap-5 mb-8">
            <img
              src="/logo-imberio.jpg"
              alt="IMBERIO"
              className="w-28 h-28 rounded-lg object-cover bg-white p-2 shadow-industrial"
            />
            <div>
              <h1 className="text-4xl font-bold text-primary-foreground">IMBERIO</h1>
              <p className="text-primary-foreground/80 text-lg">Assistência técnica elétrica</p>
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-primary-foreground mb-4">
            Sistema de gestão de assistência elétrica
          </h2>
          <p className="text-primary-foreground/70 text-lg max-w-md">
            Gerencie clientes, orçamentos técnicos e peças com eficiência e praticidade para sua oficina.
          </p>

          <div className="mt-12 space-y-4">
            <div className="flex items-center gap-3 text-primary-foreground/80">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <span>Cadastro rápido de clientes</span>
            </div>
            <div className="flex items-center gap-3 text-primary-foreground/80">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <span>Orçamentos técnicos detalhados</span>
            </div>
            <div className="flex items-center gap-3 text-primary-foreground/80">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <span>Exportação em PDF profissional</span>
            </div>
            <div className="flex items-center gap-3 text-primary-foreground/80">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <span>Controle completo de peças e serviços</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <img
              src="/logo-imberio.jpg"
              alt="IMBERIO"
              className="w-16 h-16 rounded-lg object-cover bg-white p-1 border border-border"
            />
            <div>
              <h1 className="text-2xl font-bold text-foreground">IMBERIO</h1>
              <p className="text-muted-foreground text-sm">Assistência técnica elétrica</p>
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground">Bem-vindo de volta</h2>
            <p className="text-muted-foreground mt-2">Entre com suas credenciais para acessar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 text-destructive">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 btn-industrial-accent text-base font-semibold"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="spinner" />
                  Entrando...
                </span>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
