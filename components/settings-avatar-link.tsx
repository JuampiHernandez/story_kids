import Link from "next/link";

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
      <span className="settings-avatar-emoji" aria-hidden>
        🧒
      </span>
    </Link>
  );
}
