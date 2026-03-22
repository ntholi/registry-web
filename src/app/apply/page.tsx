'use client';

import { Flex } from '@mantine/core';
import Footer from '@/shared/ui/Footer';
import { ApplyHeader } from './_components/ApplyHeader';
import { ApplyHero } from './_components/ApplyHero';

export default function ApplyPage() {
	return (
		<>
			<Flex mih='95vh' direction='column'>
				<ApplyHeader />
				<ApplyHero />
			</Flex>
			<Footer />
		</>
	);
}
