import { beforeEach, describe, expect, it, vi } from 'vitest';

const nextJsHandlerMock = vi.fn();
const createAuthClientMock = vi.fn();
const inferAdditionalFieldsMock = vi.fn(() => 'infer-plugin');
const adminClientMock = vi.fn(() => 'admin-plugin');
const customSessionClientMock = vi.fn(() => 'custom-plugin');

vi.mock('better-auth/next-js', () => ({
	toNextJsHandler: nextJsHandlerMock,
}));

vi.mock('better-auth/react', () => ({
	createAuthClient: createAuthClientMock,
}));

vi.mock('better-auth/client/plugins', () => ({
	adminClient: adminClientMock,
	customSessionClient: customSessionClientMock,
	inferAdditionalFields: inferAdditionalFieldsMock,
}));

vi.mock('@/core/auth', () => ({
	betterAuthServer: { __brand: 'server' },
}));

describe('Better Auth wiring', () => {
	beforeEach(() => {
		vi.resetModules();
		nextJsHandlerMock.mockReset();
		createAuthClientMock.mockReset();
		inferAdditionalFieldsMock.mockClear();
		adminClientMock.mockClear();
		customSessionClientMock.mockClear();
	});

	it('binds the catch-all auth route to Better Auth handlers', async () => {
		const get = vi.fn();
		const post = vi.fn();

		nextJsHandlerMock.mockReturnValue({ GET: get, POST: post });

		const route = await import('@/app/api/auth/[...all]/route');

		expect(nextJsHandlerMock).toHaveBeenCalledWith({ __brand: 'server' });
		expect(route.GET).toBe(get);
		expect(route.POST).toBe(post);
	});

	it('creates the auth client with inferred fields and custom session plugins', async () => {
		const useSession = vi.fn();
		const signInSocial = vi.fn();

		createAuthClientMock.mockReturnValue({
			signIn: { social: signInSocial },
			useSession,
		});

		const { authClient } = await import('@/core/auth-client');

		expect(inferAdditionalFieldsMock).toHaveBeenCalledTimes(1);
		expect(adminClientMock).toHaveBeenCalledTimes(1);
		expect(customSessionClientMock).toHaveBeenCalledTimes(1);
		expect(createAuthClientMock).toHaveBeenCalledWith({
			plugins: ['infer-plugin', 'admin-plugin', 'custom-plugin'],
		});
		expect(authClient.signIn.social).toBe(signInSocial);
		expect(authClient.useSession).toBe(useSession);
	});
});
