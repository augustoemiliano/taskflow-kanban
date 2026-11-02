import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";
import { resolveApiBaseUrl } from "../services/api";
import { GENERIC_ERROR_MESSAGE, NETWORK_ERROR_MESSAGE, getApiErrorMessage } from "./apiError";
import { validateTaskForm } from "./taskValidation";

const buildAxiosError = (response?: { status: number; data: unknown }) => {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError(
    "Request failed",
    response ? "ERR_BAD_REQUEST" : "ERR_NETWORK",
    config,
    {},
    response ? { ...response, statusText: "", headers: {}, config } : undefined
  );
};

describe("getApiErrorMessage", () => {
  it("usa a mensagem do contrato de erro da API", () => {
    const error = buildAxiosError({
      status: 400,
      data: { success: false, error: { code: "VALIDATION_ERROR", message: "Campos inválidos." } }
    });

    expect(getApiErrorMessage(error)).toBe("Campos inválidos.");
  });

  it("informa quando a API está inacessível", () => {
    expect(getApiErrorMessage(buildAxiosError())).toBe(NETWORK_ERROR_MESSAGE);
  });

  it("cai na mensagem genérica para respostas sem o contrato ou erros desconhecidos", () => {
    expect(getApiErrorMessage(buildAxiosError({ status: 502, data: "<html>Bad gateway</html>" }))).toBe(
      GENERIC_ERROR_MESSAGE
    );
    expect(getApiErrorMessage(new Error("boom"))).toBe(GENERIC_ERROR_MESSAGE);
  });
});

describe("validateTaskForm", () => {
  it("normaliza espaços e aprova dados válidos", () => {
    const result = validateTaskForm({ title: "  Criar layout ", description: "  desc  ", priority: "HIGH" });

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
    expect(result.payload).toEqual({ title: "Criar layout", description: "desc", priority: "HIGH" });
  });

  it("rejeita título curto (após trim) e descrição longa", () => {
    const result = validateTaskForm({ title: "  ab  ", description: "x".repeat(501), priority: "LOW" });

    expect(result.isValid).toBe(false);
    expect(result.errors.title).toMatch(/entre 3 e 100/);
    expect(result.errors.description).toMatch(/500/);
  });
});

describe("resolveApiBaseUrl", () => {
  it("prioriza VITE_API_URL removendo barra final", () => {
    expect(resolveApiBaseUrl({ VITE_API_URL: " https://api.exemplo.com/api/ ", DEV: false })).toBe(
      "https://api.exemplo.com/api"
    );
  });

  it("usa localhost em desenvolvimento e /api em produção como padrão", () => {
    expect(resolveApiBaseUrl({ DEV: true })).toBe("http://localhost:3333/api");
    expect(resolveApiBaseUrl({ VITE_API_URL: "", DEV: false })).toBe("/api");
  });
});
