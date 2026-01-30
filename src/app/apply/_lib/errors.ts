import type { ActionResult } from '@/shared/lib/utils/actionResult';

export type { ActionResult };

export function extractError(error: unknown): string {
	if (error instanceof Error) return error.message;
	return 'An unexpected error occurred';
}
