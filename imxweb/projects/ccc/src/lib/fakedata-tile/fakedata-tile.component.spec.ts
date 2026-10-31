import { Router } from '@angular/router';
import { ClassloggerService } from 'qbm';
import { DashboardService, QerPermissionsService } from 'qer';
import { FakedataIdentitiesService } from './fakedata-identities.service';
import { FakedataTileComponent, IDENTITIES_DATA_EXPLORER_ROUTE } from './fakedata-tile.component';

describe('FakedataTileComponent', () => {
  let count: jasmine.Spy;
  let isPersonAdmin: jasmine.Spy;
  let endBusy: jasmine.Spy;
  let navigate: jasmine.Spy;
  let logError: jasmine.Spy;

  function createComponent(): FakedataTileComponent {
    return new FakedataTileComponent(
      { count } as unknown as FakedataIdentitiesService,
      { isPersonAdmin } as unknown as QerPermissionsService,
      { beginBusy: () => ({ endBusy }) } as unknown as DashboardService,
      { navigate } as unknown as Router,
      { error: logError } as unknown as ClassloggerService,
    );
  }

  beforeEach(() => {
    count = jasmine.createSpy('count').and.resolveTo(7);
    isPersonAdmin = jasmine.createSpy('isPersonAdmin').and.resolveTo(true);
    endBusy = jasmine.createSpy('endBusy');
    navigate = jasmine.createSpy('navigate').and.resolveTo(true);
    logError = jasmine.createSpy('error');
  });

  it('shows the Fakedata count to identity administrators', async () => {
    // Arrange
    const component = createComponent();

    // Act
    await component.ngOnInit();

    // Assert
    expect(component.fakedataCount).toBe(7);
    expect(endBusy).toHaveBeenCalledTimes(1);
  });

  it('stays hidden and does not query the API for users who are not identity administrators', async () => {
    // Arrange
    isPersonAdmin.and.resolveTo(false);
    const component = createComponent();

    // Act
    await component.ngOnInit();

    // Assert
    expect(component.fakedataCount).toBeUndefined();
    expect(count).not.toHaveBeenCalled();
    expect(endBusy).toHaveBeenCalledTimes(1);
  });

  it('stays hidden, logs the error and ends the busy state when the count fails', async () => {
    // Arrange
    count.and.rejectWith(new Error('filter not allowed'));
    const component = createComponent();

    // Act
    await component.ngOnInit();

    // Assert
    expect(component.fakedataCount).toBeUndefined();
    expect(logError).toHaveBeenCalledTimes(1);
    expect(endBusy).toHaveBeenCalledTimes(1);
  });

  it('opens the identities view of the data explorer', async () => {
    // Arrange
    const component = createComponent();

    // Act
    await component.openIdentities();

    // Assert
    expect(navigate).toHaveBeenCalledOnceWith(IDENTITIES_DATA_EXPLORER_ROUTE);
  });
});
