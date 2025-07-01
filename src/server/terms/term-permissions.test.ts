import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import {
  createTerm,
  updateTerm,
  deleteTerm,
  getCurrentTerm,
} from '@/server/terms/actions';
import { setMockUser, resetMockUser, getMockUser } from '@/test/mocks.auth';
import { users, terms } from '@/db/schema';

type Term = typeof terms.$inferInsert;
type User = typeof users.$inferInsert;

vi.mock('@/server/base/withAuth', () => ({
  default: async (fn: Function, roles: string[]) => {
    const user = getMockUser();
    if (roles.includes('all')) {
      return fn();
    }
    if (roles.length === 0 && user?.role === 'admin') {
      return fn();
    }
    if (user?.role && roles.includes(user.role)) {
      return fn();
    }
    if (user?.role === 'admin') {
      return fn();
    }
    throw new Error('Unauthorized');
  },
}));

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
      await expect(createTerm(newTerm)).rejects.toThrow('Unauthorized');
    });

    it('should not allow a non-admin to update a term', async () => {
      setMockUser({ role: 'user' } as User);
      const termToUpdate = { id: createdTerm?.id, name: 'Updated Term Name' };
      // @ts-ignore
      await expect(updateTerm(termToUpdate.id, termToUpdate)).rejects.toThrow(
        'Unauthorized',
      );
    });

    it('should not allow a non-admin to delete a term', async () => {
      setMockUser({ role: 'user' } as User);
      const termIdToDelete = createdTerm?.id;
      // @ts-ignore
      await expect(deleteTerm(termIdToDelete)).rejects.toThrow('Unauthorized');
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
