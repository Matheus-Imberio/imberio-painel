# 🏭 Imbério Motor Hub

Sistema completo de gestão de orçamentos para oficinas de motores elétricos. Gerencie clientes, peças, orçamentos e laudos técnicos de forma profissional e eficiente. 

![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.4.19-646CFF?logo=vite)
![Supabase](https://img.shields.io/badge/Supabase-2.90.1-3ECF8E?logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.17-38B2AC?logo=tailwind-css)

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Segurança](#-segurança)
- [Deploy](#-deploy)
- [Contribuindo](#-contribuindo).

## 🎯 Sobre o Projeto

O **Imbério Motor Hub** é uma aplicação web moderna desenvolvida para gerenciar todo o ciclo de vida de orçamentos em oficinas de motores elétricos. O sistema oferece controle completo sobre clientes, peças, orçamentos e laudos técnicos, com interface intuitiva e segura.

### Principais Características

- ✅ **Gestão Completa de Clientes**: Cadastro, edição e busca avançada
- ✅ **Catálogo de Peças**: Controle de estoque e preços
- ✅ **Sistema de Orçamentos**: Criação, edição e acompanhamento de status
- ✅ **Laudos Técnicos**: Documentação completa dos serviços
- ✅ **Exportação PDF**: Geração automática de documentos profissionais
- ✅ **Controle de Acesso**: Perfis Admin e Operador com permissões diferenciadas
- ✅ **Dashboard Interativo**: Visão geral com métricas e estatísticas

## 🚀 Funcionalidades

### 👥 Gestão de Clientes
- Cadastro completo com dados de contato
- Busca por nome, telefone ou celular
- Histórico de orçamentos por cliente
- Exportação de dados em PDF

### 📦 Gestão de Peças
- Cadastro de peças e serviços
- Controle de preços e unidades
- Categorização por tipo
- Acesso restrito para administradores

### 💰 Sistema de Orçamentos
- Criação de pré-orçamentos e orçamentos
- Adição de múltiplas peças e serviços
- Cálculo automático de valores
- Controle de status (Pré-orçamento, Pendente, Concluído, Baixado)
- Conversão de pré-orçamento para orçamento

### 🔧 Dados Técnicos de Motores
- Registro completo de especificações técnicas
- Campos personalizáveis (CV, tensão, RPM, espiras, etc.)
- Laudo técnico detalhado
- Observações e anotações

### 📊 Dashboard Administrativo
- Estatísticas em tempo real
- Contadores de clientes, orçamentos e peças
- Faturamento total e mensal
- Gráficos e visualizações
- Orçamentos recentes

### 🔐 Segurança e Permissões
- Autenticação via Supabase Auth
- Perfis de usuário (Admin e Operador)
- Row Level Security (RLS) no banco de dados
- Proteção de rotas no frontend
- Controle de ações por perfil

## 🛠 Tecnologias

### Frontend
- **React 18.3** - Biblioteca JavaScript para interfaces
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **React Router DOM** - Roteamento
- **Tailwind CSS** - Estilização utilitária
- **shadcn/ui** - Componentes UI acessíveis
- **Radix UI** - Primitivos UI headless
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de schemas
- **Recharts** - Gráficos e visualizações
- **jsPDF** - Geração de PDFs

### Backend & Banco de Dados
- **Supabase** - Backend as a Service
  - PostgreSQL (banco de dados)
  - Row Level Security (RLS)
  - Autenticação
  - API REST automática

### Ferramentas de Desenvolvimento
- **ESLint** - Linter
- **Vitest** - Framework de testes
- **Testing Library** - Testes de componentes React

## 📦 Pré-requisitos

Antes de começar, você precisa ter instalado:

- **Node.js** 18+ ([instalar com nvm](https://github.com/nvm-sh/nvm))
- **npm** ou **bun** ou **yarn**
- Conta no **Supabase** ([criar conta](https://supabase.com))

## 🔧 Instalação

1. **Clone o repositório**
```bash
git clone <seu-repositorio>
cd imberio-motor-hub
```

2. **Instale as dependências**
```bash
npm install
# ou
bun install
# ou
yarn install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

4. **Preencha o arquivo `.env`** com suas credenciais do Supabase:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

## ⚙️ Configuração

### 1. Criar Projeto no Supabase

1. Acesse [app.supabase.com](https://app.supabase.com)
2. Crie um novo projeto
3. Vá em **Settings** → **API**
4. Copie a **Project URL** e a **anon/public key**

### 2. Configurar Banco de Dados

Execute o SQL fornecido no SQL Editor do Supabase para criar:
- Tabelas (profiles, clients, parts, motors, budgets, budget_items)
- Políticas RLS (Row Level Security)
- Triggers e funções
- Índices

### 3. Configurar Autenticação

1. No Supabase Dashboard, vá em **Authentication** → **Providers**
2. Configure Email/Password (ou outros providers)
3. Crie usuários de teste

### 4. Criar Perfis de Usuário

Após criar usuários no Supabase Auth, insira manualmente na tabela `profiles`:

```sql
INSERT INTO public.profiles (id, name, role)
VALUES (
  'uuid-do-usuario-auth',
  'Nome do Usuário',
  'admin' -- ou 'operador'
);
```

## 📜 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento (porta 8080)

# Build
npm run build        # Build de produção
npm run build:dev    # Build de desenvolvimento

# Preview
npm run preview      # Preview do build de produção

# Testes
npm test             # Executa testes
npm run test:watch   # Executa testes em modo watch

# Linting
npm run lint         # Verifica código com ESLint
```

## 📁 Estrutura do Projeto

```
imberio-motor-hub/
├── public/                 # Arquivos estáticos
├── src/
│   ├── components/        # Componentes React
│   │   ├── layout/        # Layouts (DashboardLayout, Sidebar)
│   │   └── ui/            # Componentes UI (shadcn/ui)
│   ├── contexts/          # Context API (AuthContext, DataContext)
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilitários e configurações
│   │   ├── supabase.ts   # Cliente Supabase
│   │   ├── pdfExport.ts  # Funções de exportação PDF
│   │   └── utils.ts       # Funções utilitárias
│   ├── pages/             # Páginas da aplicação
│   │   ├── admin/         # Páginas administrativas
│   │   ├── operator/      # Páginas do operador
│   │   ├── clients/       # Gestão de clientes
│   │   └── budgets/       # Gestão de orçamentos
│   ├── App.tsx            # Componente raiz
│   └── main.tsx           # Entry point
├── .env                   # Variáveis de ambiente (não commitado)
├── package.json           # Dependências e scripts
├── tailwind.config.ts     # Configuração Tailwind
├── tsconfig.json          # Configuração TypeScript
└── vite.config.ts         # Configuração Vite
```

## 🔒 Segurança

### Autenticação
- Autenticação via Supabase Auth
- Sessões gerenciadas automaticamente
- Logout seguro

### Autorização
- **Admin**: Acesso total ao sistema
- **Operador**: Pode criar e editar orçamentos, não pode deletar ou gerenciar peças

### Row Level Security (RLS)
Todas as tabelas possuem políticas RLS configuradas:
- `profiles`: Usuário vê apenas seu próprio perfil
- `clients`: Todos autenticados podem CRUD
- `parts`: Leitura para todos, escrita apenas para admin
- `budgets`: Leitura para todos, delete apenas para admin
- `motors`: Leitura para todos, delete apenas para admin

### Proteção de Rotas
- Rotas protegidas verificam autenticação
- Redirecionamento automático para login
- Verificação de roles antes de renderizar páginas

## 🚀 Deploy

### Vercel (Recomendado)

1. Conecte seu repositório à Vercel
2. Configure as variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy automático a cada push

### Outras Plataformas

O projeto pode ser deployado em qualquer plataforma que suporte aplicações Vite/React:
- Netlify
- AWS Amplify
- Cloudflare Pages
- GitHub Pages (com build estático)

## 📝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é privado e proprietário.

## 👨‍💻 Desenvolvido por

**Imbério Motor Hub** - Sistema de gestão para oficinas de motores elétricos

---

⭐ Se este projeto foi útil para você, considere dar uma estrela!
