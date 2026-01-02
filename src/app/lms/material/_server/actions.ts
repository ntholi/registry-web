'use server';

import {
	getCourseSections as getCourseSectionsShared,
	getOrReuseSection,
} from '@lms/_shared/utils';
import { auth } from '@/core/auth';
import { moodleGet, moodlePost } from '@/core/integrations/moodle';
import type {
	CreateFileParams,
	CreatePageParams,
	CreateUrlParams,
	MoodlePage,
	MoodleSection,
} from '../types';

type CourseModule = {
	content?: string;
	course: number;
	id: number;
	instance: number;
	name: string;
	url: string;
};

type CourseModuleResponse = {
	cm?: CourseModule;
};

type MoodlePagesResponse = {
	pages?: MoodlePage[];
};

export async function getCourseSections(
	courseId: number
): Promise<MoodleSection[]> {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}

	return getCourseSectionsShared(courseId) as Promise<MoodleSection[]>;
}

async function findOrCreateMaterialSection(courseId: number): Promise<number> {
	return getOrReuseSection({
		courseId,
		sectionName: 'Material',
		summary: 'Course materials and resources',
	});
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

export async function createUrl(params: CreateUrlParams) {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	if (!params.name?.trim()) {
		throw new Error('Name is required');
	}

	if (!params.externalurl?.trim()) {
		throw new Error('URL is required');
	}

	const sectionNumber = await findOrCreateMaterialSection(params.courseid);

	try {
		const result = await moodlePost('local_activity_utils_create_url', {
			courseid: params.courseid,
			name: params.name.trim(),
			externalurl: params.externalurl.trim(),
			intro: params.intro?.trim() || '',
			section: sectionNumber,
			visible: 1,
		});

		return result;
	} catch (error) {
		console.error('Error creating URL:', error);
		throw new Error(
			'Unable to create URL. Please ensure the local_activity_utils plugin is installed and configured.'
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

export async function getMaterialContent(
	moduleId: number,
	modname: string,
	instanceId?: number
) {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}

	if (modname === 'page') {
		if (instanceId) {
			await moodleGet('mod_page_view_page', {
				pageid: instanceId,
			});
		}

		const moduleData = (await moodleGet('core_course_get_course_module', {
			cmid: moduleId,
		})) as CourseModuleResponse;
		const courseId = moduleData.cm?.course;
		const pageContent = await getPageContent(instanceId, courseId);

		if (pageContent) {
			return {
				type: 'page' as const,
				content: pageContent,
			};
		}

		return {
			type: 'page' as const,
			content: 'Content not available',
		};
	}

	if (modname === 'resource') {
		const result = (await moodleGet('core_course_get_course_module', {
			cmid: moduleId,
		})) as CourseModuleResponse;

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

async function getPageContent(pageId?: number, courseId?: number) {
	if (!pageId || !courseId) {
		return null;
	}

	const response = (await moodleGet('mod_page_get_pages_by_courses', {
		'courseids[0]': courseId,
	})) as MoodlePagesResponse;
	const pages = response.pages;

	if (!pages?.length) {
		return null;
	}

	const page = pages.find((item) => item.id === pageId);
	return page?.content || null;
}

export async function deleteMaterial(cmid: number) {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}

	try {
		await moodlePost('core_course_delete_modules', {
			'cmids[0]': cmid,
		});
	} catch (error) {
		console.error('Error deleting material:', error);
		throw new Error('Unable to delete material');
	}
}
