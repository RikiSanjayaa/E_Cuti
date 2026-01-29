// Preset color definitions
const COLOR_PRESETS = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', bar: 'bg-blue-500', track: 'bg-blue-100' },
  red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', bar: 'bg-red-500', track: 'bg-red-100' },
  green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', bar: 'bg-green-500', track: 'bg-green-100' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', bar: 'bg-orange-500', track: 'bg-orange-100' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', bar: 'bg-purple-500', track: 'bg-purple-100' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', bar: 'bg-indigo-500', track: 'bg-indigo-100' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', bar: 'bg-teal-500', track: 'bg-teal-100' },
  pink: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', bar: 'bg-pink-500', track: 'bg-pink-100' },
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', bar: 'bg-cyan-500', track: 'bg-cyan-100' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', bar: 'bg-amber-500', track: 'bg-amber-100' },
  lime: { bg: 'bg-lime-50', text: 'text-lime-700', border: 'border-lime-200', bar: 'bg-lime-500', track: 'bg-lime-100' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', bar: 'bg-emerald-500', track: 'bg-emerald-100' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', bar: 'bg-rose-500', track: 'bg-rose-100' },
  slate: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', bar: 'bg-slate-500', track: 'bg-slate-100' },
  gray: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', bar: 'bg-gray-500', track: 'bg-gray-100' },
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
