'use client';

import { MantineProvider } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import NextTopLoader from 'nextjs-toploader';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import type React from 'react';

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 5 * 60 * 1000,
			refetchOnWindowFocus: false,
		},
	},
});

export default function Providers({ children }: { children: React.ReactNode }) {
	return (
		<SessionProvider>
			<QueryClientProvider client={queryClient}>
				<MantineProvider defaultColorScheme='dark'>
					<DatesProvider
						settings={{
							firstDayOfWeek: 0,
							locale: 'en',
						}}
					>
						<Notifications />
						<ModalsProvider>
							<NuqsAdapter>
								{children}
								<NextTopLoader
									height={3}
									color='#2196F3'
									showSpinner={false}
									shadow='0 0 10px #2196F3,0 0 5px #2196F3'
								/>
							</NuqsAdapter>
						</ModalsProvider>
					</DatesProvider>
				</MantineProvider>
			</QueryClientProvider>
		</SessionProvider>
	);
}
