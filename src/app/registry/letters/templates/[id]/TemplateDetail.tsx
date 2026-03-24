'use client';

import {
	Badge,
	Card,
	Grid,
	Group,
	NavLink,
	ScrollArea,
	Stack,
	Text,
	TextInput,
	Title,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import type { letterTemplates } from '@registry/_database';
import { IconSearch, IconUser } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { RichTextContent } from '@/shared/ui/adease';
import { getLetter, getLettersByTemplate } from '../../_server/actions';

type LetterTemplate = NonNullable<typeof letterTemplates.$inferSelect>;

type Props = {
	template: LetterTemplate;
};

export default function TemplateDetail({ template }: Props) {
	const [search, setSearch] = useState('');
	const [debounced] = useDebouncedValue(search, 300);
	const [selectedLetterId, setSelectedLetterId] = useState<string | null>(null);

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
			<Group justify='space-between'>
				<Group>
					<Title order={2}>{template.name}</Title>
					{template.role ? (
						<Badge variant='light'>{template.role.replace(/_/g, ' ')}</Badge>
					) : (
						<Badge variant='light' color='gray'>
							System-wide
						</Badge>
					)}
					<Badge variant='dot' color={template.isActive ? 'green' : 'red'}>
						{template.isActive ? 'Active' : 'Inactive'}
					</Badge>
				</Group>
			</Group>

			<Grid>
				<Grid.Col span={8}>
					<Card withBorder p='md'>
						<Text fw={600} size='sm' mb='xs'>
							{selectedLetter
								? `Letter — ${selectedLetter.serialNumber}`
								: 'Template Preview'}
						</Text>
						<RichTextContent html={previewHtml} />
					</Card>
				</Grid.Col>

				<Grid.Col span={4}>
					<Card withBorder p='md' h='100%'>
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
					</Card>
				</Grid.Col>
			</Grid>
		</Stack>
	);
}
