import { setMockUser } from '@admin/test/server';
import { beforeEach, describe, expect, it } from 'vitest';
import type { students } from '@/core/database';
import { db, users as usersTable } from '@/core/database';
import { studentsService } from '../service';

type Student = typeof students.$inferInsert;

describe('Students Service', () => {
	beforeEach(() => {
		setMockUser({ role: 'admin' });
	});

	it('should update student userId', async () => {
		const studentData: Student = {
			stdNo: 123456,
			name: 'Test Student',
			nationalId: 'TEST123',
		};

		const createdStudent = await studentsService.create(studentData);
		expect(createdStudent).toBeDefined();

		const [createdUser] = await db
			.insert(usersTable)
			.values({
				id: 'test-user-id-1',
				email: 'test@example.com',
				name: 'Test User',
				role: 'user',
			})
			.returning();

		const updatedStudent = await studentsService.updateUserId(
			createdStudent.stdNo,
			createdUser.id
		);

		expect(updatedStudent).toBeDefined();
		expect(updatedStudent[0].userId).toBe(createdUser.id);
	});

	it('should remove student userId when set to null', async () => {
		const [createdUser] = await db
			.insert(usersTable)
			.values({
				id: 'test-user-id-2',
				email: 'test2@example.com',
				name: 'Test User 2',
				role: 'user',
			})
			.returning();

		const studentData: Student = {
			stdNo: 789012,
			name: 'Test Student 2',
			nationalId: 'TEST456',
			userId: createdUser.id,
		};

		const createdStudent = await studentsService.create(studentData);
		expect(createdStudent.userId).toBeDefined();

		const updatedStudent = await studentsService.updateUserId(
			createdStudent.stdNo,
			null
		);

		expect(updatedStudent).toBeDefined();
		expect(updatedStudent[0].userId).toBeNull();
	});

	it('should get student by stdNo', async () => {
		const studentData: Student = {
			stdNo: 345678,
			name: 'Test Student Get',
			nationalId: 'TEST789',
		};

		const createdStudent = await studentsService.create(studentData);

		const student = await studentsService.get(createdStudent.stdNo);

		expect(student).toBeDefined();
		expect(student?.stdNo).toBe(createdStudent.stdNo);
		expect(student?.name).toBe('Test Student Get');
	});

	it('should return undefined for non-existent student', async () => {
		const student = await studentsService.get(999999);

		expect(student).toBeUndefined();
	});
});
