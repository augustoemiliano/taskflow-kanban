import { Button } from "./Button";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isConfirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog = ({
  isOpen,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  isConfirming = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      title={title}
      description={description}
      onClose={onCancel}
      isDismissDisabled={isConfirming}
      className="max-w-md"
    >
      <div className="mt-6 flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isConfirming}>
          {cancelLabel}
        </Button>
        <Button type="button" variant="danger" onClick={onConfirm} disabled={isConfirming}>
          {isConfirming ? "Excluindo..." : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
};
