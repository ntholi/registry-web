'use client';

import { Accordion, Badge, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import { getStatusColor, getStatusIcon } from '@student-portal/utils';
import type { DashboardUser } from '@/core/database';
import { formatDateTime, toTitleCase } from '@/shared/lib/utils/utils';
import Link from '@/shared/ui/Link';
import type { getRegistrationRequest } from '../server/requests/actions';

interface Props {
	value: NonNullable<Awaited<ReturnType<typeof getRegistrationRequest>>>;
	defaultDept?: DashboardUser;
}

const departments: DashboardUser[] = ['finance', 'library'];

export default function ClearanceAccordion({ value, defaultDept }: Props) {
	return (
		<Accordion variant='separated' defaultValue={defaultDept}>
			{departments.map((dept) => {
				const clearanceMapping = value.clearances?.find(
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
										<Link
											size='sm'
											href={`/admin/users/${clearance.respondedBy.id}`}
										>
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
