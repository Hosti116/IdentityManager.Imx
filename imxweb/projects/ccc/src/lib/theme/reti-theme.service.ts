import { DOCUMENT, Inject, Injectable, OnDestroy } from '@angular/core';
import { EuiTheme, EuiThemeService } from '@elemental-ui/core';
import { ClassloggerService } from 'qbm';
import { Subscription } from 'rxjs';
import { applyPatches, collectPatches, DeclarationPatch, revertPatches } from './reti-css-remap';
import { RETI_DARK_THEME, RETI_LIGHT_THEME, RETI_THEMES } from './reti-colors';

/** Class of the ElementalUI dark theme: most dark-mode component rules are scoped to it. */
export const EUI_DARK_THEME = 'eui-dark-theme';

type ActiveTheme = 'none' | 'light' | 'dark';

// classList.add/remove rewrite the class attribute even when nothing changes (DOM "update steps"), and every
// rewrite is a new mutation for the body observer: change the classes only when needed, or the observer loops.
function addClass(classes: DOMTokenList, name: string): void {
  if (!classes.contains(name)) {
    classes.add(name);
  }
}

function removeClass(classes: DOMTokenList, name: string): void {
  if (classes.contains(name)) {
    classes.remove(name);
  }
}

/**
 * CCC: runtime support for the Reti themes (custom-theme/reti).
 *
 * 1. EuiThemeService puts exactly one class on <body>, so the custom class "reti-dark-theme" never
 *    gets the many component rules scoped to ".eui-dark-theme": this service adds that class too.
 *    ElementalUI removes it again on the next theme change (EuiThemeService.clearClasses).
 * 2. Upstream styles use the fixed One Identity palette: while a Reti theme is active this service
 *    recolors those declarations in place (reti-css-remap), in every stylesheet including the
 *    component styles that Angular adds later (watched in <head>), and restores them afterwards.
 * 3. "Device theme" (EuiTheme.AUTO) follows the device with the Reti themes instead of the standard ones
 *    (decision 2026-11-15): eui-light-theme is replaced by reti-light-theme, eui-dark-theme gets
 *    reti-dark-theme. EuiThemeService does not know these classes, so the service removes them itself when
 *    the device changes mode or the user picks another theme. Explicit choices are left alone.
 *
 * Driven by the body class (MutationObserver), not by EuiThemeService events, because the
 * service clears classes in its own subscribers after emitting the new theme.
 */
@Injectable({
  providedIn: 'root',
})
export class RetiThemeService implements OnDestroy {
  private bodyObserver: MutationObserver | undefined;
  private headObserver: MutationObserver | undefined;
  private scanTimer: ReturnType<typeof setTimeout> | undefined;
  private activeTheme: ActiveTheme = 'none';
  /** Applied patches per stylesheet; a sheet in this map has been recolored for the active theme. */
  private readonly patchesBySheet = new Map<CSSStyleSheet, readonly DeclarationPatch[]>();
  /** Theme chosen by the user (EuiThemeService switcher state), e.g. EuiTheme.AUTO. */
  private chosenTheme: string | undefined;
  private chosenThemeSubscription: Subscription | undefined;
  /** Reti class this service put on <body> for the device theme (Auto); EuiThemeService never removes it. */
  private deviceClass: string | undefined;

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly logger: ClassloggerService,
    private readonly euiTheme: EuiThemeService,
  ) {}

  /** Starts watching the theme class and the chosen theme; safe to call more than once. */
  public start(): void {
    if (this.bodyObserver) {
      return;
    }
    this.bodyObserver = new MutationObserver(() => this.safely(() => this.onBodyClassChanged()));
    this.bodyObserver.observe(this.document.body, { attributes: true, attributeFilter: ['class'] });
    this.chosenThemeSubscription = this.euiTheme.getThemeSwitcherState().subscribe((theme) => {
      this.chosenTheme = theme;
      this.safely(() => this.onBodyClassChanged());
    });
    this.safely(() => this.onBodyClassChanged());
  }

  /** Stops watching and restores the original colors. */
  public stop(): void {
    this.bodyObserver?.disconnect();
    this.bodyObserver = undefined;
    this.chosenThemeSubscription?.unsubscribe();
    this.chosenThemeSubscription = undefined;
    this.deactivate();
  }

  public ngOnDestroy(): void {
    this.stop();
  }

  /** Theme support is cosmetic: an error is logged and must never break the portal. */
  private safely(action: () => void): void {
    try {
      action();
    } catch (error) {
      this.logger.error(this, 'Reti theme: theme support failed', error);
    }
  }

  /** Auto: maps the class that EuiThemeService set for the device to the matching Reti theme. */
  private syncDeviceTheme(classes: DOMTokenList): void {
    if (this.chosenTheme !== EuiTheme.AUTO) {
      // Left Auto: drop the class added for the device, unless the user chose that very theme.
      if (this.deviceClass && this.deviceClass !== this.chosenTheme) {
        removeClass(classes, this.deviceClass);
      }
      this.deviceClass = undefined;
      return;
    }
    // EuiThemeService sets eui-light/eui-dark for the device; without them, our previous mapping is still valid.
    const target = classes.contains(EuiTheme.LIGHT)
      ? RETI_LIGHT_THEME
      : classes.contains(EuiTheme.DARK)
        ? RETI_DARK_THEME
        : this.deviceClass;
    if (!target) {
      return;
    }
    if (this.deviceClass && this.deviceClass !== target) {
      removeClass(classes, this.deviceClass);
    }
    addClass(classes, target);
    if (target === RETI_LIGHT_THEME) {
      removeClass(classes, EuiTheme.LIGHT);
    }
    this.deviceClass = target;
  }

  private onBodyClassChanged(): void {
    const classes = this.document.body.classList;
    this.syncDeviceTheme(classes);
    const theme: ActiveTheme = classes.contains(RETI_DARK_THEME)
      ? 'dark'
      : RETI_THEMES.some((name) => classes.contains(name))
        ? 'light'
        : 'none';

    if (theme === 'dark' && !classes.contains(EUI_DARK_THEME)) {
      classes.add(EUI_DARK_THEME);
    }
    if (theme === this.activeTheme) {
      return;
    }
    if (theme === 'none') {
      this.deactivate();
      return;
    }
    // Light and dark use different maps: start again from the original colors.
    this.revertAll();
    this.activeTheme = theme;
    this.watchHead();
    this.scan();
  }

  private watchHead(): void {
    if (this.headObserver) {
      return;
    }
    this.headObserver = new MutationObserver((records) => this.safely(() => this.onHeadChanged(records)));
    this.headObserver.observe(this.document.head, { childList: true });
  }

  private onHeadChanged(records: MutationRecord[]): void {
    const added = records
      .flatMap((record) => Array.from(record.addedNodes))
      .filter((node) => node instanceof HTMLStyleElement || node instanceof HTMLLinkElement);
    if (added.length === 0) {
      return;
    }
    // A <link> has no rules until it has loaded.
    added
      .filter((node): node is HTMLLinkElement => node instanceof HTMLLinkElement && !node.sheet)
      .forEach((link) => link.addEventListener('load', () => this.safely(() => this.scheduleScan()), { once: true }));
    this.scheduleScan();
  }

  /** Coalesces the bursts of component styles that Angular adds while rendering a page. */
  private scheduleScan(): void {
    if (this.scanTimer !== undefined) {
      return;
    }
    this.scanTimer = setTimeout(() => {
      this.scanTimer = undefined;
      if (this.activeTheme !== 'none') {
        this.safely(() => this.scan());
      }
    }, 0);
  }

  /** Recolors the stylesheets that have not been recolored yet. */
  private scan(): void {
    this.forgetDetachedSheets();
    const darkMode = this.activeTheme === 'dark';
    for (const sheet of Array.from(this.document.styleSheets)) {
      if (this.patchesBySheet.has(sheet)) {
        continue;
      }
      try {
        const patches = collectPatches(sheet.cssRules, darkMode);
        applyPatches(patches);
        this.patchesBySheet.set(sheet, patches);
      } catch (error) {
        // Cross-origin stylesheets do not expose their rules: they keep their colors.
        this.logger.debug(this, `Reti theme: rules of ${sheet.href ?? 'inline style'} not readable`, error);
      }
    }
  }

  /** Angular removes the styles of destroyed components; a re-inserted <style> gets a new sheet. */
  private forgetDetachedSheets(): void {
    Array.from(this.patchesBySheet.keys())
      .filter((sheet) => !sheet.ownerNode || !(sheet.ownerNode as Node).isConnected)
      .forEach((sheet) => this.patchesBySheet.delete(sheet));
  }

  private revertAll(): void {
    this.patchesBySheet.forEach((patches) => revertPatches(patches));
    this.patchesBySheet.clear();
  }

  private deactivate(): void {
    this.activeTheme = 'none';
    this.headObserver?.disconnect();
    this.headObserver = undefined;
    if (this.scanTimer !== undefined) {
      clearTimeout(this.scanTimer);
      this.scanTimer = undefined;
    }
    this.revertAll();
  }
}
