import { Info, RotateCcw } from "lucide-react";
import { useState } from "react";

interface DemoBannerProps {
  onReset: () => Promise<void>;
}

export const DemoBanner = ({ onReset }: DemoBannerProps) => {
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await onReset();
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <aside
      aria-label="Aviso do modo demonstração"
      className="mb-6 flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="flex items-center gap-2">
        <Info size={16} aria-hidden="true" className="shrink-0" />
        Modo demonstração — os dados ficam salvos só no seu navegador
      </p>
      <button
        type="button"
        onClick={() => void handleReset()}
        disabled={isResetting}
        className="inline-flex items-center gap-1.5 self-start rounded-md px-2 py-1 font-medium text-amber-900 underline-offset-2 hover:bg-amber-100 hover:underline disabled:opacity-60 sm:self-auto"
      >
        <RotateCcw size={14} aria-hidden="true" />
        Restaurar dados de exemplo
      </button>
    </aside>
  );
};
