'use server';

import { auth } from '@/core/auth';
import { moodleGet, moodlePost } from '@/core/integrations/moodle';
import type {
	CreateRubricParams,
	Rubric,
	RubricCriterion,
} from '../../../types';

export async function getRubric(cmid: number): Promise<Rubric | null> {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	try {
		const result = await moodleGet('local_activity_utils_get_rubric', {
			cmid,
		});

		if (!result?.success) {
			return null;
		}

		return result as Rubric;
	} catch {
		return null;
	}
}

function buildCriteriaParams(
	criteria: RubricCriterion[]
): Record<string, string | number> {
	const params: Record<string, string | number> = {};

	criteria.forEach((criterion, criterionIndex) => {
		params[`criteria[${criterionIndex}][description]`] = criterion.description;
		if (criterion.id) {
			params[`criteria[${criterionIndex}][id]`] = criterion.id;
		}
		if (criterion.sortorder !== undefined) {
			params[`criteria[${criterionIndex}][sortorder]`] = criterion.sortorder;
		}

		criterion.levels.forEach((level, levelIndex) => {
			params[`criteria[${criterionIndex}][levels][${levelIndex}][score]`] =
				level.score;
			params[`criteria[${criterionIndex}][levels][${levelIndex}][definition]`] =
				level.definition;
			if (level.id) {
				params[`criteria[${criterionIndex}][levels][${levelIndex}][id]`] =
					level.id;
			}
		});
	});

	return params;
}

export async function createRubric(params: CreateRubricParams) {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	const requestParams: Record<string, string | number> = {
		cmid: params.cmid,
		name: params.name,
	};

	if (params.description) {
		requestParams.description = params.description;
	}

	const criteriaParams = buildCriteriaParams(params.criteria);
	Object.assign(requestParams, criteriaParams);

	const result = await moodlePost(
		'local_activity_utils_create_rubric',
		requestParams
	);

	return result;
}

export async function updateRubric(
	cmid: number,
	params: Partial<CreateRubricParams>
) {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	const requestParams: Record<string, string | number> = { cmid };

	if (params.name) {
		requestParams.name = params.name;
	}

	if (params.description) {
		requestParams.description = params.description;
	}

	if (params.criteria) {
		const criteriaParams = buildCriteriaParams(params.criteria);
		Object.assign(requestParams, criteriaParams);
	}

	const result = await moodlePost(
		'local_activity_utils_update_rubric',
		requestParams
	);

	return result;
}

export async function deleteRubric(cmid: number) {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	const result = await moodlePost('local_activity_utils_delete_rubric', {
		cmid,
	});

	return result;
}

export async function copyRubric(sourceCmid: number, targetCmid: number) {
	const session = await auth();
	if (!session?.user) {
		throw new Error('Unauthorized');
	}

	const result = await moodlePost('local_activity_utils_copy_rubric', {
		sourcecmid: sourceCmid,
		targetcmid: targetCmid,
	});

	return result;
}
