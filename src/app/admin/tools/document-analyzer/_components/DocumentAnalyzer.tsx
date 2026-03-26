'use client';

import {
	Badge,
	Box,
	Button,
	Code,
	Container,
	Divider,
	Group,
	Paper,
	Progress,
	rem,
	ScrollArea,
	SegmentedControl,
	SimpleGrid,
	Stack,
	Table,
	TableTbody,
	TableTd,
	TableTh,
	TableThead,
	TableTr,
	Text,
	ThemeIcon,
	Title,
} from '@mantine/core';
import {
	Dropzone,
	type FileRejection,
	IMAGE_MIME_TYPE,
	MIME_TYPES,
} from '@mantine/dropzone';
import { notifications } from '@mantine/notifications';
import {
	IconCertificate,
	IconFile,
	IconFileSearch,
	IconId,
	IconReceipt,
	IconRefresh,
	IconUpload,
} from '@tabler/icons-react';
import { useState } from 'react';
import { ConfirmationField } from '@/app/apply/_components/ConfirmationField';
import type {
	CertificateDocumentResult,
	IdentityDocumentResult,
	ReceiptResult,
} from '@/core/integrations/ai/documents';
import { getGradeColor } from '@/shared/lib/utils/colors';
import { formatFileSize } from '@/shared/lib/utils/files';

type DocType = 'identity' | 'academic' | 'receipt';

type AnalysisState =
	| { type: 'identity'; data: IdentityDocumentResult }
	| { type: 'academic'; data: CertificateDocumentResult }
	| { type: 'receipt'; data: ReceiptResult };

type ProcessState = 'idle' | 'reading' | 'done' | 'error';

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = [...IMAGE_MIME_TYPE, MIME_TYPES.pdf];

const TYPE_CONFIG = {
	identity: {
		label: 'Identity',
		icon: IconId,
		title: 'Upload Identity Document',
		desc: 'National ID, passport, or birth certificate',
	},
	academic: {
		label: 'Academic',
		icon: IconCertificate,
		title: 'Upload Academic Document',
		desc: 'Certificate, transcript, or results slip',
	},
	receipt: {
		label: 'Receipt',
		icon: IconReceipt,
		title: 'Upload Payment Receipt',
		desc: 'Bank deposit slip or sales receipt',
	},
} as const;

function toBase64(file: File): Promise<string> {
	return file.arrayBuffer().then((buf) => {
		const bytes = new Uint8Array(buf);
		const chars = Array.from(bytes, (b) => String.fromCharCode(b));
		return btoa(chars.join(''));
	});
}

export default function DocumentAnalyzer() {
	const [docType, setDocType] = useState<DocType>('identity');
	const [state, setState] = useState<ProcessState>('idle');
	const [result, setResult] = useState<AnalysisState | null>(null);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	async function processFile(file: File) {
		setState('reading');
		setErrorMsg(null);
		setResult(null);

		try {
			const base64 = await toBase64(file);
			const response = await fetch('/api/documents/analyze', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type: docType, base64, mediaType: file.type }),
			});
			const json = await response.json();

			if (!json.success) {
				setErrorMsg(json.error);
				setState('error');
				notifications.show({
					title: 'Analysis Failed',
					message: json.error,
					color: 'red',
				});
				return;
			}

			setResult({ type: docType, data: json.data } as AnalysisState);
			setState('done');
			notifications.show({
				title: 'Analysis Complete',
				message: 'Document processed successfully',
				color: 'green',
			});
		} catch {
			const msg = 'Network error occurred while analyzing document';
			setErrorMsg(msg);
			setState('error');
			notifications.show({
				title: 'Analysis Failed',
				message: msg,
				color: 'red',
			});
		}
	}

	function handleReset() {
		setResult(null);
		setState('idle');
		setErrorMsg(null);
	}

	function handleReject(_rejections: FileRejection[]) {
		notifications.show({
			title: 'File not accepted',
			message: `Please upload a PDF or image under ${formatFileSize(MAX_FILE_SIZE)}`,
			color: 'red',
		});
	}

	const config = TYPE_CONFIG[docType];
	const IdleIcon = config.icon;

	return (
		<Container size='xl' py='lg' px='xl'>
			<Stack gap='xl'>
				<Paper withBorder radius='md' p='lg'>
					<Stack gap='md'>
						<Group justify='space-between' align='center'>
							<Group gap='xs' align='center'>
								<ThemeIcon size='xl' radius='sm' variant='light' color='gray'>
									<IconFileSearch size={24} />
								</ThemeIcon>
								<Box>
									<Title fw={400} size='h4'>
										Document Analyzer
									</Title>
									<Text size='sm' c='dimmed'>
										Simulate how the apply wizard analyzes academic, identity,
										and payment documents
									</Text>
								</Box>
							</Group>
							{state === 'done' && (
								<Button
									variant='light'
									size='xs'
									leftSection={<IconRefresh size={14} />}
									onClick={handleReset}
								>
									Analyze Another
								</Button>
							)}
						</Group>

						<Divider />

						<Stack gap='xs'>
							<Text size='sm' fw={500}>
								Document Type
							</Text>
							<SegmentedControl
								value={docType}
								onChange={(val) => {
									setDocType(val as DocType);
									handleReset();
								}}
								data={Object.entries(TYPE_CONFIG).map(([value, cfg]) => ({
									label: (
										<Group gap={6}>
											<cfg.icon size={16} />
											<span>{cfg.label}</span>
										</Group>
									),
									value,
								}))}
							/>
						</Stack>

						{state === 'idle' && (
							<Paper withBorder p='sm'>
								<Dropzone
									onDrop={(files) => files[0] && processFile(files[0])}
									onReject={handleReject}
									maxFiles={1}
									maxSize={MAX_FILE_SIZE}
									accept={ACCEPTED_MIME_TYPES}
								>
									<Group
										justify='center'
										gap='xl'
										mih={rem(140)}
										style={{ pointerEvents: 'none' }}
									>
										<Dropzone.Accept>
											<IconUpload
												size={52}
												stroke={1.5}
												color='var(--mantine-color-blue-6)'
											/>
										</Dropzone.Accept>
										<Dropzone.Reject>
											<IconFile
												size={52}
												stroke={1.5}
												color='var(--mantine-color-red-6)'
											/>
										</Dropzone.Reject>
										<Dropzone.Idle>
											<IdleIcon
												size={52}
												stroke={1.5}
												color='var(--mantine-color-dimmed)'
											/>
										</Dropzone.Idle>
										<Stack gap='xs' ta='center'>
											<Text size='lg' inline>
												{config.title}
											</Text>
											<Text size='sm' c='dimmed' inline>
												{config.desc} • Max {formatFileSize(MAX_FILE_SIZE)}
											</Text>
										</Stack>
									</Group>
								</Dropzone>
							</Paper>
						)}

						{state === 'reading' && (
							<Paper withBorder radius='md' p='xl'>
								<Stack gap='md' align='center' mih={rem(140)} justify='center'>
									<ThemeIcon variant='light' size={80} radius='md' color='blue'>
										<IconFileSearch size={40} stroke={1.5} />
									</ThemeIcon>
									<Progress radius='xs' value={100} animated w='100%' />
									<Text size='sm' c='dimmed'>
										Analyzing document...
									</Text>
								</Stack>
							</Paper>
						)}

						{state === 'error' && (
							<Paper withBorder radius='md' p='xl'>
								<Stack gap='md' align='center'>
									<Text size='sm' c='red' ta='center'>
										{errorMsg}
									</Text>
									<Button
										variant='light'
										size='sm'
										leftSection={<IconRefresh size={14} />}
										onClick={handleReset}
									>
										Try Again
									</Button>
								</Stack>
							</Paper>
						)}

						{state === 'done' && result && <ResultView result={result} />}
					</Stack>
				</Paper>
			</Stack>
		</Container>
	);
}

type ResultViewProps = { result: AnalysisState };

function ResultView({ result }: ResultViewProps) {
	if (result.type === 'identity') return <IdentityResult data={result.data} />;
	if (result.type === 'academic')
		return <CertificateResult data={result.data} />;
	return <ReceiptResultCard data={result.data} />;
}

function IdentityResult({ data }: { data: IdentityDocumentResult }) {
	return (
		<SimpleGrid cols={{ base: 1, md: 2 }} spacing='md'>
			<Paper
				p='md'
				radius='md'
				style={{
					background:
						'linear-gradient(135deg, var(--mantine-color-dark-7) 0%, var(--mantine-color-dark-8) 100%)',
					border: '1px solid var(--mantine-color-dark-4)',
				}}
			>
				<Stack gap='md' pt='xs'>
					<Group justify='space-between' align='flex-start'>
						<Stack gap={4}>
							<Text size='xs' c='dimmed' tt='uppercase' fw={600}>
								National ID
							</Text>
							<Text size='xl' fw={700} ff='monospace'>
								{data.nationalId || '—'}
							</Text>
						</Stack>
						<ThemeIcon
							variant='light'
							size={50}
							radius='md'
							color='blue'
							opacity={0.8}
						>
							<IconId size={28} />
						</ThemeIcon>
					</Group>
					<Divider color='dark.5' />
					<Text size='lg' fw={700} tt='uppercase' lts={1}>
						{data.fullName || '—'}
					</Text>
					<Stack gap='xs'>
						<ConfirmationField
							label='DOB'
							value={data.dateOfBirth}
							labelWidth={60}
						/>
						<ConfirmationField
							label='Gender'
							value={data.gender}
							labelWidth={60}
						/>
						<ConfirmationField
							label='Nation'
							value={data.nationality}
							labelWidth={60}
						/>
						{data.birthPlace && (
							<ConfirmationField
								label='Birth'
								value={data.birthPlace}
								labelWidth={60}
							/>
						)}
					</Stack>
					{data.expiryDate && (
						<>
							<Divider color='dark.5' />
							<Group justify='space-between'>
								<Text size='xs' c='dimmed'>
									Expires
								</Text>
								<Text size='xs' fw={500}>
									{data.expiryDate}
								</Text>
							</Group>
						</>
					)}
				</Stack>
			</Paper>
			<RawData data={data} />
		</SimpleGrid>
	);
}

function CertificateResult({ data }: { data: CertificateDocumentResult }) {
	const hasSubjects = data.subjects && data.subjects.length > 0;

	return (
		<SimpleGrid cols={{ base: 1, md: 2 }} spacing='md'>
			<Paper
				p={0}
				radius='md'
				style={{
					background:
						'linear-gradient(180deg, var(--mantine-color-dark-7) 0%, var(--mantine-color-dark-8) 100%)',
					border: '1px double var(--mantine-color-dark-4)',
				}}
			>
				<Box bg='dark.8'>
					<Box p='md'>
						<Group justify='center' gap='sm'>
							<ThemeIcon variant='filled' size={36} radius='xl' color='dark'>
								<IconCertificate size={50} />
							</ThemeIcon>
							<Stack gap={0}>
								<Text size='lg' fw={600} tt='uppercase' lts={2}>
									{data.certificateType || 'Academic Document'}
								</Text>
								{data.issuingAuthority && (
									<Text size='xs' c='dark.3' fw={500}>
										Issued by {data.issuingAuthority}
									</Text>
								)}
							</Stack>
						</Group>
					</Box>
					<Divider my='sm' />
				</Box>
				<Stack gap='md' p='lg'>
					<Stack gap={4} ta='center'>
						<Text size='xs' c='dimmed'>
							Name on Document
						</Text>
						<Text size='xl' fw={700} ff='Georgia, serif'>
							{data.studentName || '—'}
						</Text>
					</Stack>
					<Divider color='dark.5' />
					<SimpleGrid cols={{ base: 2 }} spacing='md'>
						<ConfirmationField
							label='Exam Year'
							value={data.examYear}
							layout='vertical'
						/>
						{data.certificateNumber && (
							<ConfirmationField
								label='Cert No.'
								value={data.certificateNumber}
								layout='vertical'
							/>
						)}
						{data.overallClassification && (
							<ConfirmationField
								label='Classification'
								value={data.overallClassification}
								layout='vertical'
								highlight
							/>
						)}
					</SimpleGrid>
					<ConfirmationField
						label='Institution'
						value={data.institutionName}
						layout='vertical'
					/>
					{hasSubjects && (
						<>
							<Divider color='dark.5' my='xs' />
							<Stack gap='xs'>
								<Group justify='space-between'>
									<Text size='sm' fw={600}>
										Subjects & Grades
									</Text>
									<Badge variant='light' size='sm'>
										{data.subjects?.length} subjects
									</Badge>
								</Group>
								<ScrollArea.Autosize mah={300}>
									<Table
										striped
										highlightOnHover
										withTableBorder
										withColumnBorders
									>
										<TableThead>
											<TableTr>
												<TableTh>Subject</TableTh>
												<TableTh ta='center' w={80}>
													Grade
												</TableTh>
											</TableTr>
										</TableThead>
										<TableTbody>
											{data.subjects?.map((subject) => (
												<TableTr key={`${subject.name}-${subject.grade}`}>
													<TableTd>
														<Text size='sm'>{subject.name}</Text>
													</TableTd>
													<TableTd ta='center'>
														<Badge
															variant='light'
															color={getGradeColor(subject.grade)}
															size='md'
														>
															{subject.grade}
														</Badge>
													</TableTd>
												</TableTr>
											))}
										</TableTbody>
									</Table>
								</ScrollArea.Autosize>
							</Stack>
						</>
					)}
				</Stack>
			</Paper>
			<RawData data={data} />
		</SimpleGrid>
	);
}

function ReceiptResultCard({ data }: { data: ReceiptResult }) {
	const isSalesReceipt = data.receiptType === 'sales_receipt';

	return (
		<SimpleGrid cols={{ base: 1, md: 2 }} spacing='md'>
			<Paper
				p='md'
				radius='md'
				style={{
					background:
						'linear-gradient(135deg, var(--mantine-color-dark-7) 0%, var(--mantine-color-dark-8) 100%)',
					border: '1px solid var(--mantine-color-dark-4)',
				}}
			>
				<Stack gap='md' pt='xs'>
					<Group justify='space-between' align='flex-start'>
						<Stack gap={4}>
							<Text size='xs' c='dimmed' tt='uppercase' fw={600}>
								{isSalesReceipt ? 'Amount Paid' : 'Amount Deposited'}
							</Text>
							<Text size='xl' fw={700} ff='monospace' c='green'>
								{data.currency ?? 'M'} {data.amountDeposited?.toFixed(2) ?? '—'}
							</Text>
						</Stack>
						<ThemeIcon
							variant='light'
							size={50}
							radius='md'
							color='teal'
							opacity={0.8}
						>
							<IconReceipt size={28} />
						</ThemeIcon>
					</Group>
					<Divider color='dark.5' />
					<Text size='lg' fw={700} tt='uppercase' lts={1}>
						{data.beneficiaryName ?? '—'}
					</Text>
					<Stack gap='xs'>
						{isSalesReceipt && data.receiptNumber && (
							<ConfirmationField label='Receipt #' value={data.receiptNumber} />
						)}
						{!isSalesReceipt && (
							<ConfirmationField label='Reference' value={data.reference} />
						)}
						<ConfirmationField label='Date' value={data.dateDeposited} />
						{!isSalesReceipt && (
							<ConfirmationField label='Bank' value={data.bankName} />
						)}
						{isSalesReceipt && data.paymentMode && (
							<ConfirmationField label='Payment' value={data.paymentMode} />
						)}
						{data.depositorName && (
							<ConfirmationField
								label={isSalesReceipt ? 'Paid By' : 'Depositor'}
								value={data.depositorName}
							/>
						)}
						{!isSalesReceipt && data.transactionNumber && (
							<ConfirmationField
								label='Trans No.'
								value={data.transactionNumber}
							/>
						)}
					</Stack>
				</Stack>
			</Paper>
			<RawData data={data} />
		</SimpleGrid>
	);
}

function RawData({
	data,
}: {
	data: IdentityDocumentResult | CertificateDocumentResult | ReceiptResult;
}) {
	return (
		<Paper withBorder radius='md' p='md'>
			<Stack gap='xs'>
				<Text size='sm' fw={500} c='dimmed'>
					Raw Analysis Data
				</Text>
				<ScrollArea.Autosize mah={400}>
					<Code block>{JSON.stringify(data, null, 2)}</Code>
				</ScrollArea.Autosize>
			</Stack>
		</Paper>
	);
}
