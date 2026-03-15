'use server';

import { getLmsCredentials } from '@auth/auth-providers/_server/repository';
import {
	getCourseSections as getCourseSectionsShared,
	getOrReuseSection,
} from '@lms/_shared/utils';
import { auth } from '@/core/auth';
import { moodleGet, moodlePost } from '@/core/integrations/moodle';
import { createAction, unwrap } from '@/shared/lib/utils/actionResult';
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

async function getLmsToken() {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}

	const creds = await getLmsCredentials(session.user.id);
	return creds?.lmsToken ?? undefined;
}

export const getCourseSections = createAction(async (courseId: number) => {
	const lmsToken = await getLmsToken();

	return getCourseSectionsShared(courseId, lmsToken) as Promise<
		MoodleSection[]
	>;
});

async function findOrCreateMaterialSection(courseId: number): Promise<number> {
	const lmsToken = await getLmsToken();
	return getOrReuseSection({
		courseId,
		sectionName: 'Material',
		summary: 'Course materials and resources',
		lmsToken,
	});
}

export const createPage = createAction(async (params: CreatePageParams) => {
	const lmsToken = await getLmsToken();

	if (!params.name?.trim()) {
		throw new Error('Name is required');
	}

	if (!params.content?.trim()) {
		throw new Error('Page content is required');
	}

	const sectionNumber = await findOrCreateMaterialSection(params.courseid);

	try {
		const result = await moodlePost(
			'local_activity_utils_create_page',
			{
				courseid: params.courseid,
				name: params.name.trim(),
				content: params.content.trim(),
				section: sectionNumber,
				visible: 1,
			},
			lmsToken
		);

		return result;
	} catch (error) {
		console.error('Error creating page:', error);
		throw new Error(
			'Unable to create page. Please ensure the local_activity_utils plugin is installed and configured.'
		);
	}
});

export const createFile = createAction(async (params: CreateFileParams) => {
	const lmsToken = await getLmsToken();

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
		const result = await moodlePost(
			'local_activity_utils_create_file',
			{
				courseid: params.courseid,
				name: params.name.trim(),
				filename: params.filename.trim(),
				filecontent: params.filecontent,
				section: sectionNumber,
				visible: 1,
			},
			lmsToken
		);

		return result;
	} catch (error) {
		console.error('Error creating file:', error);
		throw new Error(
			'Unable to create file. Please ensure the local_activity_utils plugin is installed and configured.'
		);
	}
});

export const createUrl = createAction(async (params: CreateUrlParams) => {
	const lmsToken = await getLmsToken();

	if (!params.name?.trim()) {
		throw new Error('Name is required');
	}

	if (!params.externalurl?.trim()) {
		throw new Error('URL is required');
	}

	const sectionNumber = await findOrCreateMaterialSection(params.courseid);

	try {
		const result = await moodlePost(
			'local_activity_utils_create_url',
			{
				courseid: params.courseid,
				name: params.name.trim(),
				externalurl: params.externalurl.trim(),
				intro: params.intro?.trim() || '',
				section: sectionNumber,
				visible: 1,
			},
			lmsToken
		);

		return result;
	} catch (error) {
		console.error('Error creating URL:', error);
		throw new Error(
			'Unable to create URL. Please ensure the local_activity_utils plugin is installed and configured.'
		);
	}
});

export const getMaterialSection = createAction(async (courseId: number) => {
	const sections = unwrap(await getCourseSections(courseId));

	return (
		sections.find((section) => section.name.toLowerCase() === 'material') ||
		null
	);
});

export const getMaterialContent = createAction(
	async (moduleId: number, modname: string, instanceId?: number) => {
		const lmsToken = await getLmsToken();

		if (modname === 'page') {
			if (instanceId) {
				await moodleGet(
					'mod_page_view_page',
					{
						pageid: instanceId,
					},
					lmsToken
				);
			}

			const moduleData = (await moodleGet(
				'core_course_get_course_module',
				{
					cmid: moduleId,
				},
				lmsToken
			)) as CourseModuleResponse;
			const courseId = moduleData.cm?.course;
			const pageContent = await getPageContent(instanceId, courseId, lmsToken);

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
			const result = (await moodleGet(
				'core_course_get_course_module',
				{
					cmid: moduleId,
				},
				lmsToken
			)) as CourseModuleResponse;

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
);

async function getPageContent(
	pageId?: number,
	courseId?: number,
	lmsToken?: string
) {
	if (!pageId || !courseId) {
		return null;
	}

	const response = (await moodleGet(
		'mod_page_get_pages_by_courses',
		{
			'courseids[0]': courseId,
		},
		lmsToken
	)) as MoodlePagesResponse;
	const pages = response.pages;

	if (!pages?.length) {
		return null;
	}

	const page = pages.find((item) => item.id === pageId);
	return page?.content || null;
}

export const deleteMaterial = createAction(async (cmid: number) => {
	const lmsToken = await getLmsToken();

	try {
		await moodlePost(
			'core_course_delete_modules',
			{
				'cmids[0]': cmid,
			},
			lmsToken
		);
	} catch (error) {
		console.error('Error deleting material:', error);
		throw new Error('Unable to delete material');
	}
});
