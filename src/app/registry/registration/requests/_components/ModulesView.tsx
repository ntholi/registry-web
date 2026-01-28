'use client';

import {
	Badge,
	Card,
	Flex,
	Group,
	SimpleGrid,
	Stack,
	Table,
	Text,
	Title,
} from '@mantine/core';
import {
	getModuleStatusTextColor,
	getStatusColor,
} from '@/shared/lib/utils/colors';
import Link from '@/shared/ui/Link';
import type { getRegistrationRequest } from '../_server/requests/actions';

type Props = {
	value: NonNullable<Awaited<ReturnType<typeof getRegistrationRequest>>>;
};

export default function ModulesView({ value }: Props) {
	const { requestedModules, registrationRequestReceipts } = value;

	const rows = requestedModules.map(
		({ semesterModule, moduleStatus, status }) => (
			<Table.Tr key={semesterModule.id}>
				<Table.Td fw={500}>
					<Link
						size='sm'
						href={`/academic/semester-modules/${semesterModule.id}`}
					>
						{semesterModule.module!.code}
					</Link>
				</Table.Td>
				<Table.Td>{semesterModule.module!.name}</Table.Td>
				<Table.Td>{semesterModule.credits}</Table.Td>
				<Table.Td c={getModuleStatusTextColor(moduleStatus)}>
					{moduleStatus}
				</Table.Td>
				<Table.Td>
					<Badge variant='light' size='sm' color={getStatusColor(status)}>
						{status}
					</Badge>
				</Table.Td>
			</Table.Tr>
		)
	);

	return (
		<Stack>
			<Flex justify='space-between' align='center'>
				<Title order={4}>Modules</Title>
				<Text c='dimmed' size='sm'>
					{requestedModules.length}{' '}
					{requestedModules.length === 1 ? 'Module' : 'Modules'}
				</Text>
			</Flex>

			<Table highlightOnHover withTableBorder>
				<Table.Thead>
					<Table.Tr>
						<Table.Th>Module Code</Table.Th>
						<Table.Th>Name</Table.Th>
						<Table.Th>Credits</Table.Th>
						<Table.Th>Type</Table.Th>
						<Table.Th>Status</Table.Th>
					</Table.Tr>
				</Table.Thead>
				<Table.Tbody>{rows}</Table.Tbody>
			</Table>

			{registrationRequestReceipts &&
				registrationRequestReceipts.length > 0 && (
					<Stack gap='sm' mt={'md'}>
						<Title order={5} fw={400}>
							Payment Receipts
						</Title>
						<SimpleGrid cols={{ base: 2, sm: 4 }} spacing='sm'>
							{registrationRequestReceipts.map(({ receipt }) => (
								<Card key={receipt.id} withBorder padding='sm'>
									<Group justify='space-between'>
										<Text size='sm' fw={500}>
											{receipt.receiptNo}
										</Text>
										<Badge size='xs' variant='light'>
											{receipt.receiptType}
										</Badge>
									</Group>
								</Card>
							))}
						</SimpleGrid>
					</Stack>
				)}
		</Stack>
	);
}
