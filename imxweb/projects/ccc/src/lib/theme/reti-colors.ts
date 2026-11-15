/**
 * CCC: color table of the Reti Web Portal themes.
 *
 * Many upstream styles (ElementalUI components, shared/scss, project scss) use the fixed One Identity
 * palette ($color-blue-*, $color-orange-*) instead of the theme palette. RetiThemeService replaces those
 * colors at runtime with the Reti ones. Keep in sync with custom-theme/reti/_reti-palette.scss.
 */

/** Body classes of the Reti themes (Class in imx-theme-config.json). */
export const RETI_LIGHT_THEME = 'reti-light-theme';
export const RETI_DARK_THEME = 'reti-dark-theme';
export const RETI_THEMES: readonly string[] = [RETI_LIGHT_THEME, RETI_DARK_THEME];

/** Shades of the One Identity palette that are replaced. */
export type OiShade =
  | 'blue10'
  | 'blue15'
  | 'blue20'
  | 'blue40'
  | 'blue60'
  | 'blue80'
  | 'blue85'
  | 'blue90'
  | 'orange10'
  | 'orange15'
  | 'orange20'
  | 'orange40'
  | 'orange60'
  | 'orange80'
  | 'orange85'
  | 'orange90';

export type ColorMap = Readonly<Record<OiShade, string>>;

/** One Identity palette ($color-blue-*, $color-orange-* of @elemental-ui/core). */
export const ONE_IDENTITY_COLORS: ColorMap = {
  blue10: '#f2fcff',
  blue15: '#e1f4fa',
  blue20: '#cbe8f2',
  blue40: '#8acbe3',
  blue60: '#0a96d1',
  blue80: '#016b91',
  blue85: '#004e6b',
  blue90: '#00384d',
  orange10: '#fff9f2',
  orange15: '#fbefe2',
  orange20: '#f7e4d0',
  orange40: '#edbe8e',
  orange60: '#e36a00',
  orange80: '#a65300',
  orange85: '#7a3e00',
  orange90: '#592d00',
};

/**
 * Light UI (and every rule not scoped to .eui-dark-theme): interactive blue -> Reti red,
 * light blue tints -> neutral anthracite, orange -> amber (decision D6, 2026-11-15).
 */
export const RETI_LIGHT_MAP: ColorMap = {
  blue10: '#f2f3f4',
  blue15: '#f2f3f4',
  blue20: '#dfe1e3',
  blue40: '#c4c8cc',
  blue60: '#eb212e',
  blue80: '#c11723',
  blue85: '#a9131d',
  blue90: '#861016',
  orange10: '#fff5e6',
  orange15: '#fff5e6',
  orange20: '#ffe4bf',
  orange40: '#ffbd66',
  orange60: '#b45309',
  orange80: '#8c4007',
  orange85: '#773606',
  orange90: '#5c2a04',
};

/** Dark UI, primary fill (buttons, title bars, selections, badges): carries white text (7.3:1). Decision 2026-11-15. */
export const RETI_DARK_FILL = '#a4262c';
/** Text on RETI_DARK_FILL; replaces the dark text that One Identity pairs with its light blue-40 fill. */
export const RETI_ON_DARK_FILL = '#ffffff';
/**
 * Dark UI, the single red for text, links, icons and indicators (decision 2026-11-15: one red everywhere).
 * Red hue 200: about 7:1 on the page (#1e1e1e) and 4.2:1 on cards and menu bars (#444647).
 * Same value as the primary of reti-dark.scss.
 */
const RETI_DARK_ACCENT = '#f69097';

/** Dark UI, text and icons of rules scoped to .eui-dark-theme. */
export const RETI_DARK_FOREGROUND_MAP: ColorMap = {
  ...RETI_LIGHT_MAP,
  blue10: '#3c4146',
  blue15: '#3c4146',
  blue20: '#4c5258',
  blue40: RETI_DARK_ACCENT,
  blue60: RETI_DARK_ACCENT,
  blue80: RETI_DARK_ACCENT,
  blue85: RETI_DARK_ACCENT,
  blue90: RETI_DARK_ACCENT,
  orange40: '#ffbd66',
  orange60: '#ffbd66',
};

/**
 * Dark UI, backgrounds and borders of rules scoped to .eui-dark-theme. Dark blues (80-90) are surfaces
 * -> anthracite; blue-40/60 are the primary fill -> RETI_DARK_FILL (its dark text becomes white, see
 * reti-css-remap).
 */
export const RETI_DARK_SURFACE_MAP: ColorMap = {
  ...RETI_DARK_FOREGROUND_MAP,
  blue40: RETI_DARK_FILL,
  blue60: RETI_DARK_FILL,
  blue80: '#2e3236',
  blue85: '#2e3236',
  blue90: '#1f2225',
};
