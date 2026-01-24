import { programLevelEnum } from '@academic/schools/_schema/programs';
import { parseAsInteger, parseAsStringLiteral } from 'nuqs/server';

export const coursesSearchParams = {
	schoolId: parseAsInteger,
	level: parseAsStringLiteral(programLevelEnum.enumValues),
	page: parseAsInteger.withDefault(1),
};
