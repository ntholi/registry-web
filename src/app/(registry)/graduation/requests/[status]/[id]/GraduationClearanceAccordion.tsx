'use client';

import { Accordion, Badge, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import {
	IconCheck,
	IconClock,
	IconExclamationCircle,
} from '@tabler/icons-react';
import Link from '@/shared/components/Link';
import type { DashboardUser } from '@/db/schema';
import { formatDateTime, toTitleCase } from '@/lib/utils/utils';
import type { getGraduationRequest } from '@/server/registry/graduation/requests/actions';

interface Props {
	value: NonNullable<Awaited<ReturnType<typeof getGraduationRequest>>>;
	defaultDept?: DashboardUser;
}

type Status = 'pending' | 'approved' | 'rejected';

const departments: DashboardUser[] = ['finance', 'library', 'academic'];

export default function GraduationClearanceAccordion({
	value,
	defaultDept,
}: Props) {
	return (
		<Accordion variant='separated' defaultValue={defaultDept}>
			{departments.map((dept) => {
				const clearanceMapping = value.graduationClearances?.find(
					(c) => c.clearance.department === dept
				);
				const clearance = clearanceMapping?.clearance;
				const status = clearance?.status || 'pending';
				return (
					<Accordion.Item key={dept} value={dept}>
						<Accordion.Control>
							<Group justify='space-between'>
								<Group>
									<ThemeIcon
										color={getStatusColor(status)}
										variant='light'
										size='lg'
									>
										{getStatusIcon(status)}
									</ThemeIcon>
									<Text fw={500}>{toTitleCase(dept)}</Text>
								</Group>
							</Group>
						</Accordion.Control>
						<Accordion.Panel>
							<Stack gap='sm'>
								<Group>
									<Text c='dimmed' size='sm' w={120}>
										Status:
									</Text>
									<Badge
										size='sm'
										color={getStatusColor(status)}
										variant='light'
									>
										{toTitleCase(status)}
									</Badge>
								</Group>
								<Group>
									<Text c='dimmed' size='sm' w={120}>
										Response Date:
									</Text>
									<Text size='sm'>
										{clearance?.responseDate
											? formatDateTime(clearance.responseDate)
											: '-'}
									</Text>
								</Group>
								<Group>
									<Text c='dimmed' size='sm' w={120}>
										Responded By:
									</Text>
									{clearance?.respondedBy ? (
										<Link size='sm' href={`/users/${clearance.respondedBy.id}`}>
											{clearance.respondedBy.name ||
												clearance.respondedBy.email ||
												`User: ${clearance.respondedBy.id}`}
										</Link>
									) : (
										<Text size='sm'>{'-'}</Text>
									)}
								</Group>
								<Group align='flex-start'>
									<Text c='dimmed' size='sm' w={120}>
										Message:
									</Text>
									<Text size='sm'>{clearance?.message || '-'}</Text>
								</Group>
							</Stack>
						</Accordion.Panel>
					</Accordion.Item>
				);
			})}
		</Accordion>
	);
}

const getStatusColor = (status: Status) => {
	switch (status) {
		case 'approved':
			return 'green';
		case 'rejected':
			return 'red';
		default:
			return 'yellow';
	}
};

const getStatusIcon = (status: Status) => {
	switch (status) {
		case 'approved':
			return <IconCheck size='1rem' />;
		case 'rejected':
			return <IconExclamationCircle size='1rem' />;
		default:
			return <IconClock size='1rem' />;
	}
};
