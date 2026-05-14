"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { StorypopLogo } from "@/components/storypop-logo";
import { SettingsAuthenticatedPanel } from "@/components/settings-authenticated-panel";
import { SettingsMagicLinkPanel } from "@/components/settings-magic-link-panel";
import { createSupabaseBrowserClient } from "@/lib/supabase/auth-browser";

export default function SettingsPage() {
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sb = createSupabaseBrowserClient();
    if (!sb) {
      setReady(true);
      return;
    }

    let cancelled = false;

    void (async () => {
      const { data } = await sb.auth.getSession();
      if (cancelled) return;
      setSessionUser(data.session?.user ?? null);
      setReady(true);
    })();

    const { data: sub } = sb.auth.onAuthStateChange((_event: AuthChangeEvent, sess: Session | null) => {
      setSessionUser(sess?.user ?? null);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <main className="storybook-view settings-screen">
      <div className="storybook-shell app-screen library-screen settings-shell">
        <span className="sky cloud cloud-one" />
        <span className="sky cloud cloud-two" />

        <header className="app-topbar">
          <Link className="brand-lockup" href="/" aria-label="Storypop home">
            <StorypopLogo className="storypop-logo" />
          </Link>
          <span className="settings-top-spacer" aria-hidden />
        </header>

        {!ready ? (
          <p className="settings-loading-copy">Loading parent settings…</p>
        ) : sessionUser ? (
          <SettingsAuthenticatedPanel userEmail={sessionUser.email} />
        ) : (
          <div className="settings-layout settings-layout-auth">
            <Link className="settings-back" href="/play">
              ← Back to play
            </Link>
            <header className="settings-header-block">
              <p className="eyebrow">for parents</p>
              <h1>Story settings</h1>
              <p className="settings-hint">
                We&apos;ll email you a sign-in link—tap once to personalize Storypop and save books to your account.
              </p>
            </header>
            <SettingsMagicLinkPanel />
          </div>
        )}
      </div>
    </main>
  );
}
