import { describe, expect, it } from 'vitest';
import {
	type AppError,
	createAction,
	failure,
	getActionErrorMessage,
	unwrap,
} from '../actionResult';
import { UserFacingError } from '../extractError';

const err: AppError = {
	message: 'Readable failure',
	code: 'READABLE_FAILURE',
};

describe('actionResult', () => {
	it('reads messages from AppError objects', () => {
		expect(getActionErrorMessage(err)).toBe('Readable failure');
	});

	it('unwrap preserves AppError metadata in UserFacingError', () => {
		let caught: UserFacingError | null = null;

		try {
			unwrap(failure<void>(err));
		} catch (error) {
			if (error instanceof UserFacingError) {
				caught = error;
			}
		}

		expect(caught).toBeInstanceOf(UserFacingError);
		expect(caught?.message).toBe('Readable failure');
		expect(caught?.code).toBe('READABLE_FAILURE');
	});

	it('createAction always returns AppError failures', async () => {
		const action = createAction(async () => {
			throw new UserFacingError(err.message, err.code);
		});

		await expect(action()).resolves.toEqual({
			success: false,
			error: err,
		});
	});
});
