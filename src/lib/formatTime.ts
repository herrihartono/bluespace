import { format, isToday, isYesterday, isThisYear } from "date-fns";

export function formatTimestamp(ts: number): string {
  if (!ts || ts <= 0) return "";
  const date = new Date(ts);
  if (isToday(date)) return format(date, "HH:mm");
  if (isYesterday(date)) return `Yesterday, ${format(date, "HH:mm")}`;
  if (isThisYear(date)) return format(date, "d MMM, HH:mm");
  return format(date, "d MMM yyyy, HH:mm");
}

export function formatChatDate(ts: number): string {
  if (!ts || ts <= 0) return "";
  const date = new Date(ts);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  if (isThisYear(date)) return format(date, "d MMMM");
  return format(date, "d MMMM yyyy");
}

export function isSameDay(ts1: number, ts2: number): boolean {
  const d1 = new Date(ts1);
  const d2 = new Date(ts2);
  return d1.getFullYear() === d2.getFullYear()
    && d1.getMonth() === d2.getMonth()
    && d1.getDate() === d2.getDate();
}
