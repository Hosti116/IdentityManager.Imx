import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ClassloggerService } from 'qbm';
import { DashboardService, QerPermissionsService } from 'qer';
import { FakedataIdentitiesService } from './fakedata-identities.service';

export const IDENTITIES_DATA_EXPLORER_ROUTE = ['admin', 'dataexplorer', 'identities'];

@Component({
  selector: 'ccc-fakedata-tile',
  templateUrl: './fakedata-tile.component.html',
  standalone: false,
})
export class FakedataTileComponent implements OnInit {
  /** Undefined until loaded, or when the user may not see identities / loading failed: the tile is hidden. */
  public fakedataCount: number | undefined;

  constructor(
    private readonly fakedataIdentities: FakedataIdentitiesService,
    private readonly permissions: QerPermissionsService,
    private readonly dashboardService: DashboardService,
    private readonly router: Router,
    private readonly logger: ClassloggerService,
  ) {}

  public async ngOnInit(): Promise<void> {
    const busy = this.dashboardService.beginBusy();
    try {
      if (await this.permissions.isPersonAdmin()) {
        this.fakedataCount = await this.fakedataIdentities.count();
      }
    } catch (error) {
      this.logger.error(this, 'Could not count the demo (Fakedata) identities', error);
    } finally {
      busy.endBusy();
    }
  }

  public openIdentities(): Promise<boolean> {
    return this.router.navigate(IDENTITIES_DATA_EXPLORER_ROUTE);
  }
}
