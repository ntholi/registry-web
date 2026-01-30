export type ActionResult<T> =
	| { success: true; data: T }
	| { success: false; error: string };

export function success<T>(data: T): ActionResult<T> {
	return { success: true, data };
}

export function failure<T>(error: string): ActionResult<T> {
	return { success: false, error };
}
