export type ActionResult<T> =
	| { success: true; data: T }
	| { success: false; error: string };

export function extractError(error: unknown): string {
	if (error instanceof Error) return error.message;
	return 'An unexpected error occurred';
}
