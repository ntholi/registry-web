'use server';

import { auth } from '@/core/auth';
import { moodleGet, moodlePost } from '@/core/integrations/moodle';
import type { CreatePageParams, MoodlePage, MoodleSection } from '../types';

export async function getCourseSections(
	courseId: number
): Promise<MoodleSection[]> {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}

	const result = await moodleGet('core_course_get_contents', {
		courseid: courseId,
	});

	return result as MoodleSection[];
}

export async function getCoursePages(courseId: number): Promise<MoodlePage[]> {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}

	const result = await moodleGet('mod_page_get_pages_by_courses', {
		'courseids[0]': courseId,
	});

	if (!result || !result.pages) {
		return [];
	}

	return result.pages as MoodlePage[];
}

async function findOrCreateMaterialSection(courseId: number): Promise<number> {
	const sections = await getCourseSections(courseId);

	const materialSection = sections.find(
		(section) => section.name.toLowerCase() === 'material'
	);

	if (materialSection) {
		return materialSection.section;
	}

	try {
		const result = await moodlePost('local_wsmanagesections_create_sections', {
			'sections[0][course]': courseId,
			'sections[0][name]': 'Material',
			'sections[0][summary]': 'Course materials and resources',
			'sections[0][summaryformat]': 1,
			'sections[0][visible]': 1,
		});

		if (result && result[0] && result[0].section !== undefined) {
			return result[0].section;
		}

		const updatedSections = await getCourseSections(courseId);
		const newSection = updatedSections.find(
			(section) => section.name.toLowerCase() === 'material'
		);

		if (newSection) {
			return newSection.section;
		}

		throw new Error('Failed to create Material section');
	} catch (error) {
		console.error('Error creating Material section:', error);
		throw new Error(
			'Unable to create Material section. Please ensure the local_wsmanagesections plugin is installed.'
		);
	}
}

export async function createPage(params: CreatePageParams) {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	if (!params.name?.trim()) {
		throw new Error('Name is required');
	}

	if (!params.content?.trim()) {
		throw new Error('Page content is required');
	}

	const sectionNumber = await findOrCreateMaterialSection(params.courseid);

	try {
		const result = await moodlePost('local_wsmanagecourses_create_modules', {
			'modules[0][courseid]': params.courseid,
			'modules[0][modulename]': 'page',
			'modules[0][section]': sectionNumber,
			'modules[0][name]': params.name.trim(),
			'modules[0][page][content]': params.content.trim(),
			'modules[0][page][contentformat]': 1,
			'modules[0][visible]': 1,
		});

		return result;
	} catch (error) {
		console.error('Error creating page:', error);
		throw new Error(
			'Unable to create page. Please ensure the local_wsmanagecourses plugin is installed and configured.'
		);
	}
}

export async function getMaterialSection(
	courseId: number
): Promise<MoodleSection | null> {
	const sections = await getCourseSections(courseId);

	return (
		sections.find((section) => section.name.toLowerCase() === 'material') ||
		null
	);
}
