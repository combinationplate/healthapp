import { createClient as createServiceClient } from "@supabase/supabase-js";

export type SeoCourse = { id: string; name: string; hours: number; topic: string | null };

function admin() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** Strip internal name prefixes like "*NEW*" for public display. */
export function cleanCourseName(name: string): string {
  return name.replace(/^\*[^*]+\*\s*/i, "").trim();
}

/**
 * Live list of available courses approved for the given profession label(s),
 * pulled from the existing course_professions → courses data. Returns [] on
 * any failure so the page still renders (with a graceful fallback).
 */
export async function getCoursesForProfessions(professions: string[]): Promise<SeoCourse[]> {
  try {
    const db = admin();
    const { data } = await db
      .from("course_professions")
      .select("profession, courses(id, name, hours, topic)")
      .in("profession", professions);

    const map = new Map<string, SeoCourse>();
    for (const row of (data ?? []) as unknown as { courses: SeoCourse | SeoCourse[] | null }[]) {
      const c = Array.isArray(row.courses) ? row.courses[0] : row.courses;
      if (!c?.id) continue;
      if (!map.has(c.id)) {
        map.set(c.id, { id: c.id, name: c.name, hours: c.hours, topic: c.topic ?? null });
      }
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  } catch (e) {
    console.error("getCoursesForProfessions failed:", e);
    return [];
  }
}
