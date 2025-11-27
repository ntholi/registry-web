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

	throw new Error(
		'Moodle does not provide a built-in web service to create assignments. ' +
			'You need to either: ' +
			'1. Create a custom Moodle plugin that exposes assignment creation via web service, or ' +
			'2. Use the Moodle REST API with admin credentials to directly call course/modedit.php, or ' +
			'3. Use the Moosh CLI tool for scripted assignment creation. ' +
			`Section number ${sectionNumber} is ready for the assignment.`
	);
}
