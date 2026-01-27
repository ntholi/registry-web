'use client';

import {
	ActionIcon,
	Alert,
	Button,
	Group,
	Paper,
	Stack,
	Text,
	Title,
} from '@mantine/core';
import {
	IconInfoCircle,
	IconPlus,
	IconTrash,
	IconX,
} from '@tabler/icons-react';
import { getAlertColor } from '@/shared/lib/utils/colors';
import { ReceiptInput } from '@/shared/ui/adease';

type ModuleWithStatus = {
	semesterModuleId: number;
	code: string;
	name: string;
	status: string;
};

interface RepeatModuleReceiptsProps {
	repeatModules: ModuleWithStatus[];
	receipts: string[];
	onReceiptsChange: (receipts: string[]) => void;
	onRemoveModule: (moduleId: number) => void;
}

export default function RepeatModuleReceipts({
	repeatModules,
	receipts,
	onReceiptsChange,
	onRemoveModule,
}: RepeatModuleReceiptsProps) {
	const handleAddReceipt = () => {
		onReceiptsChange([...receipts, '']);
	};

	const handleReceiptChange = (index: number, value: string) => {
		const updated = [...receipts];
		updated[index] = value;
		onReceiptsChange(updated);
	};

	const handleRemoveReceipt = (index: number) => {
		onReceiptsChange(receipts.filter((_, i) => i !== index));
	};

	const validReceipts = receipts.filter(
		(r) => r && /^(PMRC\d{5}|SR-\d{5})$/.test(r)
	);

	return (
		<Stack gap='lg' mt='md'>
			<Paper p='lg' withBorder>
				<Stack gap='md'>
					<Title order={5}>Your Repeat Modules</Title>
					<Text size='sm' c='dimmed'>
						You have selected the following repeat modules. Provide payment
						receipts or remove modules to proceed without them.
					</Text>

					<Stack gap='xs'>
						{repeatModules.map((module) => (
							<Paper key={module.semesterModuleId} p='sm' withBorder>
								<Group justify='space-between' wrap='nowrap'>
									<div>
										<Text fw={500} size='sm'>
											{module.code}
										</Text>
										<Text size='xs' c='dimmed'>
											{module.name}
										</Text>
									</div>
									<ActionIcon
										color='red'
										variant='subtle'
										onClick={() => onRemoveModule(module.semesterModuleId)}
										title='Remove this repeat module'
									>
										<IconX size={16} />
									</ActionIcon>
								</Group>
							</Paper>
						))}
					</Stack>
				</Stack>
			</Paper>

			<Paper p='lg' withBorder>
				<Stack gap='md'>
					<Title order={5}>Payment Receipts</Title>
					<Text size='sm' c='dimmed'>
						Enter receipt numbers for repeat module payments. You can add
						multiple receipts if needed.
					</Text>

					{receipts.map((receipt, index) => (
						<Group key={index} gap='sm' align='flex-end'>
							<div style={{ flex: 1 }}>
								<ReceiptInput
									label={`Receipt ${index + 1}`}
									value={receipt}
									onChange={(value) => handleReceiptChange(index, value)}
									required
								/>
							</div>
							{receipts.length > 1 && (
								<ActionIcon
									color='red'
									variant='subtle'
									onClick={() => handleRemoveReceipt(index)}
									mb={4}
								>
									<IconTrash size={16} />
								</ActionIcon>
							)}
						</Group>
					))}

					<Button
						variant='light'
						leftSection={<IconPlus size={16} />}
						onClick={handleAddReceipt}
						size='sm'
					>
						Add Another Receipt
					</Button>
				</Stack>
			</Paper>

			<Alert
				icon={<IconInfoCircle size='1rem' />}
				color={getAlertColor('info')}
			>
				<Text size='sm'>
					<strong>Note:</strong> You can enter multiple receipts if you paid for
					modules across different transactions. Each receipt must be in format
					PMRC00000 or SR-00000.
				</Text>
			</Alert>

			{validReceipts.length > 0 && (
				<Text size='sm' c='dimmed'>
					{validReceipts.length} valid receipt
					{validReceipts.length !== 1 ? 's' : ''} entered
				</Text>
			)}
		</Stack>
	);
}
