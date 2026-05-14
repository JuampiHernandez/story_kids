/** Library card heading — avoids `Twillo, curious.'s Story` when AI ends protagonist with a period. */
export function possessiveStoryHeading(protagonist: string): string {
  const cleaned = protagonist.trim().replace(/\.+$/, "").trim();
  const hero = cleaned.length ? cleaned : "This hero";
  return `${hero}'s Story`;
}
