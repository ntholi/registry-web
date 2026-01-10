import { GradeTable } from '@admin/tools';
import { GradeCalculatorForm } from '@admin/tools/grade-calculator';
import {
	Box,
	Container,
	Group,
	Paper,
	Stack,
	Text,
	ThemeIcon,
	Title,
} from '@mantine/core';
import { IconCalculator } from '@tabler/icons-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Grade Calculator | Registry',
};

export default function GradeCalculatorPage() {
	return (
		<Container size='xl' py='lg' px='xl'>
			<Stack gap='xl'>
				<Paper withBorder radius='md' p='lg'>
					<Stack gap='md'>
						<Group gap='xs' align='center'>
							<ThemeIcon size='xl' radius='sm' variant='light' color='gray'>
								<IconCalculator size={24} />
							</ThemeIcon>
							<Box>
								<Title fw={400} size='h4'>
									Grade Calculator
								</Title>
								<Text size='sm' c='dimmed'>
									A tool for calculating student grades and their
									classifications
								</Text>
							</Box>
						</Group>
						<GradeCalculatorForm />
					</Stack>
				</Paper>
				<GradeTable />
			</Stack>
		</Container>
	);
}
