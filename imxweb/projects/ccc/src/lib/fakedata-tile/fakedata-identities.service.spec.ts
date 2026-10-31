import { QerApiService } from 'qer';
import { FAKEDATA_FILTER, FakedataIdentitiesService } from './fakedata-identities.service';

describe('FakedataIdentitiesService', () => {
  function createService(get: jasmine.Spy): FakedataIdentitiesService {
    const qerClient = { typedClient: { PortalAdminPerson: { Get: get } } } as unknown as QerApiService;
    return new FakedataIdentitiesService(qerClient);
  }

  it('returns the total count of identities marked as Fakedata', async () => {
    // Arrange
    const get = jasmine.createSpy('Get').and.resolveTo({ totalCount: 42, Data: [] });
    const service = createService(get);

    // Act
    const count = await service.count();

    // Assert
    expect(count).toBe(42);
  });

  it('asks only for the count, filtered on CustomProperty01 = Fakedata', async () => {
    // Arrange
    const get = jasmine.createSpy('Get').and.resolveTo({ totalCount: 0, Data: [] });
    const service = createService(get);

    // Act
    await service.count();

    // Assert
    expect(get).toHaveBeenCalledOnceWith({ PageSize: -1, filter: [FAKEDATA_FILTER] });
    expect(FAKEDATA_FILTER.ColumnName).toBe('CustomProperty01');
    expect(FAKEDATA_FILTER.Value1).toBe('Fakedata');
  });

  it('propagates API errors to the caller', async () => {
    // Arrange
    const get = jasmine.createSpy('Get').and.rejectWith(new Error('forbidden'));
    const service = createService(get);

    // Act / Assert
    await expectAsync(service.count()).toBeRejectedWithError('forbidden');
  });
});
