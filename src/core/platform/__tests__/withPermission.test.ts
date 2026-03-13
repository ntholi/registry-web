import { beforeEach, describe, expect, it, vi } from 'vitest';

async function loadWithPermission(
	session: {
		user: { id: string; role: string };
		permissions?: { resource: string; action: string }[];
	} | null
) {
	vi.resetModules();

	vi.doMock('next/navigation', () => ({
		forbidden: vi.fn(() => {
			throw new Error('Forbidden');
		}),
		unauthorized: vi.fn(() => {
			throw new Error('Unauthorized');
		}),
	}));

	vi.doMock('@/core/auth', () => ({
		auth: vi.fn(async () => session),
	}));

	return await import('@/core/platform/withPermission');
}

describe('withPermission', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("allows 'all' without a session", async () => {
		const { withPermission } = await loadWithPermission(null);
		const handler = vi.fn(async () => 'ok');

		await expect(withPermission(handler, 'all')).resolves.toBe('ok');
		expect(handler).toHaveBeenCalledWith(null);
	});

	it("rejects 'auth' when the session is missing", async () => {
		const { withPermission } = await loadWithPermission(null);
		const handler = vi.fn(async () => 'ok');

		await expect(withPermission(handler, 'auth')).rejects.toThrow(
			'Unauthorized'
		);
		expect(handler).not.toHaveBeenCalled();
	});

	it("rejects 'dashboard' for non-dashboard roles", async () => {
		const { withPermission } = await loadWithPermission({
			user: { id: 'user-1', role: 'student' },
			permissions: [],
		});
		const handler = vi.fn(async () => 'ok');

		await expect(withPermission(handler, 'dashboard')).rejects.toThrow(
			'Forbidden'
		);
		expect(handler).not.toHaveBeenCalled();
	});

	it('lets admin bypass permission requirements', async () => {
		const { withPermission } = await loadWithPermission({
			user: { id: 'admin-1', role: 'admin' },
			permissions: [],
		});
		const handler = vi.fn(async () => 'admin-ok');

		await expect(
			withPermission(handler, { students: ['delete'] })
		).resolves.toBe('admin-ok');
		expect(handler).toHaveBeenCalledTimes(1);
	});

	it('checks embedded preset permissions for resource requirements', async () => {
		const { withPermission } = await loadWithPermission({
			user: { id: 'lecturer-1', role: 'academic' },
			permissions: [{ resource: 'students', action: 'read' }],
		});
		const allowed = vi.fn(async () => 'allowed');
		const denied = vi.fn(async () => 'denied');

		await expect(withPermission(allowed, { students: ['read'] })).resolves.toBe(
			'allowed'
		);
		await expect(
			withPermission(denied, { students: ['delete'] })
		).rejects.toThrow('Forbidden');
		expect(allowed).toHaveBeenCalledTimes(1);
		expect(denied).not.toHaveBeenCalled();
	});

	it('supports custom access checks', async () => {
		const { withPermission } = await loadWithPermission({
			user: { id: 'user-1', role: 'registry' },
			permissions: [],
		});
		const handler = vi.fn(async () => 'ok');
		const access = vi.fn(async () => true);

		await expect(withPermission(handler, access)).resolves.toBe('ok');
		expect(access).toHaveBeenCalledTimes(1);
		expect(handler).toHaveBeenCalledTimes(1);
	});
});
