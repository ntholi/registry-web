'use client';
import { Anchor, Flex, Paper, Text, useMantineColorScheme } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconBrandGithub } from '@tabler/icons-react';

export default function Footer() {
	const { colorScheme } = useMantineColorScheme();
	const isMobile = useMediaQuery('(max-width: 768px)');
	const isDark = colorScheme === 'dark';

	if (isMobile) {
		return null;
	}

	return (
		<Paper
			style={{
				borderTop: `1px solid var(--mantine-color-${isDark ? 'dark-4' : 'gray-3'})`,
			}}
			mt={'xl'}
			bg={isDark ? 'dark.8' : 'gray.0'}
			p='xs'
		>
			<Flex justify={'flex-end'}>
				<Anchor href='https://github.com/ntholi/registry-web' target='_blank' c='dimmed'>
					<Flex align={'center'} gap='xs'>
						<IconBrandGithub size={14} />
						<Text size='xs'>Source Code</Text>
					</Flex>
				</Anchor>
			</Flex>
		</Paper>
	);
}
