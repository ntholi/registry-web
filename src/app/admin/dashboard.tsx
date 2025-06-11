'use client';

import { Shell } from '@/components/adease';
import { DashboardUser, UserPosition, UserRole } from '@/db/schema';
import { toTitleCase } from '@/lib/utils';
import { getAssignedModulesByCurrentUser } from '@/server/assigned-modules/actions';
import {
  countApprovedRegistrationClearances,
  countPendingRegistrationClearances,
  countRejectedRegistrationClearances,
} from '@/server/registration-clearance/actions';
import { countByStatus } from '@/server/registration-requests/actions';
import { getUserSchools } from '@/server/users/actions';
import {
  ActionIcon,
  Avatar,
  Flex,
  Group,
  Image,
  Indicator,
  MantineColor,
  NavLink,
  Skeleton,
  Stack,
  Text,
  useComputedColorScheme,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import {
  Icon,
  IconAB2,
  IconBarrierBlock,
  IconBookmark,
  IconBuildingBank,
  IconBuildingStore,
  IconCalendarEvent,
  IconChartLine,
  IconChevronRight,
  IconClipboardCheck,
  IconCopyCheck,
  IconLogout2,
  IconMessageQuestion,
  IconNotebook,
  IconSchool,
  IconSquareRoundedCheck,
  IconTestPipe,
  IconUserCog,
  IconUsersGroup,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { Session } from 'next-auth';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React from 'react';

type NotificationConfig = {
  queryKey: string[];
  queryFn: () => Promise<number>;
  refetchInterval?: number;
  color?: MantineColor;
};

export type NavItem = {
  label: string;
  href?: string;
  icon?: Icon;
  description?: string;
  roles?: UserRole[];
  isVisible?: (session: Session | null) => boolean;
  children?: NavItem[];
  notificationCount?: NotificationConfig;
  isLoading?: boolean;
};

function getNavigation(department: DashboardUser) {
  const navItems = [
    {
      label: 'Users',
      href: '/admin/users',
      icon: IconUserCog,
      roles: ['admin'],
    },
    {
      label: 'Students',
      href: '/admin/students',
      icon: IconUsersGroup,
      isVisible: (session) => {
        if (
          ['registry', 'finance', 'admin'].includes(session?.user?.role || '')
        ) {
          return true;
        }
        const position = session?.user?.position;
        return (
          position &&
          ['manager', 'admin', 'program_leader', 'year_leader'].includes(
            position,
          )
        );
      },
    },
    {
      label: 'Lecturers',
      href: '/admin/lecturers',
      roles: ['academic'],
      icon: IconSchool,
      isVisible: (session) => {
        const position = session?.user?.position;
        return (
          position && ['manager', 'admin', 'program_leader'].includes(position)
        );
      },
    },
    {
      label: 'Modules',
      description: 'Assessments',
      href: '/admin/assessments',
      icon: IconAB2,
      roles: ['academic'],
      isVisible: (session) => {
        return session?.user?.position !== 'admin';
      },
    },
    {
      label: 'Gradebook',
      icon: IconNotebook,
      roles: ['academic'],
      children: [],
      isVisible: (session) => {
        return session?.user?.position !== 'admin';
      },
    },
    {
      label: 'Registration Requests',
      icon: IconClipboardCheck,
      roles: ['registry'],
      children: [
        {
          label: 'Pending',
          href: '/admin/registration-requests/pending',
          icon: IconMessageQuestion,
          notificationCount: {
            queryKey: ['registrationRequests', 'pending'],
            queryFn: () => countByStatus('pending'),
            color: 'red',
          },
        },
        {
          label: 'Registered',
          href: '/admin/registration-requests/registered',
          icon: IconSquareRoundedCheck,
          notificationCount: {
            queryKey: ['registrationRequests', 'registered'],
            queryFn: () => countByStatus('registered'),
            color: 'gray',
          },
        },
        {
          label: 'Rejected',
          href: '/admin/registration-requests/rejected',
          icon: IconBarrierBlock,
          notificationCount: {
            queryKey: ['registrationRequests', 'rejected'],
            queryFn: () => countByStatus('rejected'),
            color: 'gray',
          },
        },
        {
          label: 'Approved',
          href: '/admin/registration-requests/approved',
          icon: IconSquareRoundedCheck,
          notificationCount: {
            queryKey: ['registrationRequests', 'approved'],
            queryFn: () => countByStatus('approved'),
            color: 'gray',
          },
        },
      ],
    },
    {
      label: 'Clearance',
      icon: IconCopyCheck,
      roles: ['finance', 'library', 'resource'],
      children: [
        {
          label: 'Requests',
          href: '/admin/registration-clearance/pending',
          icon: IconMessageQuestion,
          notificationCount: {
            queryKey: ['registrationClearances', 'pending'],
            queryFn: () => countPendingRegistrationClearances(),
            color: 'red',
          },
        },
        {
          label: 'Approved',
          href: '/admin/registration-clearance/approved',
          icon: IconSquareRoundedCheck,
          notificationCount: {
            queryKey: ['registrationClearances', 'approved'],
            queryFn: () => countApprovedRegistrationClearances(),
            color: 'gray',
          },
        },
        {
          label: 'Rejected',
          href: '/admin/registration-clearance/rejected',
          icon: IconBarrierBlock,
          notificationCount: {
            queryKey: ['registrationClearances', 'rejected'],
            queryFn: () => countRejectedRegistrationClearances(),
            color: 'gray',
          },
        },
      ],
    },
    {
      label: 'Modules',
      href: '/admin/modules',
      icon: IconBookmark,
      roles: ['admin'],
    },
    {
      label: 'Programs',
      href: '/admin/programs',
      icon: IconBuildingStore,
      roles: ['registry', 'academic'],
    },
    {
      label: 'Terms',
      href: '/admin/terms',
      icon: IconCalendarEvent,
      roles: ['admin'],
    },
    {
      label: 'Sponsors',
      href: '/admin/sponsors',
      icon: IconBuildingBank,
      roles: ['admin', 'finance'],
    },
    {
      label: 'Simulator',
      href: '/admin/simulate',
      icon: IconTestPipe,
      roles: ['registry'],
    },
    {
      label: 'Reports',
      icon: IconChartLine,
      children: [
        {
          label: 'Clearance',
          href: `/admin/reports/clearance/${department}`,
          icon: IconCopyCheck,
          isVisible: (session) => {
            const userRole = session?.user?.role;
            return (
              session?.user?.position === 'manager' &&
              userRole &&
              ['finance', 'library', 'resource'].includes(userRole)
            );
          },
        },
        {
          href: `/admin/reports/boe`,
          description: 'Board of Examination Report',
          icon: IconCopyCheck,
          roles: ['academic'],
          isVisible: (session) => {
            const academicRole = session?.user?.position as UserPosition;
            return (
              academicRole &&
              ['manager', 'admin', 'program_leader'].includes(academicRole)
            );
          },
        },
      ],
    },
  ] as NavItem[];

  return navItems;
}

export default function Dashboard({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const navigation = getNavigation(session?.user?.role as DashboardUser);

  const { data: assignedModules, isLoading: isModulesLoading } = useQuery({
    queryKey: ['assignedModules'],
    queryFn: getAssignedModulesByCurrentUser,
    enabled: session?.user?.role === 'academic',
  });

  for (const nav of navigation) {
    if (nav.label === 'Gradebook') {
      nav.isLoading = isModulesLoading && session?.user?.role === 'academic';
      if (!isModulesLoading && assignedModules) {
        assignedModules.forEach((it) => {
          nav.children?.push({
            label: it?.semesterModule?.module?.code || 'Unknown Module',
            description: it?.semesterModule?.module?.name || 'Unknown Module',
            href: `/admin/gradebook/${it?.semesterModule.moduleId}`,
          });
        });
      }
    }
  }

  return (
    <Shell>
      <Shell.Header>
        <Group>
          <Logo />
        </Group>
      </Shell.Header>
      <Shell.Navigation>
        <Navigation navigation={navigation} />
      </Shell.Navigation>
      <Shell.Body>{children}</Shell.Body>
      <Shell.User>
        <UserButton />
      </Shell.User>
    </Shell>
  );
}

function UserButton() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const { data: userSchools } = useQuery({
    queryKey: ['userSchools'],
    queryFn: () => getUserSchools(session?.user?.id),
    enabled: session?.user?.role === 'academic',
  });

  if (status === 'unauthenticated') {
    router.push('/api/auth/signin');
  }

  const openModal = () =>
    modals.openConfirmModal({
      centered: true,
      title: 'Confirm logout',
      children: 'Are you sure you want to logout?',
      confirmProps: { color: 'dark' },
      labels: { confirm: 'Logout', cancel: 'Cancel' },
      onConfirm: async () => await signOut(),
    });

  return (
    <Flex mt={'md'} mb={'sm'} justify='space-between' align={'center'}>
      <Group>
        <Avatar src={session?.user?.image} />
        <Stack gap={5}>
          <Text size='0.9rem'>{session?.user?.name}</Text>
          <Text size='0.7rem' c={'dimmed'}>
            {session?.user?.email}
          </Text>
          {session?.user?.position && (
            <Text size='0.65rem' c={'dimmed'}>
              {userSchools?.map((it) => it.school.code).join(', ')}
              {' | '}
              {toTitleCase(session?.user?.position)}
            </Text>
          )}
        </Stack>
      </Group>
      <ActionIcon variant='default' size={'lg'}>
        <IconLogout2 size='1rem' onClick={openModal} />
      </ActionIcon>
    </Flex>
  );
}

export function Navigation({ navigation }: { navigation: NavItem[] }) {
  return (
    <>
      {navigation.map((item, index) => (
        <DisplayWithNotification key={index} item={item} />
      ))}
    </>
  );
}

function DisplayWithNotification({ item }: { item: NavItem }) {
  const { data: notificationCount = 0 } = useQuery({
    queryKey: item.notificationCount?.queryKey ?? [],
    queryFn: () => item.notificationCount?.queryFn() ?? Promise.resolve(0),
    enabled: !!item.notificationCount,
    refetchInterval: item.notificationCount?.refetchInterval,
  });

  return (
    <Indicator
      position='middle-end'
      color={item.notificationCount?.color ?? 'red'}
      offset={20}
      size={23}
      label={notificationCount}
      disabled={!notificationCount}
    >
      <ItemDisplay item={item} />
    </Indicator>
  );
}

function ItemDisplay({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const Icon = item.icon;
  const { data: session } = useSession();

  if (item.isVisible && !item.isVisible(session)) {
    return null;
  }

  if (
    item.roles &&
    (!session?.user?.role ||
      !item.roles.includes(session.user.role as UserRole))
  ) {
    if (session?.user?.role !== 'admin') {
      return null;
    }
  }

  if (item.isLoading) {
    return (
      <NavLink
        label={item.label}
        leftSection={Icon ? <Icon size='1.1rem' /> : null}
        description={item.description}
        opened={true}
      >
        {[1, 2, 3].map((i) => (
          <NavLink
            key={`skeleton-${i}`}
            label={
              <Stack gap={5}>
                <Skeleton height={28} width='60%' radius='sm' animate />
                <Skeleton height={12} width='90%' radius='sm' animate />
              </Stack>
            }
          />
        ))}
      </NavLink>
    );
  }

  const navLink = (
    <NavLink
      label={item.label}
      component={item.href ? Link : undefined}
      href={item.href || ''}
      active={item.href ? pathname.startsWith(item.href) : false}
      leftSection={Icon ? <Icon size='1.1rem' /> : null}
      description={item.description}
      rightSection={
        item.href ? <IconChevronRight size='0.8rem' stroke={1.5} /> : undefined
      }
      opened={!!item.children}
    >
      {item.children?.map((child, index) => (
        <DisplayWithNotification key={index} item={child} />
      ))}
    </NavLink>
  );
  return navLink;
}

function Logo() {
  const colorScheme = useComputedColorScheme('dark');
  const testEnv = process.env.NEXT_PUBLIC_DEV_LOGO;
  return (
    <Link href='/admin'>
      <Image
        src={`/images/logo-${testEnv ?? colorScheme}.png`}
        w={'auto'}
        h={50}
        alt='logo'
      />
    </Link>
  );
}
