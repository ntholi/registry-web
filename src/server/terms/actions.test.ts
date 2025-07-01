import { describe, it, expect, beforeEach } from 'vitest';
import { termsService } from './service';
import { terms } from '@/db/schema';
import { setMockUser } from '@/test/mocks.auth';

type Term = typeof terms.$inferInsert;

describe('Terms Service', () => {
  beforeEach(() => {
    setMockUser({ role: 'admin' });
  });

  it('should create a new term', async () => {
    const termData: Term = {
      name: 'Test Term',
      semester: 1,
    };

    const createdTerm = await termsService.create(termData);

    expect(createdTerm).toBeDefined();
    expect(createdTerm.name).toBe('Test Term');
    expect(createdTerm.semester).toBe(1);
    expect(createdTerm.id).toBeDefined();
    expect(createdTerm.isActive).toBe(false);
    expect(createdTerm.createdAt).toBeDefined();
  });

  it('should get a term by id', async () => {
    const termData: Term = {
      name: 'Test Term for Get',
      semester: 2,
    };

    const createdTerm = await termsService.create(termData);

    const term = await termsService.get(createdTerm.id);

    expect(term).toBeDefined();
    expect(term?.id).toBe(createdTerm.id);
    expect(term?.name).toBe('Test Term for Get');
    expect(term?.semester).toBe(2);
  });

  it('should return undefined for non-existent term', async () => {
    const term = await termsService.get(999);

    expect(term).toBeUndefined();
  });

  it('should create multiple terms and retrieve them', async () => {
    const term1 = await termsService.create({
      name: 'Term 1',
      semester: 1,
    });

    const term2 = await termsService.create({
      name: 'Term 2',
      semester: 2,
    });

    const retrievedTerm1 = await termsService.get(term1.id);
    const retrievedTerm2 = await termsService.get(term2.id);

    expect(retrievedTerm1?.name).toBe('Term 1');
    expect(retrievedTerm2?.name).toBe('Term 2');
    expect(retrievedTerm1?.id).not.toBe(retrievedTerm2?.id);
  });

  it('should handle unique constraint on term names', async () => {
    await termsService.create({
      name: 'Unique Term',
      semester: 1,
    });

    await expect(
      termsService.create({
        name: 'Unique Term',
        semester: 2,
      }),
    ).rejects.toThrow();
  });

  it('should set active term correctly', async () => {
    const activeTerm = await termsService.create({
      name: 'Active Term',
      semester: 1,
      isActive: true,
    });

    expect(activeTerm.isActive).toBe(true);

    const newActiveTerm = await termsService.create({
      name: 'New Active Term',
      semester: 2,
      isActive: true,
    });

    expect(newActiveTerm.isActive).toBe(true);

    const firstTerm = await termsService.get(activeTerm.id);
    expect(firstTerm?.isActive).toBe(false);
  });
});
