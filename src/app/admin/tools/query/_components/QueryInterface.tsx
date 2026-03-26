'use client';

import {
	ActionIcon,
	Badge,
	Box,
	Code,
	Group,
	Loader,
	Paper,
	ScrollArea,
	Stack,
	Text,
	Textarea,
	ThemeIcon,
	Timeline,
} from '@mantine/core';
import {
	IconCheck,
	IconDatabase,
	IconPlayerPlay,
	IconRefresh,
	IconSparkles,
	IconX,
} from '@tabler/icons-react';
import { useState, useTransition } from 'react';
import type { QueryStep } from '../_server/actions';
import {
	executeWithConfirmedColumns,
	generateAndExecuteQuery,
} from '../_server/actions';
import ColumnConfirmModal from './ColumnConfirmModal';
import ResultsTable from './ResultsTable';

export default function QueryInterface() {
	const [query, setQuery] = useState('');
	const [steps, setSteps] = useState<QueryStep[]>([]);
	const [isPending, startTransition] = useTransition();
	const [confirmModal, setConfirmModal] = useState<{
		columns: Array<{ name: string; description: string }>;
	} | null>(null);

	function handleSubmit() {
		if (!query.trim() || isPending) return;
		setSteps([]);
		setConfirmModal(null);
		startTransition(async () => {
			const result = await generateAndExecuteQuery(query);
			setSteps(result);

			const confirmStep = result.find((s) => s.type === 'confirm_columns');
			if (confirmStep?.type === 'confirm_columns') {
				setConfirmModal({ columns: confirmStep.columns });
			}
		});
	}

	function handleColumnConfirm(selectedColumns: string[]) {
		setConfirmModal(null);
		setSteps([]);
		startTransition(async () => {
			const result = await executeWithConfirmedColumns(query, selectedColumns);
			setSteps(result);
		});
	}

	function handleKeyDown(e: React.KeyboardEvent) {
		if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			handleSubmit();
		}
	}

	const successStep = steps.find((s) => s.type === 'success');
	const errorStep = steps.find((s) => s.type === 'error');
	const finalSql =
		successStep?.type === 'success'
			? successStep.sql
			: steps.find((s) => s.type === 'validating')?.type === 'validating'
				? (steps.find((s) => s.type === 'validating') as { sql: string }).sql
				: null;

	return (
		<Stack gap='lg'>
			<Paper withBorder radius='md' p='md'>
				<Stack gap='sm'>
					<Textarea
						placeholder='Describe the data you want to see... e.g. "Get all students enrolled last term with CGPA above 3.5"'
						value={query}
						onChange={(e) => setQuery(e.currentTarget.value)}
						onKeyDown={handleKeyDown}
						minRows={2}
						maxRows={5}
						autosize
						disabled={isPending}
					/>
					<Group justify='space-between'>
						<Text size='xs' c='dimmed'>
							Press Ctrl+Enter to run
						</Text>
						<ActionIcon
							variant='filled'
							color='blue'
							size='lg'
							onClick={handleSubmit}
							loading={isPending}
							disabled={!query.trim()}
						>
							<IconPlayerPlay size={18} />
						</ActionIcon>
					</Group>
				</Stack>
			</Paper>

			{(steps.length > 0 || isPending) && (
				<Paper withBorder radius='md' p='md'>
					<Stack gap='md'>
						<Group gap='xs'>
							<ThemeIcon size='sm' variant='light' color='blue'>
								<IconSparkles size={14} />
							</ThemeIcon>
							<Text size='sm' fw={500}>
								AI Progress
							</Text>
						</Group>

						<Timeline
							active={isPending ? steps.length : steps.length - 1}
							bulletSize={24}
							lineWidth={2}
						>
							{steps.map((step, i) => (
								<Timeline.Item
									key={i}
									bullet={<StepIcon step={step} />}
									title={<StepTitle step={step} />}
								>
									<StepContent step={step} />
								</Timeline.Item>
							))}
							{isPending && steps.length === 0 && (
								<Timeline.Item
									bullet={<Loader size={12} />}
									title='Generating query...'
								>
									<Text size='xs' c='dimmed'>
										Analyzing your request and building SQL
									</Text>
								</Timeline.Item>
							)}
						</Timeline>
					</Stack>
				</Paper>
			)}

			{finalSql && (
				<Paper withBorder radius='md' p='md'>
					<Stack gap='xs'>
						<Group gap='xs'>
							<ThemeIcon size='sm' variant='light' color='gray'>
								<IconDatabase size={14} />
							</ThemeIcon>
							<Text size='sm' fw={500}>
								Generated SQL
							</Text>
						</Group>
						<ScrollArea>
							<Code block fz='xs'>
								{finalSql}
							</Code>
						</ScrollArea>
						{successStep?.type === 'success' && (
							<Text size='xs' c='dimmed'>
								{successStep.explanation}
							</Text>
						)}
					</Stack>
				</Paper>
			)}

			{successStep?.type === 'success' && (
				<ResultsTable
					columns={successStep.columns}
					rows={successStep.rows}
					rowCount={successStep.rowCount}
					executionTime={successStep.executionTime}
				/>
			)}

			{errorStep?.type === 'error' && (
				<Paper
					withBorder
					radius='md'
					p='md'
					bg='var(--mantine-color-red-light)'
				>
					<Group gap='xs'>
						<ThemeIcon size='sm' variant='filled' color='red'>
							<IconX size={14} />
						</ThemeIcon>
						<Text size='sm' c='red'>
							{errorStep.message}
						</Text>
					</Group>
				</Paper>
			)}

			{confirmModal && (
				<ColumnConfirmModal
					opened={!!confirmModal}
					columns={confirmModal.columns}
					onConfirm={handleColumnConfirm}
					onClose={() => setConfirmModal(null)}
				/>
			)}
		</Stack>
	);
}

function StepIcon({ step }: { step: QueryStep }) {
	switch (step.type) {
		case 'generating':
			return <IconSparkles size={12} />;
		case 'validating':
			return <IconCheck size={12} />;
		case 'executing':
			return <IconDatabase size={12} />;
		case 'refining':
			return <IconRefresh size={12} />;
		case 'success':
			return <IconCheck size={12} />;
		case 'error':
			return <IconX size={12} />;
		case 'confirm_columns':
			return <IconDatabase size={12} />;
	}
}

function StepTitle({ step }: { step: QueryStep }) {
	switch (step.type) {
		case 'generating':
			return 'Analyzing request';
		case 'validating':
			return 'Query generated';
		case 'executing':
			return 'Executing query';
		case 'refining':
			return `Refining query (attempt ${step.attempt})`;
		case 'success':
			return 'Query successful';
		case 'error':
			return 'Error';
		case 'confirm_columns':
			return 'Column confirmation needed';
	}
}

function StepContent({ step }: { step: QueryStep }) {
	switch (step.type) {
		case 'generating':
			return (
				<Text size='xs' c='dimmed'>
					{step.message}
				</Text>
			);
		case 'validating':
			return (
				<Text size='xs' c='dimmed'>
					{step.explanation}
				</Text>
			);
		case 'executing':
			return (
				<Text size='xs' c='dimmed'>
					Running against database...
				</Text>
			);
		case 'refining':
			return (
				<Box>
					<Text size='xs' c='dimmed'>
						Previous attempt failed:
					</Text>
					<Badge variant='light' color='orange' size='xs' mt={4}>
						{step.error}
					</Badge>
				</Box>
			);
		case 'success':
			return (
				<Group gap='xs'>
					<Badge variant='light' color='teal' size='xs'>
						{step.rowCount} rows
					</Badge>
					<Badge variant='light' color='gray' size='xs'>
						{step.executionTime}ms
					</Badge>
				</Group>
			);
		case 'error':
			return (
				<Text size='xs' c='red'>
					{step.message}
				</Text>
			);
		case 'confirm_columns':
			return (
				<Text size='xs' c='dimmed'>
					Please select which columns to include
				</Text>
			);
	}
}
