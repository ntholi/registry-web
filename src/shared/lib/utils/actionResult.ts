import { createServiceLogger } from '@/core/platform/logger';
import {
	extractError,
	isNextNavigationError,
	UserFacingError,
} from './extractError';

const actionLogger = createServiceLogger('ServerAction');

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

			actionLogger.error('Action failed', {
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
			});

			return failure<TOutput>(extractError(error));
		}
	};
}

export function unwrap<T>(result: ActionResult<T>): T {
	if (!result.success) {
		throw new UserFacingError(getActionErrorMessage(result.error));
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
