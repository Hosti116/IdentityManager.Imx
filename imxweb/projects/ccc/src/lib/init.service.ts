import { Injectable } from '@angular/core';
import { ExtService } from 'qbm';
import { FakedataTileComponent } from './fakedata-tile/fakedata-tile.component';
import { BrandThemeService } from './brand-theme/brand-theme.service';

/** Extension point rendered by qer's StartComponent (wport/start/start.component.html). */
export const DASHBOARD_SMALL_TILES = 'Dashboard-SmallTiles';

@Injectable({
  providedIn: 'root',
})
export class InitService {
  constructor(
    private readonly extService: ExtService,
    private readonly brandTheme: BrandThemeService,
  ) {}

  public onInit(): void {
    this.extService.register(DASHBOARD_SMALL_TILES, {
      instance: FakedataTileComponent,
    });
    this.brandTheme.start();
  }
}
