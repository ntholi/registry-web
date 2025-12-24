'use client';

import { Box, Center, Loader } from '@mantine/core';
import { AcademicsView, getStudent } from '@registry/students';
import { useQuery } from '@tanstack/react-query';

type Props = {
	stdNo: number;
};

export default function AcademicsLoader({ stdNo }: Props) {
	const { data: student, isLoading } = useQuery({
		queryFn: () => getStudent(stdNo),
		queryKey: ['students', stdNo],
	});

	if (isLoading) {
		return (
			<Center mt={'4rem'}>
				<Loader size='sm' />
			</Center>
		);
	}

	if (!student) return null;

	return (
		<Box p={'lg'}>
			<AcademicsView student={student} />
		</Box>
	);
}
