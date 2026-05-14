"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/auth-browser";

export function SettingsMagicLinkPanel() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const sb = createSupabaseBrowserClient();
    if (!sb) {
      setStatus("error");
      setMessage(
        "Sign-in is not wired up on this deployment: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your host (e.g. Vercel → Environment Variables → Production), then redeploy. In Supabase → Authentication → URL Configuration, add your production URL and redirect https://YOUR_DOMAIN/auth/callback.",
      );
      return;
    }

    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes("@")) {
      setStatus("error");
      setMessage("Enter a valid email address.");
      return;
    }

    setStatus("sending");
    setMessage("");

    const { error } = await sb.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("sent");
    setMessage("Check your inbox—open our email and tap the link to finish signing in.");
  };

  return (
    <section className="settings-auth-card">
      <header className="settings-auth-header">
        <span className="settings-auth-icon" aria-hidden>
          <Mail size={26} strokeWidth={2.4} />
        </span>
        <div>
          <h2 className="settings-auth-title">Parent sign-in</h2>
          <p className="settings-auth-lede">
            Storypop stays playable for kids without an account. Sign in here to save stories to your library,
            customize faces and names, and unlock premium illustration options when your email qualifies.
          </p>
        </div>
      </header>

      <form className="settings-auth-form" onSubmit={(event) => void submit(event)}>
        <label className="settings-label">
          Email address
          <input
            className="settings-input"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            disabled={status === "sending"}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <button className="settings-save" type="submit" disabled={status === "sending"}>
          {status === "sending" ? "Sending link…" : "Email me a sign-in link"}
        </button>
      </form>

      {message ? (
        <p className={status === "error" ? "settings-error" : "settings-hint"}>{message}</p>
      ) : null}
    </section>
  );
}
