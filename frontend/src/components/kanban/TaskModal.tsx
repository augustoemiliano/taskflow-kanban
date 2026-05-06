import { useEffect, useMemo, useState } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Textarea } from "../ui/Textarea";
import { PRIORITY_LABELS } from "../../constants/task";
import type { CreateTaskPayload, Task, TaskPriority } from "../../types/task";

interface TaskModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  task?: Task;
  onClose: () => void;
  onSubmit: (payload: CreateTaskPayload) => Promise<void>;
}

interface TaskFormData {
  title: string;
  description: string;
  priority: TaskPriority;
}

const getInitialFormData = (task?: Task): TaskFormData => ({
  title: task?.title ?? "",
  description: task?.description ?? "",
  priority: task?.priority ?? "MEDIUM"
});

export const TaskModal = ({ isOpen, mode, task, onClose, onSubmit }: TaskModalProps) => {
  const [formData, setFormData] = useState<TaskFormData>(getInitialFormData(task));
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormData(getInitialFormData(task));
    setFormError(null);
  }, [task, isOpen]);

  const modalTitle = useMemo(() => (mode === "create" ? "Nova tarefa" : "Editar tarefa"), [mode]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedTitle = formData.title.trim();
    const normalizedDescription = formData.description.trim();

    if (normalizedTitle.length < 3 || normalizedTitle.length > 100) {
      setFormError("O título deve ter entre 3 e 100 caracteres.");
      return;
    }

    if (normalizedDescription.length > 500) {
      setFormError("A descrição deve ter no máximo 500 caracteres.");
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      await onSubmit({
        title: normalizedTitle,
        description: normalizedDescription,
        priority: formData.priority
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900">{modalTitle}</h2>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Título"
            value={formData.title}
            onChange={(event) => setFormData((currentData) => ({ ...currentData, title: event.target.value }))}
            placeholder="Ex.: Criar tela inicial"
            maxLength={100}
            required
          />

          <Textarea
            label="Descrição"
            value={formData.description}
            onChange={(event) =>
              setFormData((currentData) => ({ ...currentData, description: event.target.value }))
            }
            placeholder="Descreva brevemente a tarefa"
            maxLength={500}
          />

          <Select
            label="Prioridade"
            value={formData.priority}
            onChange={(event) =>
              setFormData((currentData) => ({ ...currentData, priority: event.target.value as TaskPriority }))
            }
          >
            {Object.entries(PRIORITY_LABELS).map(([priority, label]) => (
              <option key={priority} value={priority}>
                {label}
              </option>
            ))}
          </Select>

          {formError ? <p className="text-sm text-rose-600">{formError}</p> : null}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : mode === "create" ? "Criar tarefa" : "Salvar alterações"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
