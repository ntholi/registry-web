'use server';

import PermissionPresetRepository from '@auth/permission-presets/_server/repository';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { z } from 'zod/v4';
import { auth } from '@/core/auth';
import { DASHBOARD_ROLES, type DashboardRole } from '@/core/auth/permissions';

const COOKIE_NAME = 'admin-view-as';

const viewAsSchema = z.object({
	role: z.enum(DASHBOARD_ROLES),
	presetId: z.string().nullable(),
});

export type ViewAsData = z.infer<typeof viewAsSchema>;

const presetRepo = new PermissionPresetRepository();

async function assertAdmin() {
	const session = await auth();
	if (session?.user?.role !== 'admin' && !session?.viewingAs) {
		throw new Error('Forbidden');
	}
}

export async function setViewAs(role: DashboardRole, presetId: string | null) {
	await assertAdmin();
	const data = viewAsSchema.parse({ role, presetId });
	const jar = await cookies();
	jar.set(COOKIE_NAME, JSON.stringify(data), {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		path: '/',
		maxAge: 60 * 60 * 24,
	});
	revalidatePath('/dashboard', 'layout');
}

export async function clearViewAs() {
	const jar = await cookies();
	jar.delete(COOKIE_NAME);
	revalidatePath('/dashboard', 'layout');
}

export async function getPresetsForRole(role: DashboardRole) {
	await assertAdmin();
	return presetRepo.findByRole(role);
}
