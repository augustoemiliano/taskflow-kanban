# TaskFlow Kanban

Sistema web de Kanban para organizar tarefas por status e prioridade, com **front-end** e **back-end** separados, arquitetura em camadas e foco em segurança e legibilidade.

## Objetivo

Demonstrar um fluxo completo de aplicação moderna (SPA + API REST) com validação de entrada, tratamento global de erros, UX profissional e código preparado para evoluir para persistência em banco relacional.

## Funcionalidades

- Criar, listar, buscar por ID, editar e excluir tarefas
- Alterar status via **drag and drop**
- Prioridades e filtros
- Busca por título/descrição
- Contadores por coluna
- Estados de carregamento, erro e vazio
- Confirmação antes de excluir
- Feedback com toasts

## Tecnologias

### Front-end

- React + TypeScript + Vite
- Tailwind CSS (via `@tailwindcss/vite`)
- React Router
- Axios
- `@dnd-kit/*`
- `lucide-react`
- `react-hot-toast`
- `clsx`

### Back-end

- Node.js + TypeScript
- Express
- Zod
- CORS controlado por variável de ambiente
- `dotenv`
- `uuid`

## Arquitetura

### Por que separar front e back?

- **Escalabilidade e deploy independente**: cada camada pode evoluir e ser publicada separadamente.
- **Contrato explícito**: a API REST documenta o comportamento do sistema e facilita testes.
- **Segurança**: validação e regras de negócio ficam no servidor; o cliente não é fonte de verdade.

### Como o front conversa com o back

O front usa `Axios` com `baseURL` vinda de `VITE_API_URL` (ex.: `http://localhost:3333/api`) e consome os endpoints abaixo.

O back valida todas as entradas com **Zod**, aplica regras em `service` e persiste via `repository` (in-memory neste momento).

## Estrutura de pastas

```
taskflow-kanban/
├── backend/
├── frontend/
├── README.md
└── .gitignore
```

## Como rodar localmente

### Pré-requisitos

- Node.js 20+ (recomendado)

### Back-end

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Servidor padrão: `http://localhost:3333`

O servidor faz bind em `0.0.0.0` para facilitar acesso via `localhost` (IPv4/IPv6 dependendo do SO).

### Front-end

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App padrão: `http://localhost:5173`

## Variáveis de ambiente

### `backend/.env.example`

- `PORT`: porta HTTP do servidor
- `NODE_ENV`: ambiente de execução
- `FRONTEND_URL`: origem permitida no CORS

### `frontend/.env.example`

- `VITE_API_URL`: URL base da API (inclui `/api`)

## Endpoints da API

Base: `/api`

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/tasks` | Lista tarefas |
| GET | `/tasks/:id` | Busca por ID |
| POST | `/tasks` | Cria tarefa |
| PATCH | `/tasks/:id` | Atualiza campos |
| PATCH | `/tasks/:id/status` | Atualiza apenas status |
| DELETE | `/tasks/:id` | Remove tarefa |

### Padrão de resposta

Sucesso:

```json
{ "success": true, "data": {} }
```

Erro:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Existem campos inválidos na requisição.",
    "details": []
  }
}
```

## Testes rápidos (curl)

```bash
curl -X POST http://localhost:3333/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Criar layout","description":"Kanban","priority":"HIGH"}'

curl http://localhost:3333/api/tasks
```

## Prints / GIFs

> Adicione aqui capturas de tela ou um GIF curto do fluxo (criar tarefa, arrastar entre colunas, filtrar e excluir).

## Melhorias futuras

- Persistência em **PostgreSQL** com migrations
- Autenticação (JWT) e multiusuário
- Auditoria de mudanças (histórico)
- Testes automatizados (Vitest/Jest + Supertest)
- CI com lint, typecheck e build

## Status

**MVP funcional** com arquitetura profissional e caminho claro de evolução.
