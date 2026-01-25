import { canCurrentUserApply } from '@admissions/applicants';
import { findActiveIntakePeriod } from '@admissions/intake-periods';
import {
	Box,
	Center,
	Group,
	Paper,
	Stack,
	Text,
	ThemeIcon,
	Title,
} from '@mantine/core';
import {
	IconArrowRight,
	IconCalendar,
	IconCamera,
	IconCloudUpload,
	IconCreditCard,
	IconDeviceFloppy,
} from '@tabler/icons-react';
import { redirect } from 'next/navigation';
import { auth } from '@/core/auth';
import { formatDate } from '@/shared/lib/utils/dates';
import ButtonLink from '@/shared/ui/ButtonLink';
import Logo from '@/shared/ui/Logo';

export default async function WelcomePage() {
	const session = await auth();

	if (!session?.user?.id) {
		redirect('/auth/login?callbackUrl=/apply/welcome');
	}

	const eligibility = await canCurrentUserApply();
	if (!eligibility.canApply) {
		redirect('/apply/restricted');
	}

	const activeIntake = await findActiveIntakePeriod();

	if (!activeIntake) {
		redirect('/apply?error=no-active-intake');
	}

	return (
		<Box bg='dark.9' mih='100vh'>
			<Center mih='100vh' p='md'>
				<Paper p='xl' radius='lg' maw={480} w='100%' withBorder>
					<Stack gap='xl' align='center'>
						<Logo height={60} />

						<Stack gap='xs' align='center' ta='center'>
							<Title order={2} size='h3'>
								Ready to Apply?
							</Title>
							<Text c='dimmed' size='sm' maw={360}>
								Complete your application in a few easy steps. Here's what to
								expect:
							</Text>
						</Stack>

						<Box>
							<Text>
								<IconCalendar size={14} /> Deadline:{' '}
								{formatDate(activeIntake.endDate)}
							</Text>
							<Box h={2} bg='var(--mantine-color-orange-3)' mt='4px' />
						</Box>

						<Stack gap='md' w='100%'>
							<Group gap='md' wrap='nowrap' align='flex-start'>
								<ThemeIcon size='md' variant='default' color='blue'>
									<IconCamera size={16} />
								</ThemeIcon>
								<Text size='sm'>
									You can use your phone or computer and upload your documents,
									certificate documents have to be certified.
								</Text>
							</Group>
							<Group gap='md' wrap='nowrap' align='flex-start'>
								<ThemeIcon size='md' variant='default' color='blue'>
									<IconDeviceFloppy size={16} />
								</ThemeIcon>
								<Text size='sm'>
									Your progress is saved automatically after each step, so you
									won't lose any information.
								</Text>
							</Group>
							<Group gap='md' wrap='nowrap' align='flex-start'>
								<ThemeIcon size='md' variant='default' color='blue'>
									<IconCloudUpload size={16} />
								</ThemeIcon>
								<Text size='sm'>
									You can leave and come back anytime to continue where you left
									off, from any device.
								</Text>
							</Group>
							<Group gap='md' wrap='nowrap' align='flex-start'>
								<ThemeIcon size='md' variant='default' color='blue'>
									<IconCreditCard size={16} />
								</ThemeIcon>
								<Text size='sm'>
									Application fee can be paid via M-Pesa or bank deposit.
								</Text>
							</Group>
						</Stack>

						<ButtonLink
							href='/apply/new'
							size='md'
							radius='xl'
							fullWidth
							rightSection={<IconArrowRight size={18} />}
							variant='gradient'
						>
							Start Application
						</ButtonLink>

						<Text size='xs' c='dimmed' ta='center'>
							Takes about 10-15 minutes to complete
						</Text>
					</Stack>
				</Paper>
			</Center>
		</Box>
	);
}
