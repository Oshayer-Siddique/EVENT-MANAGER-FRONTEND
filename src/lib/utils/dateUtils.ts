export const formatDate = (date: Date): string => {
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
};

export const formatDateRange = (start: Date, end: Date): string => {
  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = start.toLocaleString('default', { month: 'short' });
  const endMonth = end.toLocaleString('default', { month: 'short' });
  const year = start.getFullYear();

  if (startDay === endDay && startMonth === endMonth) {
    return `${startDay} ${startMonth.toUpperCase()}, ${year}`;
  }

  return `${startDay} ${startMonth.toUpperCase()} - ${endDay} ${endMonth.toUpperCase()}, ${year}`;
};
