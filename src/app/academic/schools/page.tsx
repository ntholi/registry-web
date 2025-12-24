'use client';

import type { schools } from '@academic/_database';
import {
	Box,
	Card,
	Flex,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
	ThemeIcon,
	Title,
	UnstyledButton,
} from '@mantine/core';
import { IconChevronRight, IconSchool } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { getAllSchools } from './_server/actions';

type School = typeof schools.$inferSelect;

export default function SchoolsPage() {
	const { data: schools, isLoading } = useQuery({
		queryKey: ['schools'],
		queryFn: getAllSchools,
	});

	return (
		<Stack p='lg'>
			<Title order={2}>Schools</Title>
			<Text c='dimmed' size='sm'>
				Select a school to view its programs and modules
			</Text>

			{isLoading ? (
				<SimpleGrid cols={{ base: 1, sm: 2 }}>
					{[1, 2, 3, 4, 5, 6].map((i) => (
						<Skeleton key={i} height={85} radius='md' />
					))}
				</SimpleGrid>
			) : (
				<SimpleGrid cols={{ base: 1, sm: 2 }}>
					{schools?.map((school) => (
						<SchoolCard key={school.id} school={school} />
					))}
				</SimpleGrid>
			)}

			{!isLoading && schools && schools.length === 0 && (
				<Card withBorder shadow='sm' padding='xl'>
					<Stack align='center' gap='xs'>
						<IconSchool size={48} />
						<Text size='lg' fw={500}>
							No Schools Found
						</Text>
						<Text size='sm' c='dimmed' ta='center'>
							Contact your administrator to add schools to the system.
						</Text>
					</Stack>
				</Card>
			)}
		</Stack>
	);
}

function SchoolCard({ school }: { school: School }) {
	const [isHovered, setIsHovered] = useState(false);

	return (
		<UnstyledButton
			component={Link}
			href={`/academic/schools/structures?schoolId=${school.id}`}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<Card withBorder shadow='sm' padding='lg'>
				<Flex gap={'md'}>
					<ThemeIcon variant='light' color='gray' size={'xl'}>
						<IconSchool size='1.1rem' />
					</ThemeIcon>
					<Box style={{ flex: 1 }}>
						<Text ff='monospace' fw={600}>
							{school.code}
						</Text>
						<Text size='sm' lineClamp={1}>
							{school.name}
						</Text>
					</Box>
					<Stack justify='center'>
						<IconChevronRight
							size={16}
							style={{
								transition: 'transform 0.2s ease',
								transform: isHovered ? 'translateX(4px)' : 'translateX(0px)',
							}}
						/>
					</Stack>
				</Flex>
			</Card>
		</UnstyledButton>
	);
}
