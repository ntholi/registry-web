import { nanoid } from 'nanoid';
import { beforeEach, describe, expect, it } from 'vitest';
import type { students, users } from '@/db/schema';
import { setMockUser } from '@/test/mocks.auth';
import { studentsService } from '../service';

type Student = typeof students.$inferInsert;
type User = typeof users.$inferInsert;

describe('Students Service', () => {
	beforeEach(() => {
		setMockUser({ role: 'admin' });
	});

	it('should update student userId', async () => {
		const studentData: Student = {
			stdNo: 123456,
			name: 'Test Student',
			nationalId: 'TEST123',
			sem: 1,
		};

		const createdStudent = await studentsService.create(studentData);
		expect(createdStudent).toBeDefined();

		const userData: User = {
			id: nanoid(),
			email: 'test@example.com',
			name: 'Test User',
			role: 'user',
		};

		const updatedStudent = await studentsService.updateUserId(createdStudent.stdNo, userData.id!);

		expect(updatedStudent).toBeDefined();
		expect(updatedStudent[0].userId).toBe(userData.id);
	});

	it('should remove student userId when set to null', async () => {
		const studentData: Student = {
			stdNo: 789012,
			name: 'Test Student 2',
			nationalId: 'TEST456',
			sem: 1,
			userId: nanoid(),
		};

		const createdStudent = await studentsService.create(studentData);
		expect(createdStudent.userId).toBeDefined();

		const updatedStudent = await studentsService.updateUserId(createdStudent.stdNo, null);

		expect(updatedStudent).toBeDefined();
		expect(updatedStudent[0].userId).toBeNull();
	});

	it('should get student by stdNo', async () => {
		const studentData: Student = {
			stdNo: 345678,
			name: 'Test Student Get',
			nationalId: 'TEST789',
			sem: 1,
		};

		const createdStudent = await studentsService.create(studentData);

		const student = await studentsService.get(createdStudent.stdNo);

		expect(student).toBeDefined();
		expect(student?.stdNo).toBe(createdStudent.stdNo);
		expect(student?.name).toBe('Test Student Get');
	});

	it('should return null for non-existent student', async () => {
		const student = await studentsService.get(999999);

		expect(student).toBeNull();
	});
});
