const pad = (value: number) => String(value).padStart(2, '0');

export function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatMonthLabel(date: Date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

export function isSameDay(left: Date, right: Date) {
  return formatDateKey(left) === formatDateKey(right);
}

export function isFutureDay(date: Date) {
  const today = new Date();
  const candidate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return candidate > current;
}

export function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function getMonthGrid(date: Date): Array<Date | null> {
  const year = date.getFullYear();
  const month = date.getMonth();
  const days = new Date(year, month + 1, 0).getDate();
  const mondayFirstOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const cells: Array<Date | null> = Array.from({ length: mondayFirstOffset }, () => null);

  for (let day = 1; day <= days; day += 1) {
    cells.push(new Date(year, month, day));
  }

  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function getMonthStats(month: Date, checkedDates: Record<string, boolean> = {}) {
  const prefix = `${month.getFullYear()}-${pad(month.getMonth() + 1)}-`;
  const completed = Object.entries(checkedDates).filter(
    ([key, value]) => key.startsWith(prefix) && value,
  ).length;
  const today = new Date();
  const monthIndex = month.getFullYear() * 12 + month.getMonth();
  const currentIndex = today.getFullYear() * 12 + today.getMonth();
  const eligible =
    monthIndex > currentIndex
      ? 0
      : monthIndex === currentIndex
        ? today.getDate()
        : new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();

  return {
    completed,
    eligible,
    rate: eligible ? Math.round((completed / eligible) * 100) : 0,
  };
}

export function getCurrentStreak(checkedDates: Record<string, boolean> = {}) {
  const cursor = new Date();
  if (!checkedDates[formatDateKey(cursor)]) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (checkedDates[formatDateKey(cursor)]) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
