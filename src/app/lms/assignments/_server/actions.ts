'use server';

import { getOrReuseSection } from '@lms/_shared/utils';
import { createAssessment as createAcademicAssessment } from '@/app/academic/assessments/_server/actions';
import { getActiveTerm } from '@/app/registry/terms';
import { auth } from '@/core/auth';
import type { AssessmentNumber } from '@/core/database';
import { moodleGet, moodlePost } from '@/core/integrations/moodle';
import type { CreateAssignmentParams, MoodleAssignment } from '../types';

export async function getCourseAssignments(
	courseId: number
): Promise<MoodleAssignment[]> {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}

	const [assignResult, sectionsResult] = await Promise.all([
		moodleGet('mod_assign_get_assignments', {
			'courseids[0]': courseId,
		}),
		moodleGet(
			'core_course_get_contents',
			{ courseid: courseId },
			process.env.MOODLE_TOKEN
		),
	]);

	if (!assignResult || !assignResult.courses || assignResult.courses.length === 0) {
		return [];
	}

	const visibilityMap = new Map<number, number>();
	if (Array.isArray(sectionsResult)) {
		for (const section of sectionsResult) {
			for (const mod of section.modules || []) {
				visibilityMap.set(mod.id, mod.visible ?? 1);
			}
		}
	}

	const assignments = assignResult.courses[0].assignments as MoodleAssignment[];
	return assignments.map((a) => ({
		...a,
		visible: (a.cmid ? visibilityMap.get(a.cmid) : undefined) ?? a.visible ?? 1,
	}));
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

type CreateDraftAssignmentInput = {
	courseid: number;
	name: string;
	intro?: string;
	allowsubmissionsfromdate: number;
	duedate: number;
	activityinstructions?: string;
	grademax: number;
};

export async function createDraftAssignment(params: CreateDraftAssignmentInput) {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	if (!params.name?.trim()) {
		throw new Error('Assignment name is required');
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
		grademax: params.grademax,
		visible: 0,
	};

	if (params.intro) {
		requestParams.intro = params.intro;
	}
	if (params.activityinstructions) {
		requestParams.activity = params.activityinstructions;
	}

	const result = await moodlePost(
		'local_activity_utils_create_assignment',
		requestParams
	);

	return {
		assignmentId: result.id as number,
		courseModuleId: result.coursemoduleid as number,
	};
}

export async function updateAssignment(
	assignmentId: number,
	params: {
		name?: string;
		intro?: string;
		activity?: string;
		allowsubmissionsfromdate?: number;
		duedate?: number;
		grademax?: number;
		visible?: number;
	}
) {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	const updateParams: Record<string, string | number | undefined> = {
		assignmentid: assignmentId,
	};

	if (params.name !== undefined) updateParams.name = params.name;
	if (params.intro !== undefined) updateParams.intro = params.intro;
	if (params.activity !== undefined) updateParams.activity = params.activity;
	if (params.allowsubmissionsfromdate !== undefined)
		updateParams.allowsubmissionsfromdate = params.allowsubmissionsfromdate;
	if (params.duedate !== undefined) updateParams.duedate = params.duedate;
	if (params.grademax !== undefined) updateParams.grademax = params.grademax;
	if (params.visible !== undefined) updateParams.visible = params.visible;

	await moodlePost('local_activity_utils_update_assignment', updateParams);
}

export async function publishAssignment(input: {
	assignmentId: number;
	courseId: number;
	moduleId: number;
	assessmentNumber: string;
	weight: number;
	totalMarks: number;
}) {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	const term = await getActiveTerm();
	if (!term) {
		throw new Error('No active term found');
	}

	const assignment = await getAssignment(input.courseId, input.assignmentId);
	if (!assignment) {
		throw new Error('Assignment not found');
	}

	await updateAssignment(input.assignmentId, { visible: 1 });

	await createAcademicAssessment(
		{
			moduleId: input.moduleId,
			assessmentNumber: input.assessmentNumber as AssessmentNumber,
			assessmentType: assignment.name,
			totalMarks: input.totalMarks,
			weight: input.weight,
			termId: term.id,
		},
		{
			lmsId: input.assignmentId,
			activityType: 'assignment',
		}
	);

	return { success: true };
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
