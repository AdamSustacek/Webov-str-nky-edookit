"use client";
import { useState, useEffect, useRef } from "react";
import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { GraduationCap, Lock, Delete } from "lucide-react";

const STORAGE_KEY = "zs_labska_auth";
const STORAGE_KEY = "zs_alexandra_auth";
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours

export type UserRole = "admin" | "student";

interface StoredSession {
  expires: number;
  role: UserRole;
}

const RoleContext = createContext<UserRole>("student");
export const useRole = () => useContext(RoleContext);

export default function LoginGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const verifyPin = useAction(api.emails.verifyPin);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const session: StoredSession = JSON.parse(raw);
        if (session.expires > Date.now()) {
          setAuthed(true);
          setRole(session.role);
          return;
        }
      }
    } catch {}
    setAuthed(false);
    setRole(null);
  }, []);

  useEffect(() => {
    if (authed === false) {
    if (role === null) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [authed]);
  }, [role]);

  const handleKey = async (digit: string) => {
    if (loading) return;
    const next = pin + digit;
    setPin(next);
    setError("");

    if (next.length === 4) {
      setLoading(true);
      try {
        const ok = await verifyPin({ pin: next });
        if (ok) {
          const session: StoredSession = { expires: Date.now() + SESSION_DURATION };
        const result = await verifyPin({ pin: next });
        if (result) {
          const session: StoredSession = { expires: Date.now() + SESSION_DURATION, role: result };
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
          setAuthed(true);
          setRole(result);
        } else {
          setShake(true);
          setError("Nesprávný PIN");
          setTimeout(() => {
            setPin("");
            setShake(false);
            setError("");
          }, 1200);
        }
      } catch {
        setError("Chyba připojení");
        setPin("");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDelete = () => {
    if (loading) return;
    setPin((p) => p.slice(0, -1));
    setError("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (val.length > pin.length) {
      const newDigit = val[val.length - 1];
      handleKey(newDigit);
      handleKey(val[val.length - 1]);
    } else {
      setPin(val);
    }
  };

  if (authed === null) {
  // Loading state (checking session)
  if (role === undefined) {
    return (
      <div className="min-h-screen bg-sidebar flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (authed) return <>{children}</>;
  // Logged in
  if (role !== null) {
    return <RoleContext.Provider value={role}>{children}</RoleContext.Provider>;
  }

  const dots = Array.from({ length: 4 }, (_, i) => i < pin.length);

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center px-4">
      <div className="w-full max-w-xs flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <GraduationCap size={32} className="text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-white font-bold text-xl tracking-tight">ZŠ Labská</h1>
            <h1 className="text-white font-bold text-xl tracking-tight">ZS Alexandra I.</h1>
            <p className="text-white/40 text-sm mt-0.5">Žákovská knížka</p>
          </div>
        </div>

        {/* PIN card */}
        <div
          className={`w-full bg-white/5 border border-white/10 rounded-2xl p-7 flex flex-col items-center gap-6 backdrop-blur-sm
            ${shake ? "animate-shake" : ""}`}
        >
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <Lock size={14} />
            <span>Zadejte PIN</span>
          </div>

          {/* Dots */}
          <div className="flex gap-4">
            {dots.map((filled, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-150
                  ${filled
                    ? "bg-primary border-primary scale-110"
                    : "bg-transparent border-white/25"
                  }`}
              />
            ))}
          </div>

          {/* Error */}
          <div className={`text-sm font-medium transition-opacity duration-200 ${error ? "text-red-400 opacity-100" : "opacity-0"}`}>
            {error || "‎"}
          </div>

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-3 w-full">
            {["1","2","3","4","5","6","7","8","9"].map((d) => (
              <button
                key={d}
                onClick={() => handleKey(d)}
                disabled={loading || pin.length >= 4}
                className="h-14 rounded-xl bg-white/8 hover:bg-white/15 active:scale-95 transition-all
                  text-white font-semibold text-xl border border-white/10 hover:border-white/20
                  disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {d}
              </button>
            ))}
            <div />
            <button
              onClick={() => handleKey("0")}
              disabled={loading || pin.length >= 4}
              className="h-14 rounded-xl bg-white/8 hover:bg-white/15 active:scale-95 transition-all
                text-white font-semibold text-xl border border-white/10 hover:border-white/20
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              0
            </button>
            <button
              onClick={handleDelete}
              disabled={loading || pin.length === 0}
              className="h-14 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all
                text-white/60 border border-white/10 hover:border-white/20
                disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Delete size={20} />
            </button>
          </div>

          {/* Hidden input for mobile keyboard */}
          <input
            ref={inputRef}
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            value={pin}
            onChange={handleInputChange}
            className="sr-only"
            aria-label="PIN"
          />
        </div>

        <p className="text-white/20 text-xs text-center">
          ZŠ Labská · Žákovská knížka
          ZS Alexandra I. · Žákovská knížka
        </p>
      </div>
    </div>
  );
}
