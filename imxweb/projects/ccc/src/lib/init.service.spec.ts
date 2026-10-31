import { ExtService } from 'qbm';
import { FakedataTileComponent } from './fakedata-tile/fakedata-tile.component';
import { DASHBOARD_SMALL_TILES, InitService } from './init.service';

describe('InitService', () => {
  it('registers the Fakedata tile among the small dashboard tiles', () => {
    // Arrange
    const register = jasmine.createSpy('register');
    const service = new InitService({ register } as unknown as ExtService);

    // Act
    service.onInit();

    // Assert
    expect(register).toHaveBeenCalledOnceWith(DASHBOARD_SMALL_TILES, { instance: FakedataTileComponent });
  });
});
