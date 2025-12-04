'use client';

import {
	ActionIcon,
	Box,
	Card,
	Flex,
	Group,
	Paper,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
	ThemeIcon,
	useMantineTheme,
} from '@mantine/core';
import {
	IconDownload,
	IconExternalLink,
	IconFile,
	IconFileText,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getMaterialSection } from '../server/actions';
import MaterialPreviewModal from './MaterialPreviewModal';

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
};

function getMaterialIcon(modname: string) {
	switch (modname) {
		case 'page':
			return IconFileText;
		case 'resource':
			return IconFile;
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

export default function MaterialList({ courseId }: MaterialListProps) {
	const theme = useMantineTheme();
	const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(
		null
	);

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
			(m) => m.modname === 'page' || m.modname === 'resource'
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
				{materials.map((material) => {
					const Icon = getMaterialIcon(material.modname);
					const isHidden = material.visible === 0;
					const isFile = material.modname === 'resource';

					return (
						<Card
							key={material.id}
							withBorder
							p='lg'
							style={{
								cursor: isFile ? 'default' : 'pointer',
							}}
							onClick={isFile ? undefined : () => setSelectedMaterial(material)}
						>
							<Stack gap='md'>
								<Flex justify='space-between' align='flex-start'>
									<Group align='flex-start'>
										<ThemeIcon variant='default' size={'xl'}>
											<Icon size={16} stroke={1.5} />
										</ThemeIcon>
										<Box>
											<Text fw={500} size='sm'>
												{material.name}
											</Text>
											<Group gap='xs'>
												<Text size='xs' c='dimmed'>
													{material.modname === 'page' ? 'Page' : 'File'}
												</Text>
												{isHidden && (
													<>
														<Text size='xs' c='dimmed'>
															•
														</Text>
														<Text size='xs' c='dimmed'>
															Hidden
														</Text>
													</>
												)}
											</Group>
										</Box>
									</Group>
									<ActionIcon
										variant='subtle'
										color='gray'
										size='md'
										component='a'
										href={material.url}
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
								</Flex>
							</Stack>
						</Card>
					);
				})}
			</SimpleGrid>

			<MaterialPreviewModal
				material={selectedMaterial}
				onClose={() => setSelectedMaterial(null)}
			/>
		</>
	);
}
