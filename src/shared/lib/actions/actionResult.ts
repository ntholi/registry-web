import {
	extractError,
	isNextNavigationError,
	UserFacingError,
} from './extractError';

export interface AppError {
	message: string;
	code?: string;
}

export type ActionResult<T> =
	| { success: true; data: T }
	| { success: false; error: AppError | string };

export type ActionData<T> = T extends (...args: infer _TArgs) => infer TResult
	? Awaited<TResult> extends ActionResult<infer TData>
		? TData
		: never
	: never;

export function success<T>(data: T): ActionResult<T> {
	return { success: true, data };
}

export function failure<T>(error: AppError | string): ActionResult<T> {
	return { success: false, error };
}

export function createAction<TArgs extends unknown[], TOutput>(
	fn: (...args: TArgs) => Promise<TOutput>
): (...args: TArgs) => Promise<ActionResult<TOutput>> {
	return async (...args) => {
		try {
			return success(await fn(...args));
		} catch (error) {
			if (isNextNavigationError(error)) {
				throw error;
			}

			const logMeta = {
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
			};

			if (error instanceof UserFacingError) {
				console.warn('[ServerAction] Action rejected', logMeta);
			} else {
				console.error('[ServerAction] Action failed', logMeta);
			}

			return failure<TOutput>(extractError(error));
		}
	};
}

export function unwrap<T>(result: ActionResult<T>): T {
	if (!result.success) {
		const msg = getActionErrorMessage(result.error);
		const code =
			typeof result.error === 'object' ? result.error.code : undefined;
		throw new UserFacingError(msg, code);
	}

	return result.data;
}

export function isActionResult(value: unknown): value is ActionResult<unknown> {
	return (
		typeof value === 'object' &&
		value !== null &&
		'success' in value &&
		typeof (value as { success: unknown }).success === 'boolean'
	);
}

export function getActionErrorMessage(error: AppError | string): string {
	return typeof error === 'string' ? error : error.message;
}
