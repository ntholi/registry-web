'use server';

import { moodleGet, moodlePost } from '@/core/integrations/moodle';

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
		instance: number;
	}>;
};

export async function getCourseSections(
	courseId: number,
	lmsToken?: string
): Promise<CourseSection[]> {
	const result = await moodleGet(
		'core_course_get_contents',
		{
			courseid: courseId,
		},
		lmsToken
	);
	return result as CourseSection[];
}

type GetOrReuseSectionParams = {
	courseId: number;
	sectionName: string;
	summary?: string;
	matchFn?: (sectionName: string) => boolean;
	lmsToken?: string;
};

export async function getOrReuseSection(
	params: GetOrReuseSectionParams
): Promise<number> {
	const { courseId, sectionName, summary, matchFn, lmsToken } = params;

	const sections = await getCourseSections(courseId, lmsToken);

	const defaultMatchFn = (name: string) =>
		name.toLowerCase() === sectionName.toLowerCase();

	const matcher = matchFn || defaultMatchFn;

	const existingSection = sections.find((section) => matcher(section.name));

	if (existingSection) {
		return existingSection.section;
	}

	try {
		const result = await moodlePost(
			'local_activity_utils_create_section',
			{
				courseid: courseId,
				name: sectionName,
				summary: summary || `${sectionName} section`,
			},
			lmsToken
		);

		if (result && result.sectionnum !== undefined) {
			return result.sectionnum;
		}

		const updatedSections = await getCourseSections(courseId, lmsToken);
		const newSection = updatedSections.find((section) => matcher(section.name));

		if (newSection) {
			return newSection.section;
		}

		throw new Error(`Failed to create ${sectionName} section`);
	} catch (error) {
		console.error(`Error creating ${sectionName} section:`, error);
		throw new Error(
			`Unable to create ${sectionName} section. Please ensure the local_activity_utils plugin is installed.`
		);
	}
}
