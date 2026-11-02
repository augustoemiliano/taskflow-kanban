import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DemoBanner } from "./DemoBanner";

describe("DemoBanner", () => {
  it("avisa que os dados ficam no navegador e restaura os dados de exemplo", async () => {
    const onReset = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<DemoBanner onReset={onReset} />);

    expect(screen.getByText(/os dados ficam salvos só no seu navegador/i)).toBeInTheDocument();

    const button = screen.getByRole("button", { name: /restaurar dados de exemplo/i });
    await user.click(button);

    expect(onReset).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(button).toBeEnabled());
  });
});
