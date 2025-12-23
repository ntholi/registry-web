'use server';

import { createAssessment as createAcademicAssessment } from '@/app/academic/assessments/_server/actions';
import { auth } from '@/core/auth';
import type { AssessmentNumber } from '@/core/database';
import { moodleGet, moodlePost } from '@/core/integrations/moodle';
import { getOrReuseSection } from '@/modules/lms/shared/utils';
import { getActiveTerm } from '@/modules/registry/features/dates/terms';
import type { CreateAssignmentParams, MoodleAssignment } from '../types';

export async function getCourseAssignments(
	courseId: number
): Promise<MoodleAssignment[]> {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}

	const result = await moodleGet('mod_assign_get_assignments', {
		'courseids[0]': courseId,
	});

	if (!result || !result.courses || result.courses.length === 0) {
		return [];
	}

	return result.courses[0].assignments as MoodleAssignment[];
}

export async function getAssignment(
	courseId: number,
	assignmentId: number
): Promise<MoodleAssignment | null> {
	const assignments = await getCourseAssignments(courseId);
	return assignments.find((a) => a.id === assignmentId) || null;
}

async function fileToBase64(file: File): Promise<string> {
	const bytes = await file.arrayBuffer();
	const buffer = Buffer.from(bytes);
	return buffer.toString('base64');
}

export async function createAssignment(params: CreateAssignmentParams) {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}
	const term = await getActiveTerm();
	if (!term) {
		throw new Error('No active term found');
	}

	if (!params.name?.trim()) {
		throw new Error('Assignment name is required');
	}

	if (!params.duedate) {
		throw new Error('Due date is required');
	}

	if (!params.idnumber?.trim()) {
		throw new Error('Assignment number is required');
	}

	const sectionNumber = await getOrReuseSection({
		courseId: params.courseid,
		sectionName: 'Assignments',
		summary: 'Course assignments and submissions',
		matchFn: (name) =>
			name.toLowerCase() === 'assignments' ||
			name.toLowerCase() === 'assignment',
	});

	const requestParams: Record<string, string | number> = {
		courseid: params.courseid,
		name: params.name,
		duedate: params.duedate,
		allowsubmissionsfromdate: params.allowsubmissionsfromdate,
		section: sectionNumber,
		idnumber: params.idnumber,
		grademax: params.grademax,
	};

	if (params.intro) {
		requestParams.intro = params.intro;
	}

	if (params.activityinstructions) {
		requestParams.activity = params.activityinstructions;
	}

	if (params.attachments && params.attachments.length > 0) {
		const introfiles = await Promise.all(
			params.attachments.map(async (file) => ({
				filename: file.name,
				content: await fileToBase64(file),
				base64: true,
			}))
		);
		requestParams.introfiles = JSON.stringify(introfiles);
	}

	const result = await moodlePost(
		'local_activity_utils_create_assignment',
		requestParams
	);

	try {
		await createAcademicAssessment(
			{
				moduleId: params.moduleId,
				assessmentNumber: params.idnumber as AssessmentNumber,
				assessmentType: params.name,
				totalMarks: params.grademax,
				weight: params.weight,
				termId: term.id,
			},
			{
				lmsId: result.id,
				activityType: 'assignment',
			}
		);
	} catch (error) {
		await moodlePost('local_activity_utils_delete_assignment', {
			cmid: result.coursemoduleid,
		});
		throw error;
	}

	return result;
}

export async function deleteAssignment(cmid: number) {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	await moodlePost('local_activity_utils_delete_assignment', {
		cmid,
	});
}
