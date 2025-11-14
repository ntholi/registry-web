'use client';

import { ProgramDisplay } from '@academic/schools';
import {
	Accordion,
	Card,
	Group,
	Skeleton,
	Stack,
	Text,
	ThemeIcon,
	Title,
} from '@mantine/core';
import { IconArrowLeft, IconBook, IconSchool } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import {
	getProgramsBySchoolId,
	getSchool,
} from '@/modules/academic/features/schools/server/actions';
import Link from '@/shared/ui/Link';

type Program = {
	id: number;
	name: string;
	code: string;
};

export default function SchoolProgramsPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const schoolId = searchParams.get('schoolId');

	const { data: school, isLoading: schoolLoading } = useQuery({
		queryKey: ['school', schoolId],
		queryFn: () => (schoolId ? getSchool(Number(schoolId)) : null),
		enabled: !!schoolId,
	});

	const { data: programs, isLoading: programsLoading } = useQuery({
		queryKey: ['programs', schoolId],
		queryFn: () => (schoolId ? getProgramsBySchoolId(Number(schoolId)) : []),
		enabled: !!schoolId,
	});

	if (!schoolId) {
		router.push('/schools');
	}

	return (
		<Stack p='lg'>
			<Group>
				<Link c='dimmed' href='/schools'>
					<Group gap='xs'>
						<IconArrowLeft size={16} />
						<Text size='sm'>Back to Schools</Text>
					</Group>
				</Link>
			</Group>

			{schoolLoading ? (
				<Skeleton height={40} />
			) : (
				<Group>
					<ThemeIcon variant='light' color='gray' size='xl'>
						<IconSchool size='1.1rem' />
					</ThemeIcon>
					<div>
						<Title order={2}>{school?.name || 'School'}</Title>
						<Text c='dimmed' size='sm'>
							Programs and their structures
						</Text>
					</div>
				</Group>
			)}

			{programsLoading ? (
				<Stack gap='md'>
					{[1, 2, 3, 4].map((i) => (
						<Skeleton key={i} height={80} radius='md' />
					))}
				</Stack>
			) : programs && programs.length > 0 ? (
				<Accordion variant='separated' radius='md' multiple defaultValue={[]}>
					{programs.map((program: Program) => (
						<ProgramDisplay key={program.id} program={program} />
					))}
				</Accordion>
			) : (
				<Card withBorder shadow='sm' padding='xl'>
					<Stack align='center' gap='xs'>
						<IconBook size={48} />
						<Text size='lg' fw={500}>
							No Programs Found
						</Text>
						<Text size='sm' c='dimmed' ta='center'>
							This school currently has no programs defined.
						</Text>
					</Stack>
				</Card>
			)}
		</Stack>
	);
}
