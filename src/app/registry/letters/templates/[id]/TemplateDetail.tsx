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
	Switch,
	Table,
	Tabs,
	Text,
	TextInput,
	Title,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import type { letterTemplates } from '@registry/_database';
import {
	IconArrowLeft,
	IconEdit,
	IconSearch,
	IconUser,
} from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useActionMutation } from '@/shared/lib/actions/use-action-mutation';
import { DeleteButton } from '@/shared/ui/adease';
import LetterPreview from '../../_components/LetterPreview';
import {
	formatRestrictionValues,
	RESTRICTION_META,
	type Restriction,
} from '../../_lib/restrictions';
import {
	deleteLetterTemplate,
	getLetter,
	getLettersByTemplate,
	toggleTemplateActive,
} from '../../_server/actions';

type LetterTemplate = NonNullable<typeof letterTemplates.$inferSelect>;

type Props = {
	template: LetterTemplate;
};

export default function TemplateDetail({ template }: Props) {
	const [search, setSearch] = useState('');
	const [debounced] = useDebouncedValue(search, 300);
	const [selectedLetterId, setSelectedLetterId] = useState<string | null>(null);
	const router = useRouter();
	const queryClient = useQueryClient();

	const toggleMutation = useActionMutation(toggleTemplateActive, {
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['letter-templates'] });
			notifications.show({
				message: `Template ${template.isActive ? 'deactivated' : 'activated'}`,
				color: 'green',
			});
		},
	});

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
					</Group>
				</Stack>
				<Stack gap={1}>
					<Switch
						offLabel={'Inactive'}
						onLabel={'Active'}
						size='lg'
						styles={{
							trackLabel: {
								width: '50px',
								padding: '0 4px',
							},
						}}
						checked={template.isActive}
						onChange={() => toggleMutation.mutate(template.id)}
						disabled={toggleMutation.isPending}
						color='green'
					/>
					<Group gap='sm'>
						<ActionIcon
							variant='subtle'
							color='blue'
							onClick={() =>
								router.push(`/registry/letters/templates/${template.id}/edit`)
							}
						>
							<IconEdit size={18} />
						</ActionIcon>
						<DeleteButton
							handleDelete={() => deleteLetterTemplate(template.id)}
							queryKey={['letter-templates']}
							itemName={template.name}
							itemType='template'
							variant='subtle'
						/>
					</Group>
				</Stack>
			</Group>

			<Grid>
				<Grid.Col span={8}>
					<Tabs defaultValue='preview'>
						<Tabs.List mb='md'>
							<Tabs.Tab value='preview'>
								{selectedLetter
									? `Letter — ${selectedLetter.serialNumber}`
									: 'Template Preview'}
							</Tabs.Tab>
							<Tabs.Tab value='restrictions'>
								Restrictions
								{(template.restrictions as Restriction[] | null)?.length ? (
									<Badge size='xs' ml={6} circle>
										{(template.restrictions as Restriction[]).length}
									</Badge>
								) : null}
							</Tabs.Tab>
						</Tabs.List>

						<Tabs.Panel value='preview'>
							<Card withBorder p='md'>
								<LetterPreview content={previewHtml} />
							</Card>
						</Tabs.Panel>

						<Tabs.Panel value='restrictions'>
							<RestrictionsView
								restrictions={
									(template.restrictions as Restriction[] | null) ?? []
								}
							/>
						</Tabs.Panel>
					</Tabs>
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

type RestrictionsViewProps = {
	restrictions: Restriction[];
};

function RestrictionsView({ restrictions }: RestrictionsViewProps) {
	if (restrictions.length === 0) {
		return (
			<Text size='sm' c='dimmed' py='md'>
				No restrictions — this template is available to all students.
			</Text>
		);
	}

	return (
		<Table striped highlightOnHover withTableBorder>
			<Table.Thead>
				<Table.Tr>
					<Table.Th>Type</Table.Th>
					<Table.Th>Operator</Table.Th>
					<Table.Th>Values</Table.Th>
				</Table.Tr>
			</Table.Thead>
			<Table.Tbody>
				{restrictions.map((r, idx) => (
					<Table.Tr key={`${r.type}-${idx}`}>
						<Table.Td>
							<Badge variant='light' size='sm'>
								{RESTRICTION_META[r.type].label}
							</Badge>
						</Table.Td>
						<Table.Td>
							<Badge
								variant='outline'
								size='sm'
								color={r.operator === 'include' ? 'green' : 'red'}
							>
								{r.operator === 'include' ? 'Include' : 'Exclude'}
							</Badge>
						</Table.Td>
						<Table.Td>
							<Text size='sm'>{formatRestrictionValues(r)}</Text>
						</Table.Td>
					</Table.Tr>
				))}
			</Table.Tbody>
		</Table>
	);
}
