import { describe, expect, it } from 'vitest';
import { canReadRegistrationRequestList } from '../access';

describe('canReadRegistrationRequestList', () => {
	it('allows registry-facing staff roles with read privileges', () => {
		expect(canReadRegistrationRequestList({ role: 'registry' })).toBe(true);
		expect(canReadRegistrationRequestList({ role: 'leap' })).toBe(true);
		expect(canReadRegistrationRequestList({ role: 'student_services' })).toBe(
			true
		);
	});

	it('allows academic managers, program leaders, and year leaders', () => {
		expect(
			canReadRegistrationRequestList({
				role: 'academic',
				position: 'manager',
			})
		).toBe(true);
		expect(
			canReadRegistrationRequestList({
				role: 'academic',
				position: 'program_leader',
			})
		).toBe(true);
		expect(
			canReadRegistrationRequestList({
				role: 'academic',
				position: 'year_leader',
			})
		).toBe(true);
	});

	it('does not grant access from position alone without the academic role', () => {
		expect(
			canReadRegistrationRequestList({
				role: 'finance',
				position: 'manager',
			})
		).toBe(false);
	});

	it('does not allow unrelated roles', () => {
		expect(canReadRegistrationRequestList({ role: 'finance' })).toBe(false);
		expect(canReadRegistrationRequestList({ role: 'library' })).toBe(false);
		expect(canReadRegistrationRequestList(undefined)).toBe(false);
	});
});
