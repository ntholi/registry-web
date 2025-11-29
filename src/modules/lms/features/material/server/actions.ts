'use server';

import { auth } from '@/core/auth';
import { moodleGet, moodlePost } from '@/core/integrations/moodle';
import type {
	CreateFileParams,
	CreatePageParams,
	MoodlePage,
	MoodleSection,
} from '../types';

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
		const result = await moodlePost('local_activity_utils_create_section', {
			courseid: courseId,
			name: 'Material',
			summary: 'Course materials and resources',
		});

		if (result && result.sectionnum !== undefined) {
			return result.sectionnum;
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
			'Unable to create Material section. Please ensure the local_activity_utils plugin is installed.'
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
		const result = await moodlePost('local_activity_utils_create_page', {
			courseid: params.courseid,
			name: params.name.trim(),
			content: params.content.trim(),
			section: sectionNumber,
			visible: 1,
		});

		return result;
	} catch (error) {
		console.error('Error creating page:', error);
		throw new Error(
			'Unable to create page. Please ensure the local_activity_utils plugin is installed and configured.'
		);
	}
}

export async function createFile(params: CreateFileParams) {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	if (!params.name?.trim()) {
		throw new Error('Name is required');
	}

	if (!params.filename?.trim()) {
		throw new Error('Filename is required');
	}

	if (!params.filecontent) {
		throw new Error('File content is required');
	}

	const sectionNumber = await findOrCreateMaterialSection(params.courseid);

	try {
		const result = await moodlePost('local_activity_utils_create_file', {
			courseid: params.courseid,
			name: params.name.trim(),
			filename: params.filename.trim(),
			filecontent: params.filecontent,
			section: sectionNumber,
			visible: 1,
		});

		return result;
	} catch (error) {
		console.error('Error creating file:', error);
		throw new Error(
			'Unable to create file. Please ensure the local_activity_utils plugin is installed and configured.'
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

export async function getMaterialContent(moduleId: number, modname: string) {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}

	if (modname === 'page') {
		const result = await moodleGet('mod_page_view_page', {
			pageid: moduleId,
		});

		if (result) {
			const pageData = await moodleGet('core_course_get_course_module', {
				cmid: moduleId,
			});

			if (pageData?.cm?.content) {
				return {
					type: 'page' as const,
					content: pageData.cm.content,
				};
			}
		}

		return {
			type: 'page' as const,
			content: 'Content not available',
		};
	}

	if (modname === 'resource') {
		const result = await moodleGet('core_course_get_course_module', {
			cmid: moduleId,
		});

		if (result?.cm) {
			return {
				type: 'resource' as const,
				url: result.cm.url,
				filename: result.cm.name,
			};
		}
	}

	return null;
}
