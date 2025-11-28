'use server';

import { auth } from '@/core/auth';
import { moodleGet, moodlePost } from '@/core/integrations/moodle';
import type { CreateAssignmentParams, MoodleAssignment } from '../types';

type CourseSection = {
	id: number;
	name: string;
	section: number;
	summaryformat: number;
	summary: string;
	modules: Array<{
		id: number;
		name: string;
		modname: string;
	}>;
};

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

async function getCourseSections(courseId: number): Promise<CourseSection[]> {
	const result = await moodleGet('core_course_get_contents', {
		courseid: courseId,
	});

	return result as CourseSection[];
}

async function getOrCreateAssessmentsSection(
	courseId: number
): Promise<number> {
	const sections = await getCourseSections(courseId);

	const assessmentSection = sections.find(
		(section) =>
			section.name.toLowerCase() === 'assessments' ||
			section.name.toLowerCase() === 'assessment'
	);

	if (assessmentSection) {
		return assessmentSection.section;
	}

	try {
		const result = await moodlePost('local_wsmanagesections_create_sections', {
			courseid: courseId,
			sectionnumber: sections.length,
			sectionname: 'Assessments',
		});

		if (result && result.sectionnumber !== undefined) {
			return result.sectionnumber;
		}

		const updatedSections = await getCourseSections(courseId);
		const newSection = updatedSections.find(
			(section) => section.name === 'Assessments'
		);
		return newSection?.section || 0;
	} catch (error) {
		console.error('Failed to create Assessments section:', error);
		return 0;
	}
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

	if (!params.name?.trim()) {
		throw new Error('Assignment name is required');
	}

	if (!params.intro?.trim()) {
		throw new Error('Description is required');
	}

	if (!params.duedate) {
		throw new Error('Due date is required');
	}

	const sectionNumber = await getOrCreateAssessmentsSection(params.courseid);

	const requestParams: Record<string, string | number> = {
		courseid: params.courseid,
		name: params.name,
		intro: params.intro,
		duedate: params.duedate,
		allowsubmissionsfromdate: params.allowsubmissionsfromdate,
		section: sectionNumber,
	};

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
		'local_createassign_create_assessment',
		requestParams
	);

	return result;
}
