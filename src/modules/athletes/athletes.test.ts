// ─── athletes.test.ts ─────────────────────────────────────────────────────────
// Unit tests for the athletes SERVICE layer.
// We mock the DB entirely — no real Postgres needed to run these.
//
// To run:  npx jest src/modules/athletes/athletes.test.ts
// (add jest + ts-jest to devDependencies when you're ready to run tests)

import { AppError } from '../../middleware/errorHandler';

// ── Mock the entire db module ─────────────────────────────────────────────────
// Jest replaces the real Drizzle/pg pool with these mock functions.
// Each test can override returnValue to simulate different DB responses.

const mockSelect   = jest.fn();
const mockInsert   = jest.fn();
const mockUpdate   = jest.fn();

jest.mock('../../db', () => ({
  db: {
    select: () => ({ ...mockChain, select: mockSelect }),
    insert: () => ({ values: () => ({ returning: mockInsert }) }),
    update: () => ({ set: () => ({ where: mockUpdate }) }),
  },
}));

// Drizzle chains .from().where().limit().offset() — we need a chainable mock
const mockChain = {
  from:    () => mockChain,
  where:   () => mockChain,
  limit:   () => mockChain,
  offset:  () => mockChain,
  orderBy: () => mockChain,
  then:    (resolve: (v: unknown[]) => void) => resolve(mockSelect()),
};

// Re-import AFTER the mock is set up
import * as athleteService from './athletes.service';

// ─────────────────────────────────────────────────────────────────────────────
// listAthletes
// ─────────────────────────────────────────────────────────────────────────────

describe('listAthletes', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns paginated athletes with correct meta', async () => {
    const fakeAthletes = [
      {
        id: 'uuid-1',
        slug: 'lebron-james',
        firstName: 'Lebron',
        lastName: 'James',
        displayName: 'LeBron James',
        sport: 'Basketball',
        country: 'USA',
        healthCategories: ['cardiovascular'],
        profileImageUrl: null,
        isVerified: true,
        isFeatured: true,
      },
    ];

    // First call = data rows, second call = count
    mockSelect
      .mockReturnValueOnce(fakeAthletes)
      .mockReturnValueOnce([{ count: 1 }]);

    const result = await athleteService.listAthletes({
      limit: 20,
      offset: 0,
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].slug).toBe('lebron-james');
    expect(result.meta.total).toBe(1);
    expect(result.meta.hasMore).toBe(false);
  });

  it('sets hasMore = true when more rows exist beyond offset', async () => {
    const fakeAthletes = Array(20).fill({ id: 'x', slug: 'a', firstName: 'A', lastName: 'B', healthCategories: [] });

    mockSelect
      .mockReturnValueOnce(fakeAthletes)
      .mockReturnValueOnce([{ count: 50 }]);

    const result = await athleteService.listAthletes({ limit: 20, offset: 0 });

    expect(result.meta.hasMore).toBe(true);
    expect(result.meta.total).toBe(50);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getAthleteBySlug
// ─────────────────────────────────────────────────────────────────────────────

describe('getAthleteBySlug', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns athlete with scores when found', async () => {
    const fakeAthlete = {
      id: 'uuid-1',
      slug: 'serena-williams',
      firstName: 'Serena',
      lastName: 'Williams',
      displayName: 'Serena Williams',
      sport: 'Tennis',
      healthCategories: ['womens-health'],
      isVerified: true,
      isFeatured: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const fakeScore = {
      matchScore: '92.50',
      reputationRiskScore: '12.00',
      pharmaComplianceScore: '88.00',
      audienceTrustScore: '91.00',
      resonanceScore: '87.00',
      credibilityScore: '95.00',
      computedAt: new Date(),
    };

    // First call = athlete rows, second = score rows
    mockSelect
      .mockReturnValueOnce([fakeAthlete])
      .mockReturnValueOnce([fakeScore]);

    const result = await athleteService.getAthleteBySlug('serena-williams');

    expect(result.slug).toBe('serena-williams');
    expect(result.scores?.matchScore).toBe('92.50');
    expect(result.scores?.pharmaComplianceScore).toBe('88.00');
  });

  it('returns null scores when no scores exist yet', async () => {
    const fakeAthlete = {
      id: 'uuid-2', slug: 'new-athlete', firstName: 'New', lastName: 'Athlete',
      healthCategories: [], createdAt: new Date(), updatedAt: new Date(),
    };

    mockSelect
      .mockReturnValueOnce([fakeAthlete])
      .mockReturnValueOnce([]); // no scores

    const result = await athleteService.getAthleteBySlug('new-athlete');

    expect(result.scores).toBeNull();
  });

  it('throws 404 AppError when athlete is not found', async () => {
    mockSelect
      .mockReturnValueOnce([])  // athlete not found
      .mockReturnValueOnce([]); // scores (won't be reached)

    await expect(
      athleteService.getAthleteBySlug('does-not-exist')
    ).rejects.toThrow(AppError);

    await expect(
      athleteService.getAthleteBySlug('does-not-exist')
    ).rejects.toMatchObject({ statusCode: 404, code: 'ATHLETE_NOT_FOUND' });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// createAthlete
// ─────────────────────────────────────────────────────────────────────────────

describe('createAthlete', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates athlete and returns profile', async () => {
    // No existing slug conflict
    mockSelect.mockReturnValueOnce([]);

    const created = {
      id: 'new-uuid',
      slug: 'diana-taurasi',
      firstName: 'Diana',
      lastName: 'Taurasi',
      displayName: null,
      healthCategories: ['womens-health'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockInsert.mockReturnValueOnce([created]);

    const result = await athleteService.createAthlete({
      firstName: 'Diana',
      lastName: 'Taurasi',
      healthCategories: ['womens-health'],
    });

    expect(result.slug).toBe('diana-taurasi');
    expect(result.scores).toBeNull();
  });

  it('throws 409 when slug already exists', async () => {
    // Simulate existing athlete with same slug
    mockSelect.mockReturnValueOnce([{ id: 'existing-uuid' }]);

    await expect(
      athleteService.createAthlete({ firstName: 'Diana', lastName: 'Taurasi' })
    ).rejects.toMatchObject({ statusCode: 409, code: 'SLUG_CONFLICT' });
  });
});