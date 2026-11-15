import { ExtService } from 'qbm';
import { FakedataTileComponent } from './fakedata-tile/fakedata-tile.component';
import { DASHBOARD_SMALL_TILES, InitService } from './init.service';
import { BrandThemeService } from './brand-theme/brand-theme.service';

describe('InitService', () => {
  let register: jasmine.Spy;
  let brandTheme: jasmine.SpyObj<BrandThemeService>;
  let service: InitService;

  beforeEach(() => {
    register = jasmine.createSpy('register');
    brandTheme = jasmine.createSpyObj<BrandThemeService>('BrandThemeService', ['start']);
    service = new InitService({ register } as unknown as ExtService, brandTheme);
  });

  it('registers the Fakedata tile among the small dashboard tiles', () => {
    // Act
    service.onInit();

    // Assert
    expect(register).toHaveBeenCalledOnceWith(DASHBOARD_SMALL_TILES, { instance: FakedataTileComponent });
  });

  it('starts the runtime support of the brand themes', () => {
    // Act
    service.onInit();

    // Assert
    expect(brandTheme.start).toHaveBeenCalledTimes(1);
  });
});
