import { EuiTheme, EuiThemeService } from '@elemental-ui/core';
import { ClassloggerService } from 'qbm';
import { BehaviorSubject } from 'rxjs';
import { RETI_DARK_THEME, RETI_LIGHT_THEME } from './reti-colors';
import { EUI_DARK_THEME, RetiThemeService } from './reti-theme.service';

/** Lets MutationObserver callbacks and the scheduled scan run. */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 20));

describe('RetiThemeService', () => {
  let service: RetiThemeService;
  let testStyle: HTMLStyleElement;
  /** Theme chosen by the user in "User interface settings" (EuiThemeService switcher state). */
  let switcherState: BehaviorSubject<string>;
  const extraNodes: Element[] = [];
  const originalBodyClasses = Array.from(document.body.classList);

  function addStyle(css: string): HTMLStyleElement {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
    extraNodes.push(style);
    return style;
  }

  function firstRuleValue(style: HTMLStyleElement, property: string): string {
    return (style.sheet!.cssRules[0] as CSSStyleRule).style.getPropertyValue(property);
  }

  beforeEach(() => {
    const logger = jasmine.createSpyObj<ClassloggerService>('ClassloggerService', ['debug', 'error', 'info']);
    switcherState = new BehaviorSubject<string>(EuiTheme.LIGHT);
    const euiTheme = { getThemeSwitcherState: () => switcherState.asObservable() } as unknown as EuiThemeService;
    service = new RetiThemeService(document, logger, euiTheme);
    testStyle = addStyle('.ccc-test-link { color: #0a96d1; }');
  });

  afterEach(() => {
    service.stop();
    extraNodes.splice(0).forEach((node) => node.remove());
    document.body.className = originalBodyClasses.join(' ');
  });

  it('adds the eui dark class when the Reti dark theme becomes active', async () => {
    service.start();

    document.body.classList.add(RETI_DARK_THEME);
    await settle();

    expect(document.body.classList).toContain(EUI_DARK_THEME);
  });

  it('does not add the eui dark class for the Reti light theme', async () => {
    service.start();

    document.body.classList.add(RETI_LIGHT_THEME);
    await settle();

    expect(document.body.classList).not.toContain(EUI_DARK_THEME);
  });

  it('applies the theme that is already active when it starts', async () => {
    document.body.classList.add(RETI_DARK_THEME);

    service.start();
    await settle();

    expect(document.body.classList).toContain(EUI_DARK_THEME);
    // Not scoped to .eui-dark-theme: standard map also in dark mode.
    expect(firstRuleValue(testStyle, 'color')).toBe('rgb(235, 33, 46)');
  });

  it('recolors One Identity colors in the loaded stylesheets for a Reti theme', async () => {
    service.start();

    document.body.classList.add(RETI_LIGHT_THEME);
    await settle();

    expect(firstRuleValue(testStyle, 'color')).toBe('rgb(235, 33, 46)');
  });

  it('keeps the cascade: a recolored rule still loses to the later rule that overrode it', async () => {
    // Same case as "Forgot password?" on the login page: .imx-button (global, blue) loses to .mdc-button (later).
    addStyle('.ccc-imx-button { background-color: #0a96d1; }');
    addStyle('.ccc-mdc-button { background-color: transparent; }');
    const button = document.createElement('a');
    button.className = 'ccc-imx-button ccc-mdc-button';
    document.body.appendChild(button);
    extraNodes.push(button);
    service.start();

    document.body.classList.add(RETI_LIGHT_THEME);
    await settle();

    expect(getComputedStyle(button).backgroundColor).toBe('rgba(0, 0, 0, 0)');
  });

  it('recolors the styles added to head later, for example lazy component styles', async () => {
    service.start();
    document.body.classList.add(RETI_LIGHT_THEME);
    await settle();

    const lateStyle = addStyle('.ccc-test-late { background-color: #cbe8f2; }');
    await settle();

    expect(firstRuleValue(lateStyle, 'background-color')).toBe('rgb(223, 225, 227)');
  });

  it('recolors a stylesheet <link> added later, once it has loaded', async () => {
    service.start();
    document.body.classList.add(RETI_LIGHT_THEME);
    await settle();

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'data:text/css,.ccc-test-linked%7Bcolor:%23e36a00%7D';
    extraNodes.push(link);
    const loaded = new Promise((resolve) => link.addEventListener('load', resolve, { once: true }));
    document.head.appendChild(link);
    await loaded;
    await settle();

    expect((link.sheet!.cssRules[0] as CSSStyleRule).style.getPropertyValue('color')).toBe('rgb(180, 83, 9)');
  });

  it('recolors with the dark colors when switching from the light to the dark theme', async () => {
    const darkStyle = addStyle('.eui-dark-theme .ccc-test-card { background-color: #016b91; }');
    service.start();
    document.body.classList.add(RETI_LIGHT_THEME);
    await settle();

    document.body.classList.replace(RETI_LIGHT_THEME, RETI_DARK_THEME);
    await settle();

    expect(firstRuleValue(darkStyle, 'background-color')).toBe('rgb(46, 50, 54)');
  });

  it('restores the One Identity colors when a non-Reti theme becomes active', async () => {
    service.start();
    document.body.classList.add(RETI_LIGHT_THEME);
    await settle();

    document.body.classList.remove(RETI_LIGHT_THEME);
    document.body.classList.add('eui-light-theme');
    await settle();

    expect(firstRuleValue(testStyle, 'color')).toBe('rgb(10, 150, 209)');
  });

  it('stops watching and restores the colors after stop()', async () => {
    service.start();
    document.body.classList.add(RETI_LIGHT_THEME);
    await settle();

    service.stop();
    document.body.classList.replace(RETI_LIGHT_THEME, RETI_DARK_THEME);
    await settle();

    expect(document.body.classList).not.toContain(EUI_DARK_THEME);
    expect(firstRuleValue(testStyle, 'color')).toBe('rgb(10, 150, 209)');
  });

  describe('device theme (Auto)', () => {
    let previousTheme: string | undefined;

    /** Same body changes as EuiThemeService.updateTheme: clearClasses (all eui themes + previous), then addClass. */
    function euiApplies(theme: string): void {
      const classes = document.body.classList;
      Object.values(EuiTheme).forEach((name) => classes.remove(name));
      if (previousTheme) {
        classes.remove(previousTheme);
      }
      classes.add(theme);
      previousTheme = theme;
    }

    function themeClasses(): string[] {
      return Array.from(document.body.classList)
        .filter((name) => name.endsWith('-theme'))
        .sort();
    }

    beforeEach(() => {
      previousTheme = undefined;
    });

    it('uses Reti chiaro when the device is light', async () => {
      switcherState.next(EuiTheme.AUTO);
      euiApplies(EuiTheme.LIGHT);

      service.start();
      await settle();

      expect(themeClasses()).toEqual([RETI_LIGHT_THEME]);
      expect(firstRuleValue(testStyle, 'color')).toBe('rgb(235, 33, 46)');
    });

    it('stops touching the body class once the theme is applied (no observer loop)', async () => {
      switcherState.next(EuiTheme.AUTO);
      euiApplies(EuiTheme.LIGHT);
      service.start();
      await settle();
      let mutations = 0;
      const counter = new MutationObserver((records) => (mutations += records.length));
      counter.observe(document.body, { attributes: true, attributeFilter: ['class'] });

      await settle();
      counter.disconnect();

      expect(mutations).toBe(0);
    });

    it('uses Reti scuro when the device is dark', async () => {
      switcherState.next(EuiTheme.AUTO);
      euiApplies(EuiTheme.DARK);

      service.start();
      await settle();

      expect(themeClasses()).toEqual([EuiTheme.DARK, RETI_DARK_THEME].sort());
    });

    it('follows the device when it switches from dark to light and back', async () => {
      switcherState.next(EuiTheme.AUTO);
      euiApplies(EuiTheme.DARK);
      service.start();
      await settle();

      euiApplies(EuiTheme.LIGHT);
      await settle();
      expect(themeClasses()).toEqual([RETI_LIGHT_THEME]);

      euiApplies(EuiTheme.DARK);
      await settle();
      expect(themeClasses()).toEqual([EuiTheme.DARK, RETI_DARK_THEME].sort());
    });

    it('removes its own classes when the user leaves Auto for another theme', async () => {
      switcherState.next(EuiTheme.AUTO);
      euiApplies(EuiTheme.LIGHT);
      service.start();
      await settle();

      switcherState.next(RETI_DARK_THEME);
      euiApplies(RETI_DARK_THEME);
      await settle();

      expect(themeClasses()).toEqual([EuiTheme.DARK, RETI_DARK_THEME].sort());
    });

    it('leaves the standard themes alone when the user chose them explicitly', async () => {
      switcherState.next(EuiTheme.LIGHT);
      euiApplies(EuiTheme.LIGHT);

      service.start();
      await settle();

      expect(themeClasses()).toEqual([EuiTheme.LIGHT]);
    });
  });
});
