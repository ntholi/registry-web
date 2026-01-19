'use client';

import { Group, Pagination } from '@mantine/core';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

interface CoursesPaginationProps {
	page: number;
	total: number;
}

export default function CoursesPagination({
	page,
	total,
}: CoursesPaginationProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	if (total <= 1) {
		return null;
	}

	function handleChange(nextPage: number) {
		const params = new URLSearchParams(searchParams.toString());
		params.set('page', nextPage.toString());
		const queryString = params.toString();
		router.push(queryString ? `${pathname}?${queryString}` : pathname);
	}

	return (
		<Group justify='center'>
			<Pagination value={page} onChange={handleChange} total={total} />
		</Group>
	);
}
