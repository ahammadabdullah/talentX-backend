export const isDateExpired = (deadline: Date): boolean => {
  return new Date() > deadline;
};

export const formatDateToISO = (date: Date): string => {
  return date.toISOString();
};

export const parseISODate = (dateString: string): Date => {
  return new Date(dateString);
};
