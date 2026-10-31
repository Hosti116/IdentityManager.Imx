import { Injectable } from '@angular/core';
import { CompareOperator, FilterData, FilterType } from '@imx-modules/imx-qbm-dbts';
import { QerApiService } from 'qer';

/** Value written to Person.CustomProperty01 by FillDbWithFakeData.ps1 to mark demo identities. */
export const FAKEDATA_MARKER = 'Fakedata';

export const FAKEDATA_FILTER: FilterData = {
  ColumnName: 'CustomProperty01',
  CompareOp: CompareOperator.Equal,
  Type: FilterType.Compare,
  Value1: FAKEDATA_MARKER,
};

@Injectable({
  providedIn: 'root',
})
export class FakedataIdentitiesService {
  constructor(private readonly qerClient: QerApiService) {}

  /** Counts demo identities without loading them (PageSize -1 returns only the total count). */
  public async count(): Promise<number> {
    const result = await this.qerClient.typedClient.PortalAdminPerson.Get({
      PageSize: -1,
      filter: [FAKEDATA_FILTER],
    });
    return result.totalCount;
  }
}
