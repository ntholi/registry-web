import type { AppError } from './actionResult';

export class UserFacingError extends Error {
	constructor(
		message: string,
		public code?: string
	) {
		super(message);
		this.name = 'UserFacingError';
	}
}

interface PgError extends Error {
	code: string;
	severity: string;
	detail?: string;
}

interface MoodleLikeError extends Error {
	exception: string;
	errorcode?: string;
}

export function isNextNavigationError(error: unknown): boolean {
	return (
		error instanceof Error &&
		'digest' in error &&
		typeof (error as Error & { digest: string }).digest === 'string' &&
		(error as Error & { digest: string }).digest.startsWith('NEXT_')
	);
}

function isPostgresError(error: unknown): error is PgError {
	return (
		error instanceof Error &&
		'code' in error &&
		'severity' in error &&
		typeof (error as PgError).code === 'string' &&
		typeof (error as PgError).severity === 'string'
	);
}

function isMoodleError(error: unknown): error is MoodleLikeError {
	return (
		error instanceof Error &&
		'exception' in error &&
		typeof (error as MoodleLikeError).exception === 'string' &&
		(!('errorcode' in error) ||
			typeof (error as MoodleLikeError).errorcode === 'string' ||
			typeof (error as MoodleLikeError).errorcode === 'undefined')
	);
}

function getErrorMessage(error: unknown): string {
	if (typeof error === 'string') {
		return error;
	}

	if (error instanceof Error) {
		return error.message;
	}

	return '';
}

function mapPostgresError(error: PgError): AppError | null {
	switch (error.code) {
		case '23505':
			return {
				message: 'A record with this value already exists',
				code: 'UNIQUE_VIOLATION',
			};
		case '23503':
			return {
				message:
					'This record is referenced by other data and cannot be changed',
				code: 'FK_VIOLATION',
			};
		case '23502':
			return {
				message: 'A required field is missing',
				code: 'NOT_NULL_VIOLATION',
			};
		case '23514':
			return {
				message: 'The value provided is out of the allowed range',
				code: 'CHECK_VIOLATION',
			};
		case '42P01':
			return {
				message:
					'A system configuration error occurred. Please contact support',
				code: 'UNDEFINED_TABLE',
			};
		case '57014':
			return {
				message:
					'The operation took too long and was canceled. Please try again',
				code: 'QUERY_CANCELED',
			};
		default:
			return null;
	}
}

export function extractError(error: unknown): AppError {
	if (error instanceof UserFacingError) {
		return {
			message: error.message,
			code: error.code,
		};
	}

	if (error instanceof Error && error.name === 'TimetablePlanningError') {
		return {
			message: error.message,
			code: 'TIMETABLE_PLANNING_ERROR',
		};
	}

	if (isPostgresError(error)) {
		const pgError = mapPostgresError(error);
		if (pgError) {
			return pgError;
		}
	}

	if (isMoodleError(error)) {
		return {
			message: 'An error occurred communicating with the LMS. Please try again',
			code: 'MOODLE_ERROR',
		};
	}

	const msg = getErrorMessage(error).toLowerCase();

	if (
		msg.includes('rate limit') ||
		msg.includes('too many requests') ||
		msg.includes('429')
	) {
		return {
			message: 'Too many requests. Please wait and try again',
			code: 'RATE_LIMITED',
		};
	}

	if (
		msg.includes('file too large') ||
		msg.includes('payload too large') ||
		msg.includes('limit_file_size')
	) {
		return {
			message: 'The file is too large. Please upload a smaller file',
			code: 'FILE_TOO_LARGE',
		};
	}

	if (
		(msg.includes('unsupported') && msg.includes('type')) ||
		msg.includes('invalid file') ||
		msg.includes('limit_unexpected_file')
	) {
		return {
			message: 'This file type is not supported',
			code: 'INVALID_FILE_TYPE',
		};
	}

	if (
		msg.includes('nosuchkey') ||
		msg.includes('accessdenied') ||
		msg.includes('nosuchbucket')
	) {
		return {
			message: 'A file storage error occurred. Please try again',
			code: 'STORAGE_ERROR',
		};
	}

	if (
		msg.includes('connect') ||
		msg.includes('econnrefused') ||
		msg.includes('enotfound') ||
		msg.includes('timeout') ||
		msg.includes('etimedout') ||
		msg.includes('socket hang up')
	) {
		return {
			message: 'Service temporarily unavailable. Please try again',
			code: 'SERVICE_UNAVAILABLE',
		};
	}

	return {
		message: 'An unexpected error occurred',
	};
}
