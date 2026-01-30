import { format, formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
const toEncapsulatedDate = (dateStr) => {
  if (!dateStr) return new Date();
  const str = String(dateStr);

  // Check if it's an ISO datetime string without timezone (e.g., "2026-01-30T15:14:58")
  // These typically have a 'T' separator and no 'Z' or '+/-' offset
  if (str.includes('T') && !str.includes('Z') && !str.includes('+') && !/[+-]\d{2}:\d{2}$/.test(str)) {
    return new Date(str + 'Z');
  }

  return new Date(dateStr);
};

export const formatDateTime = (dateStr, fmt = 'd MMM yyyy HH:mm') => {
  if (!dateStr) return '-';
  return format(toEncapsulatedDate(dateStr), fmt, { locale: localeId });
};

export const formatDate = (dateStr, fmt = 'd MMM yyyy') => {
  if (!dateStr) return '-';
  return format(toEncapsulatedDate(dateStr), fmt, { locale: localeId });
};

export const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '-';
  return formatDistanceToNow(toEncapsulatedDate(dateStr), { addSuffix: true, locale: localeId });
};
