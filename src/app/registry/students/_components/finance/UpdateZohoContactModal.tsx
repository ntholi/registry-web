'use client';

import {
	fetchZohoContactComparison,
	updateZohoContactFromDb,
} from '@finance/_lib/zoho-books/actions';
import type { ZohoContactComparisonField } from '@finance/_lib/zoho-books/types';
import {
	ActionIcon,
	Badge,
	Button,
	Group,
	HoverCard,
	Loader,
	Modal,
	Stack,
	Table,
	Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconUpload } from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useActionMutation } from '@/shared/lib/actions/use-action-mutation';

type Props = {
	stdNo: number;
	contactId: string;
};

export function UpdateZohoContactModal({ stdNo, contactId }: Props) {
	const [opened, { open, close }] = useDisclosure(false);
	const queryClient = useQueryClient();

	const { data, isLoading, isError, error } = useQuery({
		queryKey: ['zoho-contact-comparison', stdNo, contactId],
		queryFn: () => fetchZohoContactComparison(stdNo, contactId),
		enabled: opened,
	});

	const { mutate, isPending } = useActionMutation(
		() => updateZohoContactFromDb({ stdNo, contactId }),
		{
			onSuccess: () => {
				notifications.show({
					title: 'Contact Updated',
					message: 'Zoho contact has been updated with latest student details.',
					color: 'teal',
				});
				queryClient.invalidateQueries({
					queryKey: ['zoho-contact-comparison', stdNo, contactId],
				});
				queryClient.invalidateQueries({
					queryKey: ['student-finance', contactId],
				});
				close();
			},
			onError: (err) => {
				notifications.show({
					title: 'Update Failed',
					message:
						err instanceof Error ? err.message : 'Failed to update contact.',
					color: 'red',
				});
			},
		}
	);

	return (
		<>
			<HoverCard position='bottom' withArrow>
				<HoverCard.Target>
					<ActionIcon variant='light' size='lg' color='grape' onClick={open}>
						<IconUpload size={18} />
					</ActionIcon>
				</HoverCard.Target>
				<HoverCard.Dropdown p='xs'>
					<Text size='xs'>Sync with Zoho</Text>
				</HoverCard.Dropdown>
			</HoverCard>
			<Modal
				opened={opened}
				onClose={close}
				title='Update Zoho Contact'
				size='lg'
			>
				{isLoading && (
					<Stack align='center' py='xl'>
						<Loader size='sm' />
						<Text size='sm' c='dimmed'>
							Comparing data...
						</Text>
					</Stack>
				)}
				{isError && (
					<Text size='sm' c='red'>
						{error instanceof Error
							? error.message
							: 'Failed to load comparison.'}
					</Text>
				)}
				{data && (
					<Stack>
						{!data.hasChanges ? (
							<Text size='sm' c='dimmed' ta='center' py='md'>
								Zoho contact is already up to date with the database.
							</Text>
						) : (
							<>
								<ComparisonTable fields={data.fields} />
								<Group justify='flex-end'>
									<Button variant='default' onClick={close}>
										Cancel
									</Button>
									<Button
										loading={isPending}
										onClick={() => mutate()}
										color='blue'
									>
										Update Zoho Contact
									</Button>
								</Group>
							</>
						)}
					</Stack>
				)}
			</Modal>
		</>
	);
}

type ComparisonTableProps = {
	fields: ZohoContactComparisonField[];
};

function ComparisonTable({ fields }: ComparisonTableProps) {
	const changedFields = fields.filter((f) => f.changed);
	const unchangedFields = fields.filter((f) => !f.changed);

	return (
		<Table striped highlightOnHover>
			<Table.Thead>
				<Table.Tr>
					<Table.Th>Field</Table.Th>
					<Table.Th>Current (Zoho)</Table.Th>
					<Table.Th>New (Database)</Table.Th>
					<Table.Th w={70}>Status</Table.Th>
				</Table.Tr>
			</Table.Thead>
			<Table.Tbody>
				{changedFields.map((field) => (
					<Table.Tr key={field.label}>
						<Table.Td fw={500}>{field.label}</Table.Td>
						<Table.Td>
							<Text size='sm' c='dimmed'>
								{field.zohoValue || '—'}
							</Text>
						</Table.Td>
						<Table.Td>
							<Text size='sm' fw={500}>
								{field.dbValue || '—'}
							</Text>
						</Table.Td>
						<Table.Td>
							<Badge size='xs' color='yellow' variant='light'>
								Changed
							</Badge>
						</Table.Td>
					</Table.Tr>
				))}
				{unchangedFields.map((field) => (
					<Table.Tr key={field.label}>
						<Table.Td fw={500}>{field.label}</Table.Td>
						<Table.Td>
							<Text size='sm' c='dimmed'>
								{field.zohoValue || '—'}
							</Text>
						</Table.Td>
						<Table.Td>
							<Text size='sm' c='dimmed'>
								{field.dbValue || '—'}
							</Text>
						</Table.Td>
						<Table.Td>
							<Badge size='xs' color='teal' variant='light'>
								Match
							</Badge>
						</Table.Td>
					</Table.Tr>
				))}
			</Table.Tbody>
		</Table>
	);
}
