import { Space } from '@mantine/core';
import type { Metadata } from 'next';
import type React from 'react';
import { auth } from '@/auth';
import BottomNavigation from './base/BottomNavigation';
import Footer from './base/Footer';
import Navbar from './base/Navbar';

export async function generateMetadata(): Promise<Metadata> {
	const session = await auth();
	return {
		title: session?.user?.name ? `${session.user.name.split(' ')[0]}'s Portal` : 'Student Portal',
		description: 'Student Portal for Limkokwing University of Creative Technology, Lesotho',
	};
}
export default function layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<Navbar />
			<Space h="xl" />
			<div
				style={{
					minHeight: '80vh',
					paddingBottom: '100px',
				}}
			>
				{children}
			</div>
			<Footer />
			<BottomNavigation />
		</>
	);
}
