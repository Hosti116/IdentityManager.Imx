import { ExtService } from 'qbm';
import { FakedataTileComponent } from './fakedata-tile/fakedata-tile.component';
import { DASHBOARD_SMALL_TILES, InitService } from './init.service';
import { RetiThemeService } from './theme/reti-theme.service';

describe('InitService', () => {
  let register: jasmine.Spy;
  let retiTheme: jasmine.SpyObj<RetiThemeService>;
  let service: InitService;

  beforeEach(() => {
    register = jasmine.createSpy('register');
    retiTheme = jasmine.createSpyObj<RetiThemeService>('RetiThemeService', ['start']);
    service = new InitService({ register } as unknown as ExtService, retiTheme);
  });

  it('registers the Fakedata tile among the small dashboard tiles', () => {
    // Act
    service.onInit();

    // Assert
    expect(register).toHaveBeenCalledOnceWith(DASHBOARD_SMALL_TILES, { instance: FakedataTileComponent });
  });

  it('starts the runtime support of the Reti themes', () => {
    // Act
    service.onInit();

    // Assert
    expect(retiTheme.start).toHaveBeenCalledTimes(1);
  });
});
