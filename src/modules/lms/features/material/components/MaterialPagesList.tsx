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

	const pages = section?.modules?.filter((m) => m.modname === 'page') || [];

	if (pages.length === 0) {
		return (
			<Paper p='xl' withBorder>
				<Stack align='center' gap='xs'>
					<IconFileText size={48} stroke={1.5} color={theme.colors.gray[4]} />
					<Text c='dimmed' size='lg'>
						No pages yet
					</Text>
					<Text c='dimmed' size='sm'>
						Create your first page to get started
					</Text>
				</Stack>
			</Paper>
		);
	}

	return (
		<Stack gap='md'>
			{pages.map((page) => (
				<Card
					key={page.id}
					withBorder
					shadow='xs'
					padding='lg'
					component='a'
					href={page.url}
					target='_blank'
					rel='noopener noreferrer'
					style={{ cursor: 'pointer', textDecoration: 'none' }}
				>
					<Stack gap='xs'>
						<Text fw={500} size='md'>
							{page.name}
						</Text>
						{page.visible === 0 && (
							<Text size='xs' c='dimmed'>
								Hidden
							</Text>
						)}
					</Stack>
				</Card>
			))}
		</Stack>
	);
}
