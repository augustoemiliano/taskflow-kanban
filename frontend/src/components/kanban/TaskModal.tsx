import { useState, type FormEvent } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { Select } from "../ui/Select";
import { Textarea } from "../ui/Textarea";
import { PRIORITY_LABELS } from "../../constants/task";
import type { CreateTaskPayload, Task, TaskPriority } from "../../types/task";
import { validateTaskForm, type TaskFormErrors } from "../../utils/taskValidation";

interface TaskModalProps {
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

/**
 * Render this component only while open (and with a `key` per task) so the form
 * state is initialised from props on each opening, without syncing effects.
 */
export const TaskModal = ({ mode, task, onClose, onSubmit }: TaskModalProps) => {
  const [formData, setFormData] = useState<TaskFormData>(() => getInitialFormData(task));
  const [formErrors, setFormErrors] = useState<TaskFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { payload, errors, isValid } = validateTaskForm(formData);
    setFormErrors(errors);

    if (!isValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(payload);
      onClose();
    } catch {
      // The API error is already surfaced as a toast by useTasks; keep the modal open
      // so the user doesn't lose what was typed.
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title={mode === "create" ? "Nova tarefa" : "Editar tarefa"}
      onClose={onClose}
      isDismissDisabled={isSubmitting}
      className="max-w-lg"
    >
      <form className="mt-4 space-y-4" onSubmit={handleSubmit} noValidate>
        <Input
          label="Título"
          value={formData.title}
          onChange={(event) => setFormData((currentData) => ({ ...currentData, title: event.target.value }))}
          placeholder="Ex.: Criar tela inicial"
          maxLength={100}
          error={formErrors.title}
          required
        />

        <Textarea
          label="Descrição"
          value={formData.description}
          onChange={(event) => setFormData((currentData) => ({ ...currentData, description: event.target.value }))}
          placeholder="Descreva brevemente a tarefa"
          maxLength={500}
          error={formErrors.description}
          hint={`${formData.description.length}/500`}
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

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : mode === "create" ? "Criar tarefa" : "Salvar alterações"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
