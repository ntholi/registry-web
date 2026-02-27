'use client';

import {
	Badge,
	Card,
	Grid,
	Group,
	Paper,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { getStatusColor } from '@/shared/lib/utils/colors';
import InfoItem from '@/shared/ui/InfoItem';
import Link from '@/shared/ui/Link';
import type { getEmployee } from '../../_server/actions';
import PhotoView from './PhotoView';

type Props = {
	employee: NonNullable<Awaited<ReturnType<typeof getEmployee>>>;
};

export default function EmployeeView({ employee }: Props) {
	const schoolNames = employee.employeeSchools
		?.map((es) => es.school?.name)
		.filter(Boolean)
		.join(', ');

	return (
		<Stack gap='xl'>
			<Group gap='xs' align='stretch'>
				<PhotoView employee={employee} />
				<Card withBorder flex={1} p='md' h={76}>
					<Group wrap='nowrap' gap='xs'>
						<div style={{ flex: 1 }}>
							<Text size='sm' c='dimmed'>
								User
							</Text>
							{employee.user ? (
								<Link
									href={`/admin/users/${employee.user.id}`}
									size='sm'
									fw={500}
								>
									{employee.user.name}
								</Link>
							) : (
								<Text size='sm' c='dimmed' fs='italic'>
									Not linked
								</Text>
							)}
						</div>
					</Group>
				</Card>
			</Group>

			<div>
				<Group justify='space-between' mb='xs'>
					<Title order={4} fw={100}>
						Employee
					</Title>
					<Badge
						radius='sm'
						color={getStatusColor(employee.status)}
						variant='light'
					>
						{employee.status}
					</Badge>
				</Group>
				<Paper p='md' radius='md' withBorder>
					<Grid gutter='xl'>
						<Grid.Col span={{ base: 12, sm: 6 }}>
							<InfoItem
								label='Employee Number'
								value={employee.empNo}
								copyable
							/>
						</Grid.Col>
						<Grid.Col span={{ base: 12, sm: 6 }}>
							<InfoItem label='Full Name' value={employee.name} copyable />
						</Grid.Col>
						<Grid.Col span={{ base: 12, sm: 6 }}>
							<InfoItem label='Type' value={employee.type} />
						</Grid.Col>
						<Grid.Col span={{ base: 12, sm: 6 }}>
							<InfoItem
								label='Department'
								value={employee.department ?? 'N/A'}
							/>
						</Grid.Col>
						<Grid.Col span={{ base: 12, sm: 6 }}>
							<InfoItem label='Position' value={employee.position ?? 'N/A'} />
						</Grid.Col>
						{employee.department === 'Academic' && (
							<Grid.Col span={{ base: 12, sm: 6 }}>
								<InfoItem label='Schools' value={schoolNames || 'N/A'} />
							</Grid.Col>
						)}
					</Grid>
				</Paper>
			</div>
		</Stack>
	);
}
