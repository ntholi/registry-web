import { getCurrentEmployee } from '@human-resource/employees';
import {
	Alert,
	Avatar,
	Badge,
	Card,
	Container,
	Divider,
	Group,
	Paper,
	SimpleGrid,
	Stack,
	Text,
	ThemeIcon,
	Title,
} from '@mantine/core';
import {
	IconAlertCircle,
	IconArrowLeft,
	IconBriefcase,
	IconBuilding,
	IconIdBadge2,
	IconMail,
	IconShieldCheck,
	IconSwitchHorizontal,
	IconUserCircle,
} from '@tabler/icons-react';
import { notFound } from 'next/navigation';
import { getPublicUrl } from '@/core/integrations/storage-utils';
import { getSession } from '@/core/platform/withPermission';
import { getRoleColor, getStatusColor } from '@/shared/lib/utils/colors';
import { formatDateTime } from '@/shared/lib/utils/dates';
import { toTitleCase } from '@/shared/lib/utils/utils';
import { DetailsView } from '@/shared/ui/adease';
import ButtonLink from '@/shared/ui/ButtonLink';
import InfoItem from '@/shared/ui/InfoItem';

export default async function ProfilePage() {
	const [session, employee] = await Promise.all([
		getSession(),
		getCurrentEmployee(),
	]);

	if (!session?.user) {
		return notFound();
	}

	const role = session.viewingAs?.role ?? session.user.role;
	const presetName = session.viewingAs?.presetName ?? session.user.presetName;
	const permissions =
		session.viewingAs?.permissions ?? session.permissions ?? [];
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

	return (
		<DetailsView>
			<Container size='xl' px={0}>
				<Stack gap='xl'>
					<Paper withBorder p={{ base: 'lg', md: 'xl' }}>
						<Stack gap='lg'>
							<Group justify='space-between' align='flex-start'>
								<Stack gap='xs'>
									<ButtonLink
										href='/dashboard'
										variant='subtle'
										leftSection={<IconArrowLeft size='1rem' />}
										px={0}
									>
										Back to Dashboard
									</ButtonLink>
									<Group gap='lg' align='center'>
										<Avatar src={avatar} size={88} />
										<Stack gap={6}>
											<Title order={2} fw={100}>
												{fullName}
											</Title>
											<Group gap='xs'>
												<Badge
													color={getRoleColor(role)}
													variant='light'
													radius='sm'
												>
													{toTitleCase(role)}
												</Badge>
												{presetName && (
													<Badge variant='light' radius='sm' color='teal'>
														{presetName}
													</Badge>
												)}
												{employee?.status && (
													<Badge
														variant='light'
														radius='sm'
														color={getStatusColor(employee.status)}
													>
														{employee.status}
													</Badge>
												)}
											</Group>
											<Text c='dimmed'>{session.user.email}</Text>
										</Stack>
									</Group>
								</Stack>
							</Group>

							{session.viewingAs && (
								<Alert
									variant='light'
									color='orange'
									icon={<IconSwitchHorizontal size='1rem' />}
									radius='lg'
								>
									You are currently viewing the system as{' '}
									{toTitleCase(session.viewingAs.role)}
									{session.viewingAs.presetName
										? ` with ${session.viewingAs.presetName}`
										: ''}
									.
								</Alert>
							)}
						</Stack>
					</Paper>

					<SimpleGrid cols={{ base: 1, md: 3 }} spacing='lg'>
						<ProfileCard
							title='Account'
							description='Your sign-in identity inside the registry platform.'
							icon={IconUserCircle}
						>
							<InfoItem label='Full Name' value={session.user.name} />
							<InfoItem label='Email' value={session.user.email} />
							<InfoItem
								label='Role'
								value={toTitleCase(role)}
								copyable={false}
							/>
							<InfoItem
								label='Permission Preset'
								value={presetName ?? 'Role-only access'}
								copyable={false}
							/>
						</ProfileCard>

						<ProfileCard
							title='Access'
							description='The access context currently active for this session.'
							icon={IconShieldCheck}
						>
							<InfoItem
								label='Permissions Loaded'
								value={permissions.length}
								copyable={false}
							/>
							<InfoItem
								label='Session Mode'
								value={session.viewingAs ? 'View As' : 'Direct Access'}
								copyable={false}
							/>
							<InfoItem
								label='Current Role'
								value={toTitleCase(role)}
								copyable={false}
							/>
							<InfoItem
								label='Preset Applied'
								value={presetName ?? 'None'}
								copyable={false}
							/>
						</ProfileCard>

						<ProfileCard
							title='Staff Record'
							description='Your linked HR profile, if one is attached to this account.'
							icon={IconBriefcase}
						>
							{employee ? (
								<Stack gap='md'>
									<InfoItem label='Employee Number' value={employee.empNo} />
									<InfoItem
										label='Department'
										value={employee.department ?? 'N/A'}
										copyable={false}
									/>
									<InfoItem
										label='Position'
										value={employee.position ?? 'N/A'}
										copyable={false}
									/>
									<InfoItem
										label='Schools'
										value={schools || 'N/A'}
										copyable={false}
									/>
								</Stack>
							) : (
								<Alert
									variant='light'
									color='blue'
									icon={<IconAlertCircle size='1rem' />}
								>
									No employee record is linked to this account yet.
								</Alert>
							)}
						</ProfileCard>
					</SimpleGrid>

					<SimpleGrid cols={{ base: 1, lg: 2 }} spacing='lg'>
						<Paper withBorder p='lg'>
							<Stack gap='md'>
								<Group gap='sm'>
									<ThemeIcon size='lg' variant='light' color='blue'>
										<IconMail size='1rem' />
									</ThemeIcon>
									<div>
										<Text fw={600}>Identity Summary</Text>
										<Text size='sm' c='dimmed'>
											This is the account information used across dashboard
											tools.
										</Text>
									</div>
								</Group>
								<Divider />
								<SimpleGrid cols={{ base: 1, sm: 2 }} spacing='md'>
									<InfoItem label='Display Name' value={fullName} />
									<InfoItem label='Email Address' value={session.user.email} />
									<InfoItem
										label='Account ID'
										value={session.user.id}
										showOnHover
									/>
									<InfoItem
										label='Role Label'
										value={toTitleCase(role)}
										copyable={false}
									/>
								</SimpleGrid>
							</Stack>
						</Paper>

						<Paper withBorder p='lg'>
							<Stack gap='md'>
								<Group gap='sm'>
									<ThemeIcon size='lg' variant='light' color='teal'>
										<IconBuilding size='1rem' />
									</ThemeIcon>
									<div>
										<Text fw={600}>Employment Snapshot</Text>
										<Text size='sm' c='dimmed'>
											A quick summary of the linked internal staff record.
										</Text>
									</div>
								</Group>
								<Divider />
								{employee ? (
									<SimpleGrid cols={{ base: 1, sm: 2 }} spacing='md'>
										<InfoItem label='Employee Number' value={employee.empNo} />
										<InfoItem
											label='Status'
											value={employee.status}
											copyable={false}
										/>
										<InfoItem
											label='Title'
											value={employee.title ?? 'N/A'}
											copyable={false}
										/>
										<InfoItem
											label='Position'
											value={employee.position ?? 'N/A'}
											copyable={false}
										/>
										<InfoItem
											label='Created At'
											value={formatDateTime(employee.createdAt)}
											copyable={false}
										/>
										<InfoItem
											label='Updated At'
											value={formatDateTime(employee.updatedAt)}
											copyable={false}
										/>
									</SimpleGrid>
								) : (
									<Alert
										variant='light'
										color='gray'
										icon={<IconIdBadge2 size='1rem' />}
									>
										Your account can sign in and access assigned tools, but the
										HR employee record has not been attached yet.
									</Alert>
								)}
							</Stack>
						</Paper>
					</SimpleGrid>
				</Stack>
			</Container>
		</DetailsView>
	);
}

function ProfileCard({
	title,
	description,
	icon: Icon,
	children,
}: {
	title: string;
	description: string;
	icon: typeof IconUserCircle;
	children: React.ReactNode;
}) {
	return (
		<Card withBorder p='lg'>
			<Stack gap='md'>
				<Group gap='sm' align='flex-start'>
					<ThemeIcon size='lg' variant='light'>
						<Icon size='1rem' />
					</ThemeIcon>
					<div>
						<Text fw={600}>{title}</Text>
						<Text size='sm' c='dimmed'>
							{description}
						</Text>
					</div>
				</Group>
				<Divider />
				{children}
			</Stack>
		</Card>
	);
}
