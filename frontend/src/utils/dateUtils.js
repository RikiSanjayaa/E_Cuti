import { format, formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

/**
 * Helper to ensure a date string is treated as UTC/ISO8601
 * If the string lacks timezone info, we assume it's UTC and append 'Z'
 */
const toEncapsulatedDate = (dateStr) => {
  if (!dateStr) return new Date();

  let d = dateStr;
  if (typeof d === 'string' && !d.endsWith('Z') && !d.includes('+')) {
    d += 'Z';
  }
  return new Date(d);
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
