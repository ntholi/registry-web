'use client';

import { Badge, Flex, Stack, Table, Text, Title } from '@mantine/core';
import Link from '@/components/Link';
import type { getRegistrationRequest } from '@/server/registration/requests/actions';

type Props = {
	value: NonNullable<Awaited<ReturnType<typeof getRegistrationRequest>>>;
};

export default function ModulesView({ value }: Props) {
	const { requestedModules } = value;

	const rows = requestedModules.map(
		({ semesterModule, moduleStatus, status }) => (
			<Table.Tr key={semesterModule.id}>
				<Table.Td fw={500}>
					<Link
						size='sm'
						href={`/dashboard/semester-modules/${semesterModule.id}`}
					>
						{semesterModule.module!.code}
					</Link>
				</Table.Td>
				<Table.Td>{semesterModule.module!.name}</Table.Td>
				<Table.Td>{semesterModule.credits}</Table.Td>
				<Table.Td c={moduleStatus.startsWith('Repeat') ? 'red' : undefined}>
					{moduleStatus}
				</Table.Td>
				<Table.Td>
					<Badge
						variant='light'
						size='sm'
						color={
							status === 'registered'
								? 'green'
								: status === 'rejected'
									? 'red'
									: 'gray'
						}
					>
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
		</Stack>
	);
}
