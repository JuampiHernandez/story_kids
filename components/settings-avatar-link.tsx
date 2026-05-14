import Link from "next/link";
import { Settings } from "lucide-react";

type SettingsAvatarLinkProps = {
  className?: string;
};

export function SettingsAvatarLink({ className }: SettingsAvatarLinkProps) {
  return (
    <Link
      className={className ?? "settings-avatar-button"}
      href="/settings"
      aria-label="Parent settings"
    >
      <Settings className="settings-avatar-icon" size={26} strokeWidth={2.4} aria-hidden />
    </Link>
  );
}
