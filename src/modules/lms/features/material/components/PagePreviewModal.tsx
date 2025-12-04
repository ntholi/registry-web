'use client';

import {
	ActionIcon,
	Box,
	Group,
	Loader,
	Modal,
	Text,
	useComputedColorScheme,
	useMantineTheme,
} from '@mantine/core';
import { IconExternalLink } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { getMaterialContent } from '../server/actions';

type Page = {
	id: number;
	url: string;
	name: string;
	instance: number;
};

type PagePreviewModalProps = {
	page: Page | null;
	onClose: () => void;
};

function PageContent({ page }: { page: Page }) {
	const theme = useMantineTheme();
	const colorScheme = useComputedColorScheme('dark');

	const { data, isLoading } = useQuery({
		queryKey: ['page-content', page.id],
		queryFn: () => getMaterialContent(page.id, 'page', page.instance),
	});

	if (isLoading) {
		return (
			<Box py='xl' ta='center'>
				<Loader size='md' />
			</Box>
		);
	}

	return (
		<Box
			p='md'
			style={{
				maxHeight: '70vh',
				overflowY: 'auto',
				backgroundColor:
					colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[0],
				borderRadius: theme.radius.md,
			}}
		>
			<div
				dangerouslySetInnerHTML={{
					__html: data?.content || 'Content not available',
				}}
			/>
		</Box>
	);
}

export default function PagePreviewModal({
	page,
	onClose,
}: PagePreviewModalProps) {
	return (
		<Modal
			opened={page !== null}
			onClose={onClose}
			size='xl'
			title={
				<Group gap='sm'>
					<Text fw={600} size='lg'>
						{page?.name}
					</Text>
					{page && (
						<ActionIcon
							variant='subtle'
							color='gray'
							component='a'
							href={page.url}
							target='_blank'
							rel='noopener noreferrer'
							onClick={(e) => e.stopPropagation()}
						>
							<IconExternalLink size={18} />
						</ActionIcon>
					)}
				</Group>
			}
			padding='md'
		>
			{page && <PageContent page={page} />}
		</Modal>
	);
}
