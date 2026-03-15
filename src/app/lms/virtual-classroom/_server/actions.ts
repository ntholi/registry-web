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
	BigBlueButtonSession,
	CreateBigBlueButtonParams,
	MoodleSection,
} from '../types';

const VIRTUAL_CLASSROOM_SECTION_NAME = 'Virtual Classroom';

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

export const createBigBlueButtonSession = createAction(
	async (params: CreateBigBlueButtonParams) => {
		const lmsToken = await getLmsToken();

		if (!params.name?.trim()) {
			throw new Error('Session name is required');
		}

		const sectionNumber = await getOrReuseSection({
			courseId: params.courseid,
			sectionName: VIRTUAL_CLASSROOM_SECTION_NAME,
			summary: 'Live virtual classroom sessions using BigBlueButton',
			lmsToken,
		});

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
				requestParams,
				lmsToken
			);

			return result as BigBlueButtonSession;
		} catch (error) {
			console.error('Error creating BigBlueButton session:', error);
			throw new Error(
				'Unable to create virtual classroom session. Please ensure the BigBlueButton plugin is installed and configured.'
			);
		}
	}
);

export const getVirtualClassroomSessions = createAction(
	async (courseId: number) => {
		const sections = unwrap(await getCourseSections(courseId));

		return (
			sections.find(
				(section) =>
					section.name.toLowerCase() ===
					VIRTUAL_CLASSROOM_SECTION_NAME.toLowerCase()
			) || null
		);
	}
);

export const getBigBlueButtonJoinUrl = createAction(async (cmid: number) => {
	const lmsToken = await getLmsToken();

	try {
		const result = await moodleGet(
			'mod_bigbluebuttonbn_get_join_url',
			{
				cmid,
			},
			lmsToken
		);

		if (result?.join_url) {
			return result.join_url;
		}

		return null;
	} catch (error) {
		console.error('Error getting BigBlueButton join URL:', error);
		return null;
	}
});
