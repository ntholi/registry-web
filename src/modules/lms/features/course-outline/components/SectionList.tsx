'use client';

import {
	Paper,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
	useMantineTheme,
} from '@mantine/core';
import { IconFileText } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getCourseSectionsContent } from '../server/actions';
import type { CourseSection } from '../types';
import SectionCard from './SectionCard';
import SectionModal from './SectionModal';

type SectionListProps = {
	courseId: number;
};

function SectionCardSkeleton() {
	return (
		<Paper withBorder p='lg'>
			<Stack gap='md'>
				<Skeleton height={20} width='60%' />
				<Skeleton height={60} />
			</Stack>
		</Paper>
	);
}

export default function SectionList({ courseId }: SectionListProps) {
	const theme = useMantineTheme();
	const [selectedSection, setSelectedSection] = useState<CourseSection | null>(
		null
	);

	const { data: sections, isLoading } = useQuery({
		queryKey: ['course-sections', courseId],
		queryFn: () => getCourseSectionsContent(courseId),
	});

	if (isLoading) {
		return (
			<SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing='md'>
				{[1, 2, 3].map((i) => (
					<SectionCardSkeleton key={i} />
				))}
			</SimpleGrid>
		);
	}

	if (!sections || sections.length === 0) {
		return (
			<Paper p='xl' withBorder>
				<Stack align='center' gap='sm'>
					<IconFileText
						size={48}
						stroke={1}
						style={{ color: theme.colors.gray[5] }}
					/>
					<Text c='dimmed' size='md' fw={500}>
						No sections yet
					</Text>
					<Text c='dimmed' size='sm' ta='center'>
						Add your first course section to get started
					</Text>
				</Stack>
			</Paper>
		);
	}

	return (
		<>
			<SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing='md'>
				{sections.map((section) => (
					<SectionCard
						key={section.coursemoduleId}
						section={section}
						onClick={() => setSelectedSection(section)}
					/>
				))}
			</SimpleGrid>

			<SectionModal
				section={selectedSection}
				onClose={() => setSelectedSection(null)}
			/>
		</>
	);
}
