'use client';

import {
	ActionIcon,
	Badge,
	Card,
	Grid,
	Group,
	NavLink,
	Paper,
	ScrollArea,
	Stack,
	Text,
	TextInput,
	Title,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import type { letterTemplates } from '@registry/_database';
import { IconArrowLeft, IconSearch, IconUser } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import LetterPreview from '../../_components/LetterPreview';
import { getLetter, getLettersByTemplate } from '../../_server/actions';

type LetterTemplate = NonNullable<typeof letterTemplates.$inferSelect>;

type Props = {
	template: LetterTemplate;
};

export default function TemplateDetail({ template }: Props) {
	const [search, setSearch] = useState('');
	const [debounced] = useDebouncedValue(search, 300);
	const [selectedLetterId, setSelectedLetterId] = useState<string | null>(null);
	const router = useRouter();

	const { data: lettersData } = useQuery({
		queryKey: ['template-letters', template.id, debounced],
		queryFn: () => getLettersByTemplate(template.id, 1, debounced),
	});

	const { data: selectedLetter } = useQuery({
		queryKey: ['letter-detail', selectedLetterId],
		queryFn: () => getLetter(selectedLetterId!),
		enabled: !!selectedLetterId,
	});

	const previewHtml = selectedLetter?.content ?? template.content;

	return (
		<Stack p='lg'>
			<Stack gap={4}>
				<Group>
					<ActionIcon
						variant='subtle'
						color='gray'
						onClick={() => router.push('/registry/letters/templates')}
					>
						<IconArrowLeft size={18} />
					</ActionIcon>
					<Title order={2}>{template.name}</Title>
				</Group>
				<Group ml={42} gap='xs'>
					{template.role ? (
						<Badge variant='light' size='sm'>
							{template.role.replace(/_/g, ' ')}
						</Badge>
					) : (
						<Badge variant='light' color='gray' size='sm'>
							System-wide
						</Badge>
					)}
					<Badge
						variant='dot'
						color={template.isActive ? 'green' : 'red'}
						size='sm'
					>
						{template.isActive ? 'Active' : 'Inactive'}
					</Badge>
				</Group>
			</Stack>

			<Grid>
				<Grid.Col span={8}>
					<Card withBorder p='md'>
						<Text fw={600} size='sm' mb='xs'>
							{selectedLetter
								? `Letter — ${selectedLetter.serialNumber}`
								: 'Template Preview'}
						</Text>
						<LetterPreview content={previewHtml} />
					</Card>
				</Grid.Col>

				<Grid.Col span={4}>
					<Paper withBorder p='md' h='100%'>
						<Text fw={600} size='sm' mb='xs'>
							Printed Letters ({lettersData?.totalItems ?? 0})
						</Text>
						<TextInput
							placeholder='Search students...'
							leftSection={<IconSearch size={14} />}
							size='xs'
							mb='sm'
							value={search}
							onChange={(e) => setSearch(e.currentTarget.value)}
						/>
						<ScrollArea h='calc(100vh - 320px)'>
							<Stack gap={0}>
								{lettersData?.items?.map((letter) => (
									<NavLink
										key={letter.id}
										label={letter.student?.name ?? 'Unknown'}
										description={String(letter.student?.stdNo ?? '')}
										leftSection={<IconUser size={16} />}
										active={selectedLetterId === letter.id}
										onClick={() => setSelectedLetterId(letter.id)}
									/>
								))}
								{lettersData?.items?.length === 0 && (
									<Text size='sm' c='dimmed' ta='center' py='md'>
										No letters printed with this template
									</Text>
								)}
							</Stack>
						</ScrollArea>
					</Paper>
				</Grid.Col>
			</Grid>
		</Stack>
	);
}
