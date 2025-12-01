'use server';

import type { MoodleSection } from '@lms/material';
import { auth } from '@/core/auth';
import { moodleGet, moodlePost } from '@/core/integrations/moodle';
import type {
	CourseSection,
	CourseTopic,
	CreateSectionParams,
	CreateTopicParams,
} from '../types';

const COURSE_OUTLINE_SECTION_NAME = 'Course Outline';
const SECTIONS_SUBSECTION_NAME = 'Course Sections';
const TOPICS_SUBSECTION_NAME = 'Course Topics';

async function getCourseSections(courseId: number): Promise<MoodleSection[]> {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}

	const result = await moodleGet('core_course_get_contents', {
		courseid: courseId,
	});

	return result as MoodleSection[];
}

async function findOrCreateCourseOutlineSection(
	courseId: number
): Promise<number> {
	const sections = await getCourseSections(courseId);

	const outlineSection = sections.find(
		(section) =>
			section.name.toLowerCase() === COURSE_OUTLINE_SECTION_NAME.toLowerCase()
	);

	if (outlineSection) {
		return outlineSection.section;
	}

	const result = await moodlePost('local_activity_utils_create_section', {
		courseid: courseId,
		name: COURSE_OUTLINE_SECTION_NAME,
		summary: 'Course outline including sections and topics',
	});

	if (result?.sectionnum !== undefined) {
		return result.sectionnum;
	}

	throw new Error('Failed to create Course Outline section');
}

async function findOrCreateSubsection(
	courseId: number,
	parentSectionNum: number,
	name: string
): Promise<{ sectionnum: number; id: number }> {
	const sections = await getCourseSections(courseId);

	const subsection = sections.find(
		(section) => section.name.toLowerCase() === name.toLowerCase()
	);

	if (subsection) {
		return { sectionnum: subsection.section, id: subsection.id };
	}

	const result = await moodlePost('local_activity_utils_create_subsection', {
		courseid: courseId,
		parentsection: parentSectionNum,
		name: name,
	});

	if (result?.sectionnum !== undefined) {
		return { sectionnum: result.sectionnum, id: result.id };
	}

	throw new Error(`Failed to create ${name} subsection`);
}

async function getSectionsSubsectionNum(courseId: number): Promise<number> {
	const outlineSectionNum = await findOrCreateCourseOutlineSection(courseId);
	const subsection = await findOrCreateSubsection(
		courseId,
		outlineSectionNum,
		SECTIONS_SUBSECTION_NAME
	);
	return subsection.sectionnum;
}

async function getTopicsSubsectionNum(courseId: number): Promise<number> {
	const outlineSectionNum = await findOrCreateCourseOutlineSection(courseId);
	const subsection = await findOrCreateSubsection(
		courseId,
		outlineSectionNum,
		TOPICS_SUBSECTION_NAME
	);
	return subsection.sectionnum;
}

export async function getCourseSectionsContent(
	courseId: number
): Promise<CourseSection[]> {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}

	const sections = await getCourseSections(courseId);
	const sectionsSubsection = sections.find(
		(s) => s.name.toLowerCase() === SECTIONS_SUBSECTION_NAME.toLowerCase()
	);

	if (!sectionsSubsection?.modules) {
		return [];
	}

	const pages = sectionsSubsection.modules.filter((m) => m.modname === 'page');

	const result = await moodleGet('mod_page_get_pages_by_courses', {
		'courseids[0]': courseId,
	});

	const allPages = result?.pages || [];

	return pages.map((pageModule) => {
		const pageData = allPages.find(
			(p: { coursemodule: number }) => p.coursemodule === pageModule.id
		);
		return {
			id: pageData?.id || pageModule.instance,
			coursemoduleId: pageModule.id,
			name: pageModule.name,
			content: pageData?.content || '',
		};
	});
}

export async function getCourseTopics(
	courseId: number
): Promise<CourseTopic[]> {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}

	const sections = await getCourseSections(courseId);
	const topicsSubsection = sections.find(
		(s) => s.name.toLowerCase() === TOPICS_SUBSECTION_NAME.toLowerCase()
	);

	if (!topicsSubsection?.modules) {
		return [];
	}

	const pages = topicsSubsection.modules.filter((m) => m.modname === 'page');

	const result = await moodleGet('mod_page_get_pages_by_courses', {
		'courseids[0]': courseId,
	});

	const allPages = result?.pages || [];

	return pages
		.map((pageModule) => {
			const pageData = allPages.find(
				(p: { coursemodule: number }) => p.coursemodule === pageModule.id
			);
			const weekMatch = pageModule.name.match(/^Week\s+(\d+):\s*(.+)$/i);
			const weekNumber = weekMatch ? Number.parseInt(weekMatch[1], 10) : 0;
			const topicName = weekMatch ? weekMatch[2] : pageModule.name;

			return {
				id: pageData?.id || pageModule.instance,
				coursemoduleId: pageModule.id,
				weekNumber,
				name: topicName,
				description: pageData?.content || '',
			};
		})
		.sort((a, b) => a.weekNumber - b.weekNumber);
}

export async function createCourseSection(
	params: CreateSectionParams
): Promise<CourseSection> {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	if (!params.name?.trim()) {
		throw new Error('Section name is required');
	}

	if (!params.content?.trim()) {
		throw new Error('Section content is required');
	}

	const sectionNum = await getSectionsSubsectionNum(params.courseId);

	const result = await moodlePost('local_activity_utils_create_page', {
		courseid: params.courseId,
		name: params.name.trim(),
		content: params.content.trim(),
		section: sectionNum,
		visible: 1,
	});

	return {
		id: result.id,
		coursemoduleId: result.coursemoduleid,
		name: params.name.trim(),
		content: params.content.trim(),
	};
}

export async function createCourseTopic(
	params: CreateTopicParams
): Promise<CourseTopic> {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	if (!params.name?.trim()) {
		throw new Error('Topic name is required');
	}

	if (params.weekNumber < 1) {
		throw new Error('Week number must be at least 1');
	}

	const sectionNum = await getTopicsSubsectionNum(params.courseId);
	const pageName = `Week ${params.weekNumber}: ${params.name.trim()}`;

	const result = await moodlePost('local_activity_utils_create_page', {
		courseid: params.courseId,
		name: pageName,
		content: params.description?.trim() || '',
		section: sectionNum,
		visible: 1,
	});

	return {
		id: result.id,
		coursemoduleId: result.coursemoduleid,
		weekNumber: params.weekNumber,
		name: params.name.trim(),
		description: params.description?.trim() || '',
	};
}
