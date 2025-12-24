'use client';

import {
	Accordion,
	Badge,
	Center,
	Group,
	Loader,
	Paper,
	Table,
	Text,
} from '@mantine/core';
import { getStatusColor } from '@student-portal/utils';
import { useQuery } from '@tanstack/react-query';
import { formatDateTime } from '@/shared/lib/utils/utils';
import Link from '@/shared/ui/Link';
import { getGraduationClearanceHistoryByStudentNo } from '../_server/clearance/actions';

type Props = {
	stdNo: number;
};

export default function GraduationClearanceHistory({ stdNo }: Props) {
	const { data: history, isLoading } = useQuery({
		queryKey: ['graduation-clearance-history', stdNo],
		queryFn: () => getGraduationClearanceHistoryByStudentNo(stdNo),
	});

	if (isLoading) {
		return (
			<Center pt='xl'>
				<Loader size='md' variant='dots' />
			</Center>
		);
	}

	if (!history?.length) {
		return (
			<Center pt='xl'>
				<Text c='dimmed' size='sm'>
					No history found
				</Text>
			</Center>
		);
	}

	return (
		<Paper radius='md' p={'lg'}>
			<Accordion variant='separated'>
				{history.map((clearance) => (
					<Accordion.Item key={clearance.id} value={clearance.id.toString()}>
						<Accordion.Control>
							<Group justify='space-between' pe={'md'}>
								<Text fw={500}>Graduation Request</Text>
								<Badge
									color={getStatusColor(clearance.status)}
									variant='outline'
									size='sm'
								>
									{clearance.status}
								</Badge>
							</Group>
						</Accordion.Control>
						<Accordion.Panel>
							<Table striped highlightOnHover withTableBorder>
								<Table.Thead>
									<Table.Tr>
										<Table.Th>
											<Group gap='xs'>Date</Group>
										</Table.Th>
										<Table.Th>
											<Group gap='xs'>Status</Group>
										</Table.Th>
										<Table.Th>
											<Group gap='xs'>Message</Group>
										</Table.Th>
										<Table.Th>
											<Group gap='xs'>Updated By</Group>
										</Table.Th>
									</Table.Tr>
								</Table.Thead>
								<Table.Tbody>
									{clearance.audits.map(
										(audit: {
											id: number;
											date: Date;
											newStatus: string;
											message: string | null;
											createdBy: string;
											user: { name: string | null };
										}) => (
											<Table.Tr key={audit.id}>
												<Table.Td>{formatDateTime(audit.date)}</Table.Td>
												<Table.Td>{audit.newStatus}</Table.Td>
												<Table.Td>{audit.message || '-'}</Table.Td>
												<Table.Td>
													<Link
														size='sm'
														href={`/admin/users/${audit.createdBy}`}
													>
														{audit.user.name || 'Unknown User'}
													</Link>
												</Table.Td>
											</Table.Tr>
										)
									)}
								</Table.Tbody>
							</Table>
						</Accordion.Panel>
					</Accordion.Item>
				))}
			</Accordion>
		</Paper>
	);
}
