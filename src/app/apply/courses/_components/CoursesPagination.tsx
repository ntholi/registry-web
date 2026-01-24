'use client';

import { Group, Pagination } from '@mantine/core';
import { parseAsInteger, useQueryState } from 'nuqs';

interface CoursesPaginationProps {
	page: number;
	total: number;
}

export default function CoursesPagination({
	page,
	total,
}: CoursesPaginationProps) {
	const [_, setPage] = useQueryState('page', parseAsInteger.withDefault(1));

	if (total <= 1) {
		return null;
	}

	return (
		<Group justify='center'>
			<Pagination
				value={page}
				onChange={(nextPage) => setPage(nextPage)}
				total={total}
			/>
		</Group>
	);
}
