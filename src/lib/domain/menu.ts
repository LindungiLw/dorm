import { prisma } from "@/lib/db";
import { todayStr } from "@/lib/time";

// The list of dates for a menu week: today + the next (days-1) days.
export function weekDates(days = 7, from: Date = new Date()): string[] {
  const out: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    out.push(todayStr(d));
  }
  return out;
}

export type MenuMap = Record<string, Record<string, string>>; // date -> mealType -> items

// Load every menu entry as a { date: { mealType: items } } map. The menu table is small
// and bounded, so the calendar can navigate any month without extra round-trips.
export async function getAllMenu(): Promise<MenuMap> {
  const rows = await prisma.cafeteriaMenu.findMany();
  const map: MenuMap = {};
  for (const r of rows) {
    (map[r.menuDate] ??= {})[r.mealType] = r.items;
  }
  return map;
}

// Load the menu for a set of dates into a { date: { mealType: items } } map. Missing
// meals simply have no key (rendered as "not set yet").
export async function getMenuForDates(dates: string[]): Promise<MenuMap> {
  const rows = await prisma.cafeteriaMenu.findMany({
    where: { menuDate: { in: dates } },
  });
  const map: MenuMap = {};
  for (const d of dates) map[d] = {};
  for (const r of rows) {
    (map[r.menuDate] ??= {})[r.mealType] = r.items;
  }
  return map;
}
