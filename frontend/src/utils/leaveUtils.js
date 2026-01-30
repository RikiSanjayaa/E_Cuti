// Preset color definitions
const COLOR_PRESETS = {
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800/50', bar: 'bg-blue-500 dark:bg-blue-400', track: 'bg-blue-100 dark:bg-blue-900/40' },
  red: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-800/50', bar: 'bg-red-500 dark:bg-red-400', track: 'bg-red-100 dark:bg-red-900/40' },
  green: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-800/50', bar: 'bg-green-500 dark:bg-green-400', track: 'bg-green-100 dark:bg-green-900/40' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800/50', bar: 'bg-orange-500 dark:bg-orange-400', track: 'bg-orange-100 dark:bg-orange-900/40' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800/50', bar: 'bg-purple-500 dark:bg-purple-400', track: 'bg-purple-100 dark:bg-purple-900/40' },
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800/50', bar: 'bg-indigo-500 dark:bg-indigo-400', track: 'bg-indigo-100 dark:bg-indigo-900/40' },
  teal: { bg: 'bg-teal-50 dark:bg-teal-900/20', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800/50', bar: 'bg-teal-500 dark:bg-teal-400', track: 'bg-teal-100 dark:bg-teal-900/40' },
  pink: { bg: 'bg-pink-50 dark:bg-pink-900/20', text: 'text-pink-700 dark:text-pink-300', border: 'border-pink-200 dark:border-pink-800/50', bar: 'bg-pink-500 dark:bg-pink-400', track: 'bg-pink-100 dark:bg-pink-900/40' },
  cyan: { bg: 'bg-cyan-50 dark:bg-cyan-900/20', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-200 dark:border-cyan-800/50', bar: 'bg-cyan-500 dark:bg-cyan-400', track: 'bg-cyan-100 dark:bg-cyan-900/40' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800/50', bar: 'bg-amber-500 dark:bg-amber-400', track: 'bg-amber-100 dark:bg-amber-900/40' },
  lime: { bg: 'bg-lime-50 dark:bg-lime-900/20', text: 'text-lime-700 dark:text-lime-300', border: 'border-lime-200 dark:border-lime-800/50', bar: 'bg-lime-500 dark:bg-lime-400', track: 'bg-lime-100 dark:bg-lime-900/40' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800/50', bar: 'bg-emerald-500 dark:bg-emerald-400', track: 'bg-emerald-100 dark:bg-emerald-900/40' },
  rose: { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800/50', bar: 'bg-rose-500 dark:bg-rose-400', track: 'bg-rose-100 dark:bg-rose-900/40' },
  slate: { bg: 'bg-slate-50 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-700', bar: 'bg-slate-500 dark:bg-slate-400', track: 'bg-slate-100 dark:bg-slate-900/40' },
  gray: { bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-700', bar: 'bg-gray-500 dark:bg-gray-400', track: 'bg-gray-100 dark:bg-gray-900/40' },
};

// List of available preset colors for UI selection
export const PRESET_COLORS = [
  { value: 'blue', label: 'Biru', sample: 'bg-blue-500' },
  { value: 'red', label: 'Merah', sample: 'bg-red-500' },
  { value: 'green', label: 'Hijau', sample: 'bg-green-500' },
  { value: 'orange', label: 'Oranye', sample: 'bg-orange-500' },
  { value: 'purple', label: 'Ungu', sample: 'bg-purple-500' },
  { value: 'indigo', label: 'Indigo', sample: 'bg-indigo-500' },
  { value: 'teal', label: 'Teal', sample: 'bg-teal-500' },
  { value: 'pink', label: 'Pink', sample: 'bg-pink-500' },
  { value: 'cyan', label: 'Cyan', sample: 'bg-cyan-500' },
  { value: 'amber', label: 'Kuning', sample: 'bg-amber-500' },
  { value: 'lime', label: 'Lime', sample: 'bg-lime-500' },
  { value: 'emerald', label: 'Emerald', sample: 'bg-emerald-500' },
  { value: 'rose', label: 'Rose', sample: 'bg-rose-500' },
  { value: 'slate', label: 'Slate', sample: 'bg-slate-500' },
  { value: 'gray', label: 'Abu-abu', sample: 'bg-gray-500' },
];

// Get color palette from preset name (from database)
const getColorPaletteFromPreset = (colorPreset) => {
  return COLOR_PRESETS[colorPreset] || COLOR_PRESETS.gray;
};

/**
 * Get color class string for leave type.
 * @param {string|object} leaveTypeOrColor - Either a color preset string, leave type name, or leave_type object with color property
 * @param {Array} leaveTypes - Optional array of leave type objects to look up color by name
 * @returns {string} Tailwind class string for bg, text, and border
 */
export const getLeaveColorClass = (leaveTypeOrColor, leaveTypes = []) => {
  let colorPreset = 'gray';

  if (typeof leaveTypeOrColor === 'object' && leaveTypeOrColor !== null) {
    // It's a leave_type object
    colorPreset = leaveTypeOrColor.color || 'gray';
  } else if (typeof leaveTypeOrColor === 'string') {
    // Check if it's a preset color name directly
    if (COLOR_PRESETS[leaveTypeOrColor]) {
      colorPreset = leaveTypeOrColor;
    } else if (leaveTypes.length > 0) {
      // Try to find the leave type by name in the provided array
      const foundType = leaveTypes.find(lt => lt.name === leaveTypeOrColor);
      if (foundType && foundType.color) {
        colorPreset = foundType.color;
      }
    }
  }

  const p = getColorPaletteFromPreset(colorPreset);
  return `${p.bg} ${p.text} ${p.border}`;
};

/**
 * Get full color palette object for leave type.
 * @param {string|object} leaveTypeOrColor - Either a color preset string, leave type name, or leave_type object with color property
 * @param {Array} leaveTypes - Optional array of leave type objects to look up color by name
 * @returns {object} Object with bg, text, border, bar, track properties
 */
export const getLeaveColors = (leaveTypeOrColor, leaveTypes = []) => {
  let colorPreset = 'gray';

  if (typeof leaveTypeOrColor === 'object' && leaveTypeOrColor !== null) {
    colorPreset = leaveTypeOrColor.color || 'gray';
  } else if (typeof leaveTypeOrColor === 'string') {
    if (COLOR_PRESETS[leaveTypeOrColor]) {
      colorPreset = leaveTypeOrColor;
    } else if (leaveTypes.length > 0) {
      const foundType = leaveTypes.find(lt => lt.name === leaveTypeOrColor);
      if (foundType && foundType.color) {
        colorPreset = foundType.color;
      }
    }
  }

  return getColorPaletteFromPreset(colorPreset);
};
