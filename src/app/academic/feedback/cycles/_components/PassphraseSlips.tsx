'use client';

import {
	Button,
	Group,
	Loader,
	Modal,
	Paper,
	SimpleGrid,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import { IconPrinter } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { getPassphrasesForClass } from '../_server/actions';

type Props = {
	cycleId: string;
	structureSemesterId: number;
	cycleName: string;
	className: string;
	onClose: () => void;
};

export default function PassphraseSlips({
	cycleId,
	structureSemesterId,
	cycleName,
	className,
	onClose,
}: Props) {
	const { data: passphrases = [], isLoading } = useQuery({
		queryKey: ['feedback-passphrase-slips', cycleId, structureSemesterId],
		queryFn: () => getPassphrasesForClass(cycleId, structureSemesterId),
	});

	function handlePrint() {
		window.print();
	}

	return (
		<Modal
			opened
			onClose={onClose}
			size='xl'
			title={`Passphrase Slips — ${className}`}
			fullScreen
		>
			{isLoading ? (
				<Group justify='center' py='xl'>
					<Loader size='sm' />
				</Group>
			) : (
				<Stack>
					<Group justify='space-between' className='no-print'>
						<Text size='sm' c='dimmed'>
							{passphrases.length} passphrases for {className}
						</Text>
						<Button
							leftSection={<IconPrinter size={16} />}
							onClick={handlePrint}
							size='sm'
						>
							Print
						</Button>
					</Group>
					<SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing='xs'>
						{passphrases.map((p) => (
							<Paper
								key={p.passphrase}
								withBorder
								p='md'
								radius='sm'
								style={{
									breakInside: 'avoid',
									pageBreakInside: 'avoid',
								}}
							>
								<Stack gap={4} ta='center'>
									<Text size='xs' c='dimmed' fw={500}>
										{cycleName}
									</Text>
									<Title order={4} ff='monospace'>
										{p.passphrase}
									</Title>
									<Text size='xs' c='dimmed'>
										Go to /feedback and enter your passphrase
									</Text>
								</Stack>
							</Paper>
						))}
					</SimpleGrid>
				</Stack>
			)}
		</Modal>
	);
}
