import { BookOpen } from "lucide-react";

export function StorypopLogoLegacy() {
  return (
    <>
      <div className="mascot-book">
        <BookOpen size={24} strokeWidth={2.4} />
        <span />
      </div>
      <span className="brand-text" aria-hidden="true">
        <span>s</span>
        <span>t</span>
        <span>o</span>
        <span>r</span>
        <span>y</span>
        <span>p</span>
        <span>o</span>
        <span>p</span>
      </span>
    </>
  );
}
