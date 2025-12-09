'use client';

import {
	ActionIcon,
	Box,
	Card,
	Flex,
	Group,
	Menu,
	Paper,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
	ThemeIcon,
	Tooltip,
	useMantineTheme,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import {
	IconDotsVertical,
	IconDownload,
	IconEdit,
	IconExternalLink,
	IconFile,
	IconFileText,
	IconLink,
	IconTrash,
} from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { deleteMaterial, getMaterialSection } from '../server/actions';
import PagePreviewModal from './PagePreviewModal';

type MaterialListProps = {
	courseId: number;
};

type Material = {
	id: number;
	url: string;
	name: string;
	modname: string;
	visible: number;
	instance: number;
	contents?: Array<{
		type: string;
		filename: string;
		fileurl: string;
	}>;
};

function getMaterialIcon(modname: string) {
	switch (modname) {
		case 'page':
			return IconFileText;
		case 'resource':
			return IconFile;
		case 'url':
			return IconLink;
		default:
			return IconFile;
	}
}

function MaterialCardSkeleton() {
	return (
		<Card withBorder p='lg'>
			<Stack gap='md'>
				<Skeleton height={40} width={40} radius='md' />
				<Skeleton height={16} width='80%' />
				<Skeleton height={12} width='50%' />
			</Stack>
		</Card>
	);
}

function truncateName(name: string, max = 20) {
	if (!name) return name;
	if (name.length <= max) return name;
	return `${name.slice(0, max - 3)}...`;
}

function getMaterialUrl(material: Material) {
	if (material.modname === 'url' && material.contents?.[0]?.fileurl) {
		return material.contents[0].fileurl;
	}
	return material.url;
}

export default function MaterialList({ courseId }: MaterialListProps) {
	const theme = useMantineTheme();
	const [selectedPage, setSelectedPage] = useState<Material | null>(null);

	const { data: section, isLoading } = useQuery({
		queryKey: ['material-pages', courseId],
		queryFn: () => getMaterialSection(courseId),
	});

	if (isLoading) {
		return (
			<SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing='md'>
				{[1, 2, 3, 4, 5, 6].map((i) => (
					<MaterialCardSkeleton key={i} />
				))}
			</SimpleGrid>
		);
	}

	const materials =
		section?.modules?.filter(
			(m) =>
				m.modname === 'page' || m.modname === 'resource' || m.modname === 'url'
		) || [];

	if (materials.length === 0) {
		return (
			<Paper p='xl' withBorder>
				<Stack align='center' gap='sm'>
					<IconFileText
						size={64}
						stroke={1}
						style={{ color: theme.colors.gray[5] }}
					/>
					<Text c='dimmed' size='lg' fw={500}>
						No materials yet
					</Text>
					<Text c='dimmed' size='sm' ta='center'>
						Create your first page or upload a file to get started
					</Text>
				</Stack>
			</Paper>
		);
	}

	return (
		<>
			<SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing='md'>
				{materials.map((material) => (
					<MaterialCard
						key={material.id}
						material={material}
						courseId={courseId}
						onPageClick={() => setSelectedPage(material)}
					/>
				))}
			</SimpleGrid>

			<PagePreviewModal
				page={selectedPage}
				onClose={() => setSelectedPage(null)}
			/>
		</>
	);
}

type MaterialCardProps = {
	material: Material;
	courseId: number;
	onPageClick: () => void;
};

function MaterialCard({ material, courseId, onPageClick }: MaterialCardProps) {
	const queryClient = useQueryClient();
	const Icon = getMaterialIcon(material.modname);
	const isHidden = material.visible === 0;
	const isFile = material.modname === 'resource';
	const isUrl = material.modname === 'url';
	const isPage = material.modname === 'page';

	const deleteMutation = useMutation({
		mutationFn: () => deleteMaterial(material.id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['material-pages', courseId] });
		},
	});

	function handleDelete() {
		modals.openConfirmModal({
			title: 'Delete Material',
			children: (
				<Text size='sm'>
					Are you sure you want to delete "{material.name}"? This action cannot
					be undone.
				</Text>
			),
			labels: { confirm: 'Delete', cancel: 'Cancel' },
			confirmProps: { color: 'red' },
			onConfirm: () => deleteMutation.mutate(),
		});
	}

	function handleViewInMoodle() {
		const moodleUrl = process.env.NEXT_PUBLIC_MOODLE_URL;
		const modType = isFile ? 'resource' : material.modname;
		window.open(
			`${moodleUrl}/mod/${modType}/view.php?id=${material.id}`,
			'_blank'
		);
	}

	return (
		<Card
			withBorder
			p='lg'
			style={{
				cursor: isPage ? 'pointer' : 'default',
			}}
			onClick={isPage ? onPageClick : undefined}
		>
			<Stack gap='md'>
				<Flex justify='space-between' align='flex-start'>
					<Group align='flex-start' style={{ flex: 1 }}>
						<ThemeIcon variant='default' size='xl'>
							<Icon size={16} stroke={1.5} />
						</ThemeIcon>
						<Box style={{ flex: 1, minWidth: 0 }}>
							<Text fw={500} size='sm'>
								{truncateName(material.name, 30)}
							</Text>
							<Group gap='xs'>
								<Text size='xs' c='dimmed'>
									{isPage ? 'Page' : isUrl ? 'URL' : 'File'}
								</Text>
								{isHidden && (
									<>
										<Text size='xs' c='dimmed'>
											·
										</Text>
										<Text size='xs' c='dimmed'>
											Hidden
										</Text>
									</>
								)}
							</Group>
						</Box>
					</Group>
					<Group gap={4} wrap='nowrap'>
						{(isFile || isUrl) && (
							<Tooltip label={isFile ? 'Download file' : 'Open link'}>
								<ActionIcon
									variant='subtle'
									color='gray'
									size='sm'
									component='a'
									href={getMaterialUrl(material)}
									{...(isFile
										? { download: true }
										: { target: '_blank', rel: 'noopener noreferrer' })}
									onClick={(e) => e.stopPropagation()}
								>
									{isFile ? (
										<IconDownload size={16} />
									) : (
										<IconExternalLink size={16} />
									)}
								</ActionIcon>
							</Tooltip>
						)}
						<Menu position='bottom-end' withArrow shadow='md'>
							<Menu.Target>
								<ActionIcon
									variant='subtle'
									color='gray'
									size='sm'
									onClick={(e) => e.stopPropagation()}
								>
									<IconDotsVertical size={16} />
								</ActionIcon>
							</Menu.Target>
							<Menu.Dropdown>
								<Menu.Item leftSection={<IconEdit size={14} />} disabled>
									Edit
								</Menu.Item>
								<Menu.Item
									leftSection={<IconExternalLink size={14} />}
									onClick={(e) => {
										e.stopPropagation();
										handleViewInMoodle();
									}}
								>
									View in Moodle
								</Menu.Item>
								<Menu.Divider />
								<Menu.Item
									leftSection={<IconTrash size={14} />}
									color='red'
									onClick={(e) => {
										e.stopPropagation();
										handleDelete();
									}}
								>
									Delete
								</Menu.Item>
							</Menu.Dropdown>
						</Menu>
					</Group>
				</Flex>
			</Stack>
		</Card>
	);
}
