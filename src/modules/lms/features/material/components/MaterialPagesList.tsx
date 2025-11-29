'use client';

import {
	Card,
	Paper,
	Skeleton,
	Stack,
	Text,
	useMantineTheme,
} from '@mantine/core';
import { IconFileText } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { getMaterialSection } from '../server/actions';

type MaterialPagesListProps = {
	courseId: number;
};

function MaterialPageSkeleton() {
	return (
		<Card withBorder shadow='xs' padding='lg'>
			<Stack gap='sm'>
				<Skeleton height={20} width='60%' />
				<Skeleton height={14} width='40%' />
				<Skeleton height={14} width='100%' />
				<Skeleton height={14} width='95%' />
			</Stack>
		</Card>
	);
}

export default function MaterialPagesList({
	courseId,
}: MaterialPagesListProps) {
	const theme = useMantineTheme();
	const { data: section, isLoading } = useQuery({
		queryKey: ['material-pages', courseId],
		queryFn: () => getMaterialSection(courseId),
	});

	if (isLoading) {
		return (
			<Stack gap='md'>
				{[1, 2, 3].map((i) => (
					<MaterialPageSkeleton key={i} />
				))}
			</Stack>
		);
	}

	const materials =
		section?.modules?.filter(
			(m) => m.modname === 'page' || m.modname === 'resource'
		) || [];

	if (materials.length === 0) {
		return (
			<Paper p='xl' withBorder>
				<Stack align='center' gap='xs'>
					<IconFileText size={48} stroke={1.5} color={theme.colors.gray[4]} />
					<Text c='dimmed' size='lg'>
						No materials yet
					</Text>
					<Text c='dimmed' size='sm'>
						Create your first page or upload a file to get started
					</Text>
				</Stack>
			</Paper>
		);
	}

	return (
		<Stack gap='md'>
			{materials.map((material) => (
				<Card
					key={material.id}
					withBorder
					shadow='xs'
					padding='lg'
					component='a'
					href={material.url}
					target='_blank'
					rel='noopener noreferrer'
					style={{ cursor: 'pointer', textDecoration: 'none' }}
				>
					<Stack gap='xs'>
						<Text fw={500} size='md'>
							{material.name}
						</Text>
						<Text size='xs' c='dimmed'>
							{material.modname === 'page' ? 'Page' : 'File'}
							{material.visible === 0 && ' • Hidden'}
						</Text>
					</Stack>
				</Card>
			))}
		</Stack>
	);
}
