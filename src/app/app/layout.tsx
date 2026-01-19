"use client";

import { useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";
import {
  clearSession,
  getToken,
  getUser,
  setUser,
  type SessionUser,
} from "@/lib/session";

const getTrialDaysLeft = (trialEndsAt?: string) => {
  if (!trialEndsAt) return null;
  const end = new Date(trialEndsAt);
  if (Number.isNaN(end.getTime())) return null;
  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const diffMs = end.getTime() - todayStart.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    const storedUser = getUser();
    if (storedUser) {
      setUserState(storedUser);
    }

    apiFetch<SessionUser>("/api/v1/me")
      .then((data) => {
        setUser(data);
        setUserState(data);
      })
      .catch(() => {
        clearSession();
      })
      .finally(() => setLoading(false));
  }, []);

  const banner = useMemo(() => {
    const subscription = user?.subscription;
    if (!subscription) return null;
    const allowedRoles = ["ANALISTA", "GESTAO", "OPERADOR"];
    if (user?.role && !allowedRoles.includes(user.role)) {
      return null;
    }

    const daysLeft = getTrialDaysLeft(subscription.trial_ends_at);
    const isTrial = subscription.status === "TRIAL";
    const isSuspended = subscription.status === "SUSPENSA";
    const isTrialExpired = isTrial && daysLeft !== null && daysLeft < 0;

    if (isSuspended || isTrialExpired) {
      return {
        tone: "danger",
        message:
          "Sua assinatura está suspensa ou o trial expirou. Procure a gestão para ativar o plano.",
      };
    }

    if (isTrial && daysLeft !== null && daysLeft <= 3) {
      return {
        tone: "warning",
        message: `Seu trial termina em ${daysLeft} dia(s).`,
      };
    }

    return null;
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-50">
      {banner ? (
        <div
          className={`px-4 py-3 text-sm font-semibold ${
            banner.tone === "danger"
              ? "bg-rose-100 text-rose-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {banner.message}
        </div>
      ) : null}

      <main className="mx-auto w-full max-w-5xl px-4 py-6">
        {loading ? (
          <p className="text-sm text-slate-500">Carregando...</p>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
