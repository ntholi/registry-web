'use server';

import { auth } from '@/core/auth';
import { moodleGet, moodlePost } from '@/core/integrations/moodle';
import type {
	BigBlueButtonSession,
	CreateBigBlueButtonParams,
	MoodleSection,
} from '../types';

const VIRTUAL_CLASSROOM_SECTION_NAME = 'Virtual Classroom';

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

async function findOrCreateVirtualClassroomSection(
	courseId: number
): Promise<number> {
	const sections = await getCourseSections(courseId);

	const virtualClassroomSection = sections.find(
		(section) =>
			section.name.toLowerCase() ===
			VIRTUAL_CLASSROOM_SECTION_NAME.toLowerCase()
	);

	if (virtualClassroomSection) {
		return virtualClassroomSection.section;
	}

	try {
		const result = await moodlePost('local_activity_utils_create_section', {
			courseid: courseId,
			name: VIRTUAL_CLASSROOM_SECTION_NAME,
			summary: 'Live virtual classroom sessions using BigBlueButton',
		});

		if (result && result.sectionnum !== undefined) {
			return result.sectionnum;
		}

		const updatedSections = await getCourseSections(courseId);
		const newSection = updatedSections.find(
			(section) =>
				section.name.toLowerCase() ===
				VIRTUAL_CLASSROOM_SECTION_NAME.toLowerCase()
		);

		if (newSection) {
			return newSection.section;
		}

		throw new Error('Failed to create Virtual Classroom section');
	} catch (error) {
		console.error('Error creating Virtual Classroom section:', error);
		throw new Error(
			'Unable to create Virtual Classroom section. Please ensure the local_activity_utils plugin is installed.'
		);
	}
}

export async function createBigBlueButtonSession(
	params: CreateBigBlueButtonParams
): Promise<BigBlueButtonSession> {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	if (!params.name?.trim()) {
		throw new Error('Session name is required');
	}

	const sectionNumber = await findOrCreateVirtualClassroomSection(
		params.courseid
	);

	try {
		const requestParams: Record<string, string | number> = {
			courseid: params.courseid,
			name: params.name.trim(),
			section: sectionNumber,
			visible: 1,
			type: params.type ?? 0,
			record: params.record ?? 1,
			wait: params.wait ?? 1,
			muteonstart: params.muteonstart ?? 1,
		};

		if (params.intro) {
			requestParams.intro = params.intro;
		}

		if (params.welcome) {
			requestParams.welcome = params.welcome;
		}

		if (params.userlimit !== undefined && params.userlimit > 0) {
			requestParams.userlimit = params.userlimit;
		}

		if (params.openingtime) {
			requestParams.openingtime = params.openingtime;
		}

		if (params.closingtime) {
			requestParams.closingtime = params.closingtime;
		}

		const result = await moodlePost(
			'local_activity_utils_create_bigbluebuttonbn',
			requestParams
		);

		return result as BigBlueButtonSession;
	} catch (error) {
		console.error('Error creating BigBlueButton session:', error);
		throw new Error(
			'Unable to create virtual classroom session. Please ensure the BigBlueButton plugin is installed and configured.'
		);
	}
}

export async function getVirtualClassroomSessions(
	courseId: number
): Promise<MoodleSection | null> {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}

	const sections = await getCourseSections(courseId);

	return (
		sections.find(
			(section) =>
				section.name.toLowerCase() ===
				VIRTUAL_CLASSROOM_SECTION_NAME.toLowerCase()
		) || null
	);
}

export async function getBigBlueButtonJoinUrl(
	cmid: number
): Promise<string | null> {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error('Unauthorized');
	}

	try {
		const result = await moodleGet('mod_bigbluebuttonbn_get_join_url', {
			cmid,
		});

		if (result?.join_url) {
			return result.join_url;
		}

		return null;
	} catch (error) {
		console.error('Error getting BigBlueButton join URL:', error);
		return null;
	}
}
