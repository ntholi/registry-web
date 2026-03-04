'use client';

import {
	Alert,
	Badge,
	Button,
	Divider,
	FileButton,
	Group,
	Loader,
	Popover,
	Progress,
	ScrollArea,
	Select,
	SimpleGrid,
	Stack,
	Table,
	Text,
	ThemeIcon,
} from '@mantine/core';
import {
	IconAlertCircle,
	IconArrowLeft,
	IconArrowRight,
	IconCheck,
	IconColumns,
	IconFileSpreadsheet,
	IconUpload,
	IconX,
} from '@tabler/icons-react';
import type { ColumnMapping, ImportProgress, ParsedStudent } from './types';
import { FIELD_SELECT_DATA } from './types';

type FileSelectStepProps = {
	onFileSelect: (file: File | null) => void;
};

export function FileSelectStep({ onFileSelect }: FileSelectStepProps) {
	return (
		<Stack align='center' py='xl' gap='lg'>
			<ThemeIcon size={64} variant='light' radius='xl' color='blue'>
				<IconUpload size={32} />
			</ThemeIcon>
			<Stack align='center' gap='xs'>
				<Text fw={500} size='lg'>
					Select an Excel file
				</Text>
				<Text size='sm' c='dimmed' ta='center'>
					Upload a .xlsx or .xls file containing student data. The first row
					should contain column headers.
				</Text>
			</Stack>
			<FileButton onChange={onFileSelect} accept='.xlsx,.xls,.csv'>
				{(props) => (
					<Button
						{...props}
						leftSection={<IconFileSpreadsheet size='1rem' />}
						size='md'
					>
						Choose File
					</Button>
				)}
			</FileButton>
		</Stack>
	);
}

type ColumnMappingStepProps = {
	headers: string[];
	rawRows: (string | number | null | undefined)[][];
	mapping: ColumnMapping;
	mappedCount: number;
	onMappingChange: (colIndex: number, fieldKey: string) => void;
	onBack: () => void;
	onNext: () => void;
};

export function ColumnMappingStep({
	headers,
	rawRows,
	mapping,
	mappedCount,
	onMappingChange,
	onBack,
	onNext,
}: ColumnMappingStepProps) {
	const hasName = Object.values(mapping).includes('name');

	return (
		<Stack>
			<Group justify='space-between'>
				<Group gap='xs'>
					<IconColumns size='1.2rem' />
					<Text fw={500}>Map Columns</Text>
				</Group>
				<Badge variant='light'>
					{mappedCount} of {headers.length} mapped
				</Badge>
			</Group>

			<Text size='sm' c='dimmed'>
				Map each column from your file to the corresponding system field. We
				auto-detected some mappings for you.
			</Text>

			{!hasName && (
				<Alert
					color='red'
					icon={<IconAlertCircle size='1rem' />}
					title='Name column required'
				>
					You must map at least one column to &quot;Full Name&quot;
				</Alert>
			)}

			<ScrollArea.Autosize mah={400}>
				<Table withTableBorder striped>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>Excel Column</Table.Th>
							<Table.Th>Sample Data</Table.Th>
							<Table.Th>Maps To</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{headers.map((header, i) => (
							<Table.Tr key={i}>
								<Table.Td>
									<Text size='sm' fw={500}>
										{header}
									</Text>
								</Table.Td>
								<Table.Td>
									<Text size='xs' c='dimmed' lineClamp={1}>
										{String(rawRows[0]?.[i] ?? '')}
									</Text>
								</Table.Td>
								<Table.Td>
									<Select
										size='xs'
										data={FIELD_SELECT_DATA}
										value={mapping[i] ?? '_skip'}
										onChange={(v) => onMappingChange(i, v ?? '_skip')}
										allowDeselect={false}
									/>
								</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
			</ScrollArea.Autosize>

			<Group justify='space-between' mt='md'>
				<Button
					variant='default'
					leftSection={<IconArrowLeft size='1rem' />}
					onClick={onBack}
				>
					Back
				</Button>
				<Button
					rightSection={<IconArrowRight size='1rem' />}
					onClick={onNext}
					disabled={!hasName}
				>
					Preview
				</Button>
			</Group>
		</Stack>
	);
}

type PreviewStepProps = {
	students: ParsedStudent[];
	programOptions: { value: string; label: string }[];
	structureOptions: { value: string; label: string }[];
	termOptions: { value: string; label: string }[];
	selectedProgramId: string | null;
	structureId: string | null;
	selectedTerm: string | null;
	loadingStructures: boolean;
	onProgramChange: (v: string | null) => void;
	onStructureChange: (v: string | null) => void;
	onTermChange: (v: string | null) => void;
	onBack: () => void;
	onImport: () => void;
};

export function PreviewStep({
	students,
	programOptions,
	structureOptions,
	termOptions,
	selectedProgramId,
	structureId,
	selectedTerm,
	loadingStructures,
	onProgramChange,
	onStructureChange,
	onTermChange,
	onBack,
	onImport,
}: PreviewStepProps) {
	return (
		<Stack>
			<Text fw={500}>
				Preview — {students.length} student{students.length !== 1 ? 's' : ''}{' '}
				found
			</Text>

			<Divider label='Enrollment Settings' labelPosition='left' />

			<SimpleGrid cols={{ base: 1, sm: 3 }}>
				<Select
					label='Program'
					placeholder='Select program'
					searchable
					data={programOptions}
					value={selectedProgramId}
					onChange={onProgramChange}
					required
				/>
				<Select
					label='Structure'
					placeholder='Select structure'
					searchable
					data={structureOptions}
					value={structureId}
					onChange={onStructureChange}
					disabled={!selectedProgramId || loadingStructures}
					rightSection={loadingStructures ? <Loader size='xs' /> : undefined}
					required
				/>
				<Select
					label='Start Term'
					placeholder='Select term'
					searchable
					data={termOptions}
					value={selectedTerm}
					onChange={onTermChange}
				/>
			</SimpleGrid>

			<Divider label='Students' labelPosition='left' />

			<ScrollArea.Autosize mah={350}>
				<Table withTableBorder striped highlightOnHover>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>#</Table.Th>
							<Table.Th>Name</Table.Th>
							<Table.Th>National ID</Table.Th>
							<Table.Th>Gender</Table.Th>
							<Table.Th>DOB</Table.Th>
							<Table.Th>Phone</Table.Th>
							<Table.Th>Guardian</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{students.map((s, i) => (
							<Table.Tr key={i}>
								<Table.Td>{i + 1}</Table.Td>
								<Table.Td>{s.name}</Table.Td>
								<Table.Td>{s.nationalId}</Table.Td>
								<Table.Td>{s.gender}</Table.Td>
								<Table.Td>{s.dateOfBirth}</Table.Td>
								<Table.Td>{s.phone1}</Table.Td>
								<Table.Td>{s.kinName}</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
			</ScrollArea.Autosize>

			<Group justify='space-between' mt='md'>
				<Button
					variant='default'
					leftSection={<IconArrowLeft size='1rem' />}
					onClick={onBack}
				>
					Back
				</Button>
				<Button
					leftSection={<IconUpload size='1rem' />}
					onClick={onImport}
					disabled={!structureId}
				>
					Import {students.length} Students
				</Button>
			</Group>
		</Stack>
	);
}

type ProgressStepProps = {
	progress: ImportProgress;
	pct: number;
	onClose: () => void;
	onAbort: () => void;
};

export function ProgressStep({
	progress,
	pct,
	onClose,
	onAbort,
}: ProgressStepProps) {
	const isDone = progress.completed === progress.total;

	return (
		<Stack>
			<Group justify='space-between'>
				<Text fw={500}>
					{isDone ? 'Import Complete' : 'Importing Students...'}
				</Text>
				<Text size='sm' c='dimmed'>
					{progress.completed} / {progress.total}
				</Text>
			</Group>

			<Progress value={pct} size='lg' animated={!isDone} />

			<Group gap='lg'>
				<Group gap={4}>
					<ThemeIcon size='sm' color='green' variant='light'>
						<IconCheck size='0.8rem' />
					</ThemeIcon>
					<Text size='sm'>{progress.succeeded} succeeded</Text>
				</Group>
				{progress.failed > 0 && (
					<Group gap={4}>
						<ThemeIcon size='sm' color='red' variant='light'>
							<IconX size='0.8rem' />
						</ThemeIcon>
						<Text size='sm'>{progress.failed} failed</Text>
					</Group>
				)}
			</Group>

			<ScrollArea.Autosize mah={300}>
				<Table withTableBorder>
					<Table.Thead>
						<Table.Tr>
							<Table.Th w={50}>#</Table.Th>
							<Table.Th>Name</Table.Th>
							<Table.Th>Status</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{progress.results.map((r) => (
							<Table.Tr key={r.row}>
								<Table.Td>{r.row}</Table.Td>
								<Table.Td>{r.name}</Table.Td>
								<Table.Td>
									{r.stdNo ? (
										<Badge color='green' variant='light'>
											Created #{r.stdNo}
										</Badge>
									) : (
										<Popover withArrow width={300}>
											<Popover.Target>
												<Badge
													color='red'
													variant='light'
													style={{ cursor: 'pointer' }}
												>
													Failed
												</Badge>
											</Popover.Target>
											<Popover.Dropdown>
												<Text size='xs'>{r.error}</Text>
											</Popover.Dropdown>
										</Popover>
									)}
								</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
			</ScrollArea.Autosize>

			<Group justify='flex-end' mt='md'>
				{!isDone ? (
					<Button variant='default' color='red' onClick={onAbort}>
						Stop Import
					</Button>
				) : (
					<Button onClick={onClose}>Close</Button>
				)}
			</Group>
		</Stack>
	);
}
