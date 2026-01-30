import { format, formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';


const toEncapsulatedDate = (dateStr) => {
  if (!dateStr) return new Date();
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
