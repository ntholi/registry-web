import { getCurrentEmployee } from '@human-resource/employees';
import { getMyMailAccounts } from '@mail/accounts/_server/actions';
import {
	Avatar,
	Badge,
	Button,
	Container,
	Divider,
	Group,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { IconArrowLeft, IconMail } from '@tabler/icons-react';
import { notFound } from 'next/navigation';
import { getPublicUrl } from '@/core/integrations/storage-utils';
import { getSession } from '@/core/platform/withPermission';
import { getRoleColor, getStatusColor } from '@/shared/lib/utils/colors';
import { toTitleCase } from '@/shared/lib/utils/utils';
import ButtonLink from '@/shared/ui/ButtonLink';
import ProfileContent from './_components/ProfileContent';

export default async function ProfilePage() {
	const [session, employee, accounts] = await Promise.all([
		getSession(),
		getCurrentEmployee(),
		getMyMailAccounts(),
	]);

	if (!session?.user) {
		return notFound();
	}

	const role = session.viewingAs?.role ?? session.user.role;
	const presetName = session.viewingAs?.presetName ?? session.user.presetName;
	const schools = employee?.employeeSchools
		.map((item) => item.school?.name)
		.filter(Boolean)
		.join(', ');
	const fullName = employee?.title
		? `${employee.title} ${employee.name}`
		: (employee?.name ?? session.user.name);
	const avatar = employee?.photoKey
		? getPublicUrl(employee.photoKey)
		: session.user.image;

	const bio = [employee?.department, employee?.position]
		.filter(Boolean)
		.join(' · ');

	return (
		<Container size='sm' py='xl'>
			<Stack gap='lg'>
				<Group gap='xl' align='flex-start' wrap='nowrap'>
					<Avatar src={avatar} size={150} radius={999} />
					<Stack gap='xs' style={{ flex: 1 }}>
						<Group gap='sm' align='center'>
							<Title order={3} fw={400}>
								{fullName}
							</Title>
							<Badge
								color={getRoleColor(role)}
								variant='light'
								radius='sm'
								size='sm'
							>
								{toTitleCase(role)}
							</Badge>
							{employee?.status && (
								<Badge
									variant='light'
									radius='sm'
									size='sm'
									color={getStatusColor(employee.status)}
								>
									{employee.status}
								</Badge>
							)}
						</Group>
						<Text size='sm' c='dimmed'>
							{session.user.email}
						</Text>
						{bio && (
							<Text size='sm' fw={500}>
								{bio}
							</Text>
						)}
						{presetName && (
							<Text size='xs' c='dimmed'>
								{presetName}
							</Text>
						)}
						<Group gap='xs' mt='xs'>
							<Button
								component='a'
								href='/api/auth/gmail?returnUrl=/profile'
								size='xs'
								variant='filled'
								leftSection={<IconMail size='0.875rem' />}
							>
								Connect Email
							</Button>
							<ButtonLink
								href='/dashboard'
								size='xs'
								variant='default'
								leftSection={<IconArrowLeft size='0.875rem' />}
							>
								Dashboard
							</ButtonLink>
						</Group>
					</Stack>
				</Group>

				<Divider />

				<ProfileContent
					accounts={accounts}
					user={{
						id: session.user.id,
						name: session.user.name,
						email: session.user.email,
						role,
						presetName,
					}}
					employee={
						employee
							? {
									empNo: employee.empNo,
									department: employee.department,
									position: employee.position,
									status: employee.status,
									schools: schools ?? '',
								}
							: null
					}
				/>
			</Stack>
		</Container>
	);
}
