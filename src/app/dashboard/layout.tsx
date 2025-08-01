import { auth } from '@/auth';
import { toTitleCase } from '@/lib/utils';
import { Paper, Text } from '@mantine/core';
import { Metadata } from 'next';
import { PropsWithChildren } from 'react';
import Dashboard from './dashboard';

export async function generateMetadata(): Promise<Metadata> {
  const session = await auth();
  return {
    title: `${toTitleCase(session?.user?.role)} Portal | Limkokwing`,
  };
}

export default function AdminLayout({ children }: PropsWithChildren) {
  return (
    <Dashboard>
      {!process.env.AUTH_URL?.includes('portal.co.ls') && (
        <Paper withBorder p={5} bg={'red'} mb={'md'}>
          <Text ta={'center'} size='xs' c={'white'}>
            This is a Test Environment!
          </Text>
        </Paper>
      )}
      {children}
    </Dashboard>
  );
}
