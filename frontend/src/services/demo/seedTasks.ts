import type { Task, TaskPriority, TaskStatus } from "../../types/task";

interface SeedTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  /** How long ago the task was created/updated, in hours (keeps the sample dates realistic). */
  createdHoursAgo: number;
  updatedHoursAgo: number;
}

const SEED: SeedTask[] = [
  {
    id: "5f0c2a1e-7b3d-4c8e-9a61-0d2b4e6f8a10",
    title: "Definir escopo da versão 1.0",
    description:
      "Listar as funcionalidades obrigatórias do lançamento, separar o que fica para depois e validar a lista com o time de produto.",
    status: "TODO",
    priority: "HIGH",
    createdHoursAgo: 30,
    updatedHoursAgo: 30
  },
  {
    id: "8a7d3c2b-1e4f-4a6b-8c9d-2f3e4a5b6c71",
    title: "Configurar monitoramento de erros",
    description: "Integrar uma ferramenta de rastreamento de erros no front-end e no back-end, com alertas por e-mail.",
    status: "TODO",
    priority: "LOW",
    createdHoursAgo: 26,
    updatedHoursAgo: 26
  },
  {
    id: "c3e1b7a9-2d4f-4e8a-b1c2-3d4e5f6a7b82",
    title: "Criar tela de login responsiva",
    description:
      "Implementar o formulário com validação de campos, mensagens de erro acessíveis e layout adaptado para celular.",
    status: "IN_PROGRESS",
    priority: "URGENT",
    createdHoursAgo: 48,
    updatedHoursAgo: 3
  },
  {
    id: "1b2c3d4e-5f6a-4b7c-9d8e-4f5a6b7c8d93",
    title: "Escrever testes da API de tarefas",
    description: "Cobrir criação, edição, troca de status e exclusão, incluindo os cenários de validação e de erro 404.",
    status: "IN_PROGRESS",
    priority: "MEDIUM",
    createdHoursAgo: 40,
    updatedHoursAgo: 6
  },
  {
    id: "9e8d7c6b-5a4f-4e3d-a2c1-5b6c7d8e9fa4",
    title: "Revisar textos do onboarding",
    description: "Conferir ortografia, tom de voz e clareza das três telas de boas-vindas antes da publicação.",
    status: "REVIEW",
    priority: "MEDIUM",
    createdHoursAgo: 72,
    updatedHoursAgo: 10
  },
  {
    id: "4d5e6f7a-8b9c-4d0e-b1f2-6a7b8c9d0eb5",
    title: "Publicar pipeline de CI",
    description: "Rodar lint, checagem de tipos, testes e build automaticamente a cada push e pull request.",
    status: "DONE",
    priority: "HIGH",
    createdHoursAgo: 96,
    updatedHoursAgo: 20
  }
];

const HOUR_IN_MS = 60 * 60 * 1000;

/** Sample tasks for the demo, with dates relative to `now`. */
export const buildSeedTasks = (now: Date = new Date()): Task[] =>
  SEED.map(({ createdHoursAgo, updatedHoursAgo, ...task }) => ({
    ...task,
    createdAt: new Date(now.getTime() - createdHoursAgo * HOUR_IN_MS).toISOString(),
    updatedAt: new Date(now.getTime() - updatedHoursAgo * HOUR_IN_MS).toISOString()
  }));
