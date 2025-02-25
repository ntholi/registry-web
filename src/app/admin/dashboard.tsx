'use client';

import { Shell } from '@/components/adease';
import { dashboardUsers, UserRole } from '@/db/schema';
import {
  countApprovedRegistrationClearances,
  countPendingRegistrationClearances,
  countRejectedRegistrationClearances,
} from '@/server/registration-clearance/actions';
import { countPendingRegistrationRequests } from '@/server/registration-requests/actions';
import {
  ActionIcon,
  Avatar,
  Flex,
  Group,
  Image,
  Indicator,
  LoadingOverlay,
  MantineColor,
  NavLink,
  Stack,
  Text,
  useComputedColorScheme,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import {
  Icon,
  IconBarrierBlock,
  IconBookmark,
  IconBuildingBank,
  IconBuildingStore,
  IconCalendarEvent,
  IconChevronRight,
  IconClipboardCheck,
  IconCopyCheck,
  IconLogout2,
  IconMessageQuestion,
  IconSquareRoundedCheck,
  IconTestPipe,
  IconUserCog,
  IconUsersGroup,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
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
  icon: Icon;
  roles?: UserRole[];
  children?: NavItem[];
  notificationCount?: NotificationConfig;
};

const navigation: NavItem[] = [
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
    roles: [...dashboardUsers],
  },
  {
    label: 'Registration Requests',
    href: '/admin/registration-requests',
    icon: IconClipboardCheck,
    roles: ['registry'],
    notificationCount: {
      queryKey: ['registrationRequests'],
      queryFn: () => countPendingRegistrationRequests(),
      color: 'red',
    },
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
    roles: ['registry'],
  },
  {
    label: 'Programs',
    href: '/admin/programs',
    icon: IconBuildingStore,
    roles: [...dashboardUsers],
  },
  {
    label: 'Clearance Responses',
    href: '/admin/clearance-responses',
    icon: IconMessageQuestion,
    roles: ['admin'],
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
];

export default function Dashboard({ children }: { children: React.ReactNode }) {
  const { status } = useSession();

  if (status === 'loading') {
    return (
      <Flex h='100vh' w='100vw' justify='center' align='center'>
        <LoadingOverlay visible />
      </Flex>
    );
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
  const { data: session } = useSession();
  const router = useRouter();

  if (!session?.user) {
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

  if (
    item.roles &&
    (!session?.user?.role ||
      !item.roles.includes(session.user.role as UserRole))
  ) {
    if (session?.user?.role !== 'admin') {
      return null;
    }
  }

  const navLink = (
    <NavLink
      label={item.label}
      component={item.href ? Link : undefined}
      href={item.href || ''}
      active={item.href ? pathname.startsWith(item.href) : false}
      leftSection={<Icon size='1.1rem' />}
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
  return (
    <Link href='/admin'>
      <Image
        src={`/images/logo-${colorScheme}.png`}
        w={'auto'}
        h={50}
        alt='logo'
      />
    </Link>
  );
}
