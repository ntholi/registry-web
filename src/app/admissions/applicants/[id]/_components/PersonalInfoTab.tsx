'use client';

import { Grid, Paper, Stack, Text } from '@mantine/core';

type Props = {
	fullName: string;
	dateOfBirth: string | null;
	nationalId: string | null;
	nationality: string;
	birthPlace: string | null;
	religion: string | null;
	address: string | null;
};

interface InfoCardProps {
	label: string;
	value: string | null | undefined;
}

function InfoCard({ label, value }: InfoCardProps) {
	return (
		<Paper p='md' radius='md' withBorder>
			<Stack gap={4}>
				<Text size='xs' c='dimmed' tt='uppercase' fw={500}>
					{label}
				</Text>
				<Text size='sm' fw={500}>
					{value || '—'}
				</Text>
			</Stack>
		</Paper>
	);
}

export default function PersonalInfoTab({
	fullName,
	dateOfBirth,
	nationalId,
	nationality,
	birthPlace,
	religion,
	address,
}: Props) {
	return (
		<Grid gutter='md'>
			<Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
				<InfoCard label='Full Name' value={fullName} />
			</Grid.Col>
			<Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
				<InfoCard label='Date of Birth' value={dateOfBirth} />
			</Grid.Col>
			<Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
				<InfoCard label='National ID' value={nationalId} />
			</Grid.Col>
			<Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
				<InfoCard label='Nationality' value={nationality} />
			</Grid.Col>
			<Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
				<InfoCard label='Birth Place' value={birthPlace} />
			</Grid.Col>
			<Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
				<InfoCard label='Religion' value={religion} />
			</Grid.Col>
			<Grid.Col span={12}>
				<InfoCard label='Address' value={address} />
			</Grid.Col>
		</Grid>
	);
}
