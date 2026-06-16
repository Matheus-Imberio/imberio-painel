# 📋 Relatório de Integração Backend/Frontend — GoVibe Agno

Este relatório destina-se à equipe de **Frontend** para detalhar como integrar o aplicativo mobile-first (PWA) ao novo ecossistema backend inteligente de agentes (**Agno** + **FastAPI**) e ao banco de dados unificado (**Supabase**).

---

## 🗄️ 1. Estrutura do Banco de Dados (Supabase)

O frontend pode consultar diretamente o Supabase (leitura pública protegida por RLS ou autenticação do usuário) utilizando as seguintes tabelas principais:

### Tabelas Principais do Feed e Países
1. **`countries`**:
   - Contém a lista de países suportados.
   - Campos: `code` (ISO 2 letras, ex: "PT"), `name`, `currency`, `currency_code`, `capital`, `language`, `flag_url`.
2. **`country_details`**:
   - Dados completos sintetizados do país.
   - Campos: `country_code` (foreign key), `summary` (texto em markdown), `security_score`, `cost_of_living` (JSONB com campos `aluguel_medio_1_quarto`, `refeicao_restaurante_simples`, etc., convertidos em R$), `visas` (JSONB contendo lista de vistos com `nome_visto`, `duracao`, `custo_aproximado`, `requisito_principal`), `job_market_summary`.
3. **`feed_items`**:
   - Tabela unificada contendo notícias, vagas de emprego e dicas.
   - Campos: `id` (UUID), `title`, `description` (resumo curto), `content` (artigo completo em markdown), `original_url` (fonte original), `image_url`, `source_name`, `country_code`, `category` (`'noticia' | 'vaga' | 'dica' | 'burocracia'`), `status` (`'draft' | 'pending_review' | 'published'`), `published_at`.
   - **Nota**: Somente itens com `status = 'published'` devem ser exibidos no feed geral!
4. **`jobs`**:
   - Extensão para dados específicos de vagas de emprego.
   - Campos: `id`, `feed_item_id` (foreign key para `feed_items`), `company`, `location`, `salary`, `work_modality` (`'remoto' | 'hibrido' | 'presencial'`), `visa_sponsorship_offered` (boolean).

### Tabelas de Interação e Fórum
5. **`community_posts`**: Posts criados no fórum (`id`, `user_id`, `title`, `content`, `upvotes`, `tags` (array), `country_code`, `status` (`'pending' | 'approved' | 'flagged'`)).
6. **`comments`**: Comentários vinculados aos posts (`id`, `post_id`, `user_id`, `content`).
7. **`saved_items`**: Favoritos do usuário (`user_id`, `feed_item_id`).
8. **`user_interests`** e **`user_countries`**: Preferências de personalização do usuário final.
9. **`notifications`**: Histórico de alertas de novos vistos ou vagas.

### Tabelas Administrativas
10. **`content_reviews`**:
    - Fila de curadoria e moderação de conteúdo (admin).
    - Campos: `id`, `item_type` (`'feed_item' | 'community_post'`), `item_id`, `status` (`'pending' | 'approved' | 'rejected'`), `review_notes`.
11. **`agent_runs`**:
    - Logs em tempo real de execuções dos agentes para auditoria do painel.

---

## ⚡ 2. Endpoints da API REST (FastAPI)

A API do backend roda localmente por padrão em `http://localhost:8000`. Ela é protegida por uma chave secreta fornecida no header HTTP para ações de escrita e disparos.

### Autenticação nas chamadas
Toda requisição que requeira proteção (como moderação ou disparar agentes) deve conter o Header:
- **`x-api-key`**: `govibe-super-secret-token-2026` *(configurável no .env)*

---

### 🟢 A. Disparar Pipeline de Agentes
Inicia um processo em segundo plano (assíncrono) para raspar e estruturar dados atualizados.

- **Método**: `POST`
- **Rota**: `/api/run`
- **Headers**:
  ```http
  x-api-key: govibe-super-secret-token-2026
  Content-Type: application/json
  ```
- **Body JSON**:
  ```json
  {
    "agents": ["news", "jobs"],
    "countries": ["PT", "DE"],
    "mode": "manual"
  }
  ```
  *(Os agentes aceitos são: `'news'`, `'jobs'`, `'countries'`, `'curator'`, `'community'`)*
- **Resposta**:
  ```json
  {
    "message": "Pipeline de agentes iniciado com sucesso em segundo plano.",
    "running_agents": ["news", "jobs"],
    "target_countries": ["PT", "DE"],
    "mode": "manual"
  }
  ```

---

### 🟢 B. Obter Feed Personalizado (ProfileAgent)
Retorna o feed de notícias e vagas perfeitamente ordenado e recomendado para o perfil de um usuário específico, adicionando o motivo da recomendação por IA.

- **Método**: `POST`
- **Rota**: `/api/profile/feed`
- **Headers**:
  ```http
  Content-Type: application/json
  ```
- **Body JSON**:
  ```json
  {
    "user_id": "a9b8c7d6-e5f4-3c2b-1a09-fedcba987654"
  }
  ```
- **Resposta**:
  ```json
  {
    "user_id": "a9b8c7d6-e5f4-3c2b-1a09-fedcba987654",
    "total_items": 2,
    "feed": [
      {
        "id": "e3a890a5-f93d-4c3e-9087-fc068b5a0342",
        "title": "Vaga: Desenvolvedor React Native - Tech Portugal",
        "description": "Buscamos desenvolvedor de aplicativos móveis...",
        "category": "vaga",
        "country_code": "PT",
        "recommendation_score": 95,
        "recommendation_reason": "Altamente recomendado porque você busca vagas na área de TI em Portugal.",
        "job_details": {
          "company": "Tech Portugal",
          "location": "Lisboa, Portugal",
          "salary": "€35.000/ano",
          "work_modality": "hibrido",
          "visa_sponsorship_offered": true
        }
      }
    ]
  }
  ```

---

### 🟢 C. Moderação Manual de Curadoria (Painel Admin)
Usado pelo Painel Administrativo para aprovar ou rejeitar itens que entraram na fila de curadoria.

- **Método**: `POST`
- **Rota**: `/api/admin/approve`
- **Headers**:
  ```http
  x-api-key: govibe-super-secret-token-2026
  Content-Type: application/json
  ```
- **Body JSON**:
  ```json
  {
    "review_id": "550e8400-e29b-41d4-a716-446655440000",
    "approve": true,
    "notes": "Aprovado e revisado pelo editor principal."
  }
  ```
- **Resposta**:
  ```json
  {
    "review_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "approved",
    "message": "Item do feed publicado."
  }
  ```

---

### 🟢 D. Consultar Status do Agente
Obtém os logs textuais e o progresso real de execução de uma tarefa do agente.

- **Método**: `GET`
- **Rota**: `/api/status/{run_id}`
- **Resposta**:
  ```json
  {
    "id": "f5d05bfd-ecba-40a2-aa56-bd8853b0bc19",
    "agent_name": "news",
    "status": "success",
    "started_at": "2026-05-30T10:28:41Z",
    "finished_at": "2026-05-30T10:28:43Z",
    "items_created": 3,
    "logs": "[10:28:41] Iniciando busca...\n[10:28:42] 3 notícias salvas...\n",
    "error_message": null
  }
  ```

---

## 💻 3. Exemplos de Implementação de Consumo (JavaScript / TypeScript)

### Exemplo 1: Buscar Feed Personalizado do Usuário
```typescript
interface FeedItem {
  id: string;
  title: string;
  category: 'noticia' | 'vaga' | 'dica';
  recommendation_score: number;
  recommendation_reason: string;
  job_details?: {
    company: string;
    location: string;
    salary: string;
    visa_sponsorship_offered: boolean;
  };
}

async function fetchPersonalizedFeed(userId: string): Promise<FeedItem[]> {
  try {
    const response = await fetch('http://localhost:8000/api/profile/feed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId }),
    });
    
    if (!response.ok) throw new Error('Erro ao buscar feed personalizado');
    
    const data = await response.json();
    return data.feed;
  } catch (error) {
    console.error('Falha de conexão com o Agente de Recomendação:', error);
    return [];
  }
}
```

### Exemplo 2: Disparar Ingestão Diária de Notícias (Painel Admin)
```javascript
async function triggerNewsIngestion() {
  const response = await fetch('http://localhost:8000/api/run', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'govibe-super-secret-token-2026'
    },
    body: JSON.stringify({
      agents: ['news'],
      countries: ['PT', 'DE', 'CA'],
      mode: 'auto'
    })
  });
  
  const result = await response.json();
  alert(result.message);
}
```

---

## 🎨 4. Benefícios Desta Nova Arquitetura
1. **Feed Sempre Limpo e Seguro**: Graças ao pipeline `Notícias/Vagas -> CuratorAgent (pending) -> Admin Approval`, o risco de spam, links quebrados ou fake news no feed foi reduzido a zero.
2. **Recomendação Semântica Real**: O feed não é mais apenas ordenado por data; a IA pontua e personaliza cada card baseando-se no objetivo específico do usuário.
3. **Escalabilidade Total**: A estrutura de banco e rotas REST permite acoplar novas abas, painéis e filtros no PWA com alteração mínima de código!
