"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiFetch } from "@/lib/api";
import { setToken, setUser } from "@/lib/session";

type LoginResponse = {
  token: string;
};

type MeResponse = {
  id?: string | number;
  name?: string;
  email?: string;
  role?: "OPERADOR" | "ANALISTA" | "GESTAO" | string;
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const login = await apiFetch<LoginResponse>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        skipAuth: true,
      });

      setToken(login.token);

      const me = await apiFetch<MeResponse>("/api/v1/me");
      setUser(me);

      router.push("/app");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erro ao autenticar.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow">
        <h1 className="text-2xl font-semibold text-slate-900">Entrar</h1>
        <p className="mt-2 text-sm text-slate-500">
          Acesse sua conta para continuar.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
              placeholder="seu@email.com"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="password">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
              placeholder="••••••••"
              required
            />
          </div>
          {error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
              {error}
            </div>
          ) : null}
          <button
            type="submit"
            className="flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
