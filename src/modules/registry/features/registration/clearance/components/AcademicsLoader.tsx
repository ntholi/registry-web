'use client';

import { Box, Center, Loader } from '@mantine/core';
import { AcademicsView } from '@registry/students';
import { getStudent } from '@registry/students/server';
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
