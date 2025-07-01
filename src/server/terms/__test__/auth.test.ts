import { terms, users } from '@/db/schema';
import {
  createTerm,
  deleteTerm,
  getCurrentTerm,
  updateTerm,
} from '@/server/terms/actions';
import { resetMockUser, setMockUser } from '@/test/mocks.auth';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/server/base/withAuth', () => {
  return vi.importActual('@/test/mock.withAuth');
});

type Term = typeof terms.$inferSelect;
type User = typeof users.$inferSelect;

describe('Term Permissions', () => {
  let createdTerm: Term | undefined;

  beforeEach(async () => {
    setMockUser({ role: 'admin' } as User);
    const newTerm = { name: 'Initial Term', isActive: true, semester: 1 };
    createdTerm = await createTerm(newTerm);
  });

  afterEach(() => {
    resetMockUser();
    vi.clearAllMocks();
  });

  describe('Admin Users', () => {
    it('should allow an admin to create a term', async () => {
      setMockUser({ role: 'admin' } as User);
      const newTerm = { name: 'Admin Test Term', isActive: true, semester: 2 };
      const term = await createTerm(newTerm);
      expect(term).toBeDefined();
      expect(term.name).toBe(newTerm.name);
    });

    it('should allow an admin to update a term', async () => {
      setMockUser({ role: 'admin' } as User);
      const termToUpdate = { id: createdTerm?.id, name: 'Updated Term Name' };
      // @ts-ignore
      const updatedTerm = await updateTerm(termToUpdate.id, termToUpdate);
      expect(updatedTerm).toBeDefined();
      expect(updatedTerm?.name).toBe(termToUpdate.name);
    });

    it('should allow an admin to delete a term', async () => {
      setMockUser({ role: 'admin' } as User);
      const termIdToDelete = createdTerm?.id;
      // @ts-ignore
      const deletedTerm = await deleteTerm(termIdToDelete);
      expect(deletedTerm).toBeDefined();
    });
  });

  describe('Non-Admin Users', () => {
    it('should not allow a non-admin to create a term', async () => {
      setMockUser({ role: 'user' } as User);
      const newTerm = {
        name: 'Non-Admin Test Term',
        isActive: true,
        semester: 3,
      };
      await expect(createTerm(newTerm)).rejects.toThrow('Forbidden');
    });

    it('should not allow a non-admin to update a term', async () => {
      setMockUser({ role: 'user' } as User);
      const termToUpdate = { id: createdTerm?.id, name: 'Updated Term Name' };
      // @ts-ignore
      await expect(updateTerm(termToUpdate.id, termToUpdate)).rejects.toThrow(
        'Forbidden',
      );
    });

    it('should not allow a non-admin to delete a term', async () => {
      setMockUser({ role: 'user' } as User);
      const termIdToDelete = createdTerm?.id;
      // @ts-ignore
      await expect(deleteTerm(termIdToDelete)).rejects.toThrow('Forbidden');
    });
  });

  describe('All Users', () => {
    it('should allow any user to get the active term', async () => {
      setMockUser({ role: 'user' } as User);
      const activeTerm = await getCurrentTerm();
      expect(activeTerm).toBeDefined();
    });
  });
});
