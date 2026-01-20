'use client';

import {
	completeApplication,
	uploadAndAnalyzeDocument,
} from '@admissions/applications';
import {
	ActionIcon,
	Badge,
	Box,
	Button,
	Card,
	Container,
	Grid,
	Group,
	Image,
	Paper,
	Progress,
	Stack,
	Stepper,
	Text,
	ThemeIcon,
	Title,
	useMantineColorScheme,
} from '@mantine/core';
import {
	Dropzone,
	type FileRejection,
	type FileWithPath,
	IMAGE_MIME_TYPE,
	MIME_TYPES,
} from '@mantine/dropzone';
import { notifications } from '@mantine/notifications';
import {
	IconArrowRight,
	IconCheck,
	IconChevronLeft,
	IconFileTypePdf,
	IconId,
	IconSchool,
	IconTrash,
	IconUpload,
} from '@tabler/icons-react';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import type { DocumentAnalysisResult } from '@/core/integrations/ai';
import ButtonLink from '@/shared/ui/ButtonLink';
import Link from '@/shared/ui/Link';

type ApplicantInfo =
	| {
			id: string;
			fullName: string;
			nationalId?: string | null;
			dateOfBirth?: string | null;
			nationality?: string | null;
			gender?: string | null;
			documents?: { document: { type: string | null } }[];
			academicRecords?: { certificateType?: { name: string } | null }[];
	  }
	| null
	| undefined;

type UserInfo = {
	id?: string;
	name?: string | null;
	email?: string | null;
	image?: string | null;
};

type Props = {
	applicant: ApplicantInfo;
	user: UserInfo;
};

type UploadedDoc = {
	id: string;
	fileName: string;
	type: string;
	category: 'identity' | 'academic' | 'other';
	analysisResult: DocumentAnalysisResult;
};

const ACCEPTED_MIME_TYPES = [...IMAGE_MIME_TYPE, MIME_TYPES.pdf];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function DocumentUploadClient({ applicant, user }: Props) {
	const { colorScheme } = useMantineColorScheme();
	const isDark = colorScheme === 'dark';
	const router = useRouter();

	const [active, setActive] = useState(0);
	const [uploading, setUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState<string | null>(null);
	const [identityDocs, setIdentityDocs] = useState<UploadedDoc[]>([]);
	const [academicDocs, setAcademicDocs] = useState<UploadedDoc[]>([]);

	const hasIdentity =
		identityDocs.length > 0 ||
		applicant?.documents?.some((d) => d.document.type === 'identity');
	const hasAcademic =
		academicDocs.length > 0 || (applicant?.academicRecords?.length ?? 0) > 0;

	async function handleUpload(files: FileWithPath[]) {
		if (files.length === 0) return;

		setUploading(true);
		setUploadProgress('Uploading...');

		for (const file of files) {
			try {
				const formData = new FormData();
				formData.append('file', file);

				setUploadProgress('Analyzing document...');
				const { result, type, fileName } =
					await uploadAndAnalyzeDocument(formData);

				const doc: UploadedDoc = {
					id: fileName,
					fileName,
					type,
					category: result.category,
					analysisResult: result,
				};

				if (result.category === 'identity') {
					setIdentityDocs((prev) => [...prev, doc]);
				} else if (result.category === 'academic') {
					setAcademicDocs((prev) => [...prev, doc]);
				}

				notifications.show({
					title: 'Document Uploaded',
					message: `${result.category === 'identity' ? 'Identity' : 'Academic'} document processed successfully`,
					color: 'green',
				});

				router.refresh();
			} catch (error) {
				notifications.show({
					title: 'Upload Failed',
					message:
						error instanceof Error
							? error.message
							: 'Failed to upload document',
					color: 'red',
				});
			}
		}

		setUploading(false);
		setUploadProgress(null);
	}

	function handleReject(_rejections: FileRejection[]) {
		notifications.show({
			title: 'File Rejected',
			message: 'Please upload PDF or image files under 10MB',
			color: 'red',
		});
	}

	function removeDoc(id: string, category: 'identity' | 'academic') {
		if (category === 'identity') {
			setIdentityDocs((prev) => prev.filter((d) => d.id !== id));
		} else {
			setAcademicDocs((prev) => prev.filter((d) => d.id !== id));
		}
	}

	async function handleComplete() {
		await completeApplication();
	}

	return (
		<Box mih='100vh' bg={isDark ? 'dark.8' : 'gray.0'}>
			<Header isDark={isDark} user={user} />

			<Container size='lg' py='xl' pt={100}>
				<Stack gap='xl'>
					<Stack gap='xs'>
						<Group gap='xs'>
							<ButtonLink
								href='/apply'
								variant='subtle'
								size='compact-sm'
								leftSection={<IconChevronLeft size={16} />}
								c='dimmed'
							>
								Back
							</ButtonLink>
						</Group>
						<Title order={1}>Start Your Application</Title>
						<Text c='dimmed' size='lg'>
							Upload your documents and we&apos;ll extract your information
							automatically
						</Text>
					</Stack>

					<Stepper
						active={active}
						onStepClick={setActive}
						allowNextStepsSelect={false}
					>
						<Stepper.Step
							label='Identity'
							description='Upload ID document'
							icon={<IconId size={18} />}
							completedIcon={<IconCheck size={18} />}
						>
							<StepContent
								title='Upload Identity Document'
								description='Upload your national ID, passport, or birth certificate. We will extract your personal information automatically.'
								icon={<IconId size={40} />}
								docs={identityDocs}
								onUpload={handleUpload}
								onReject={handleReject}
								onRemove={(id) => removeDoc(id, 'identity')}
								uploading={uploading}
								uploadProgress={uploadProgress}
								isDark={isDark}
								extractedInfo={
									applicant?.nationalId
										? {
												'Full Name': applicant.fullName,
												'National ID': applicant.nationalId,
												'Date of Birth': applicant.dateOfBirth,
												Nationality: applicant.nationality,
												Gender: applicant.gender,
											}
										: undefined
								}
							/>
						</Stepper.Step>

						<Stepper.Step
							label='Qualifications'
							description='Upload certificates'
							icon={<IconSchool size={18} />}
							completedIcon={<IconCheck size={18} />}
						>
							<StepContent
								title='Upload Academic Documents'
								description='Upload your certificates, transcripts, or result slips. We will extract your qualifications and grades automatically.'
								icon={<IconSchool size={40} />}
								docs={academicDocs}
								onUpload={handleUpload}
								onReject={handleReject}
								onRemove={(id) => removeDoc(id, 'academic')}
								uploading={uploading}
								uploadProgress={uploadProgress}
								isDark={isDark}
								extractedInfo={
									applicant?.academicRecords &&
									applicant.academicRecords.length > 0
										? {
												Qualifications: applicant.academicRecords
													.map((r) => r.certificateType?.name)
													.filter(Boolean)
													.join(', '),
											}
										: undefined
								}
							/>
						</Stepper.Step>

						<Stepper.Completed>
							<CompletedStep
								applicant={applicant}
								identityDocs={identityDocs}
								academicDocs={academicDocs}
								onComplete={handleComplete}
							/>
						</Stepper.Completed>
					</Stepper>

					<Group justify='space-between' mt='xl'>
						<Button
							variant='default'
							onClick={() => setActive((prev) => Math.max(0, prev - 1))}
							disabled={active === 0}
						>
							Back
						</Button>

						{active < 2 && (
							<Button
								onClick={() => setActive((prev) => prev + 1)}
								disabled={
									(active === 0 && !hasIdentity) ||
									(active === 1 && !hasAcademic)
								}
								rightSection={<IconArrowRight size={18} />}
							>
								{active === 0
									? hasIdentity
										? 'Continue to Qualifications'
										: 'Upload Identity First'
									: hasAcademic
										? 'Review & Submit'
										: 'Upload Qualifications First'}
							</Button>
						)}
					</Group>
				</Stack>
			</Container>
		</Box>
	);
}

type HeaderProps = {
	isDark: boolean;
	user: UserInfo;
};

function Header({ isDark, user }: HeaderProps) {
	return (
		<Box
			component='header'
			py='md'
			px='xl'
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				right: 0,
				zIndex: 100,
				backdropFilter: 'blur(10px)',
				backgroundColor: isDark
					? 'rgba(26, 27, 30, 0.8)'
					: 'rgba(255, 255, 255, 0.8)',
				borderBottom: '1px solid var(--mantine-color-default-border)',
			}}
		>
			<Container size='xl'>
				<Group justify='space-between'>
					<Link href='/apply'>
						<Image
							src={isDark ? '/images/logo-dark.png' : '/images/logo-light.png'}
							alt='Limkokwing University'
							width={180}
							height={45}
							style={{ objectFit: 'contain' }}
						/>
					</Link>
					<Group gap='sm'>
						{user.image && (
							<Image
								src={user.image}
								alt={user.name || ''}
								width={32}
								height={32}
								style={{ borderRadius: '50%' }}
							/>
						)}
						<Text size='sm' fw={500}>
							{user.name}
						</Text>
					</Group>
				</Group>
			</Container>
		</Box>
	);
}

type StepContentProps = {
	title: string;
	description: string;
	icon: React.ReactNode;
	docs: UploadedDoc[];
	onUpload: (files: FileWithPath[]) => void;
	onReject: (rejections: FileRejection[]) => void;
	onRemove: (id: string) => void;
	uploading: boolean;
	uploadProgress: string | null;
	isDark: boolean;
	extractedInfo?: Record<string, string | null | undefined>;
};

function StepContent({
	title,
	description,
	icon,
	docs,
	onUpload,
	onReject,
	onRemove,
	uploading,
	uploadProgress,
	isDark,
	extractedInfo,
}: StepContentProps) {
	return (
		<Grid mt='xl' gutter='xl'>
			<Grid.Col span={{ base: 12, md: 7 }}>
				<Stack gap='lg'>
					<Paper withBorder p='xl' radius='lg'>
						<Stack gap='md' align='center'>
							<ThemeIcon size={80} radius='xl' variant='light' color='blue'>
								{icon}
							</ThemeIcon>
							<Stack gap='xs' align='center'>
								<Title order={3}>{title}</Title>
								<Text size='sm' c='dimmed' ta='center' maw={400}>
									{description}
								</Text>
							</Stack>
						</Stack>
					</Paper>

					<Paper withBorder radius='lg' p='lg'>
						<Dropzone
							onDrop={onUpload}
							onReject={onReject}
							maxSize={MAX_FILE_SIZE}
							accept={ACCEPTED_MIME_TYPES}
							disabled={uploading}
							loading={uploading}
						>
							<Group
								justify='center'
								gap='xl'
								mih={180}
								style={{ pointerEvents: 'none' }}
							>
								<Dropzone.Accept>
									<IconUpload size={50} stroke={1.5} />
								</Dropzone.Accept>
								<Dropzone.Reject>
									<IconTrash size={50} stroke={1.5} />
								</Dropzone.Reject>
								<Dropzone.Idle>
									<IconUpload
										size={50}
										stroke={1.5}
										color='var(--mantine-color-dimmed)'
									/>
								</Dropzone.Idle>

								<Stack gap={4} align='center'>
									<Text size='xl' inline fw={500}>
										{uploading ? uploadProgress : 'Drop files here'}
									</Text>
									<Text size='sm' c='dimmed'>
										PDF or images • Max 10MB
									</Text>
								</Stack>
							</Group>
						</Dropzone>

						{uploading && <Progress value={100} animated mt='md' radius='xl' />}
					</Paper>

					{docs.length > 0 && (
						<Stack gap='sm'>
							<Text fw={500}>Uploaded Documents</Text>
							{docs.map((doc) => (
								<Card key={doc.id} withBorder radius='md' padding='sm'>
									<Group justify='space-between'>
										<Group gap='sm'>
											<ThemeIcon variant='light' size='lg' radius='md'>
												{doc.type === 'identity' ? (
													<IconId size={18} />
												) : (
													<IconFileTypePdf size={18} />
												)}
											</ThemeIcon>
											<Stack gap={2}>
												<Text size='sm' fw={500}>
													{doc.type
														.replace(/_/g, ' ')
														.replace(/\b\w/g, (l) => l.toUpperCase())}
												</Text>
												<Badge size='xs' variant='light'>
													{doc.category}
												</Badge>
											</Stack>
										</Group>
										<ActionIcon
											variant='subtle'
											color='red'
											onClick={() => onRemove(doc.id)}
										>
											<IconTrash size={16} />
										</ActionIcon>
									</Group>
								</Card>
							))}
						</Stack>
					)}
				</Stack>
			</Grid.Col>

			<Grid.Col span={{ base: 12, md: 5 }}>
				{extractedInfo && Object.keys(extractedInfo).length > 0 && (
					<Paper
						withBorder
						p='xl'
						radius='lg'
						bg={isDark ? 'dark.6' : 'blue.0'}
					>
						<Stack gap='md'>
							<Group gap='xs'>
								<ThemeIcon size='sm' variant='light' color='green'>
									<IconCheck size={14} />
								</ThemeIcon>
								<Text fw={600} size='sm'>
									Extracted Information
								</Text>
							</Group>
							<Stack gap='xs'>
								{Object.entries(extractedInfo).map(([key, value]) =>
									value ? (
										<Group key={key} justify='space-between'>
											<Text size='sm' c='dimmed'>
												{key}
											</Text>
											<Text size='sm' fw={500}>
												{value}
											</Text>
										</Group>
									) : null
								)}
							</Stack>
						</Stack>
					</Paper>
				)}
			</Grid.Col>
		</Grid>
	);
}

type CompletedStepProps = {
	applicant: ApplicantInfo;
	identityDocs: UploadedDoc[];
	academicDocs: UploadedDoc[];
	onComplete: () => void;
};

function CompletedStep({
	applicant,
	identityDocs,
	academicDocs,
	onComplete,
}: CompletedStepProps) {
	return (
		<Stack gap='xl' mt='xl' align='center'>
			<ThemeIcon size={100} radius='xl' variant='light' color='green'>
				<IconCheck size={60} />
			</ThemeIcon>

			<Stack gap='xs' align='center'>
				<Title order={2}>Documents Uploaded Successfully!</Title>
				<Text c='dimmed' ta='center' maw={500}>
					Your documents have been processed and your information has been
					extracted. You can now browse available courses and submit your
					application.
				</Text>
			</Stack>

			<Paper withBorder p='xl' radius='lg' w='100%' maw={600}>
				<Stack gap='md'>
					<Text fw={600}>Application Summary</Text>

					<Group justify='space-between'>
						<Text size='sm' c='dimmed'>
							Full Name
						</Text>
						<Text size='sm' fw={500}>
							{applicant?.fullName || 'Not extracted'}
						</Text>
					</Group>

					<Group justify='space-between'>
						<Text size='sm' c='dimmed'>
							National ID
						</Text>
						<Text size='sm' fw={500}>
							{applicant?.nationalId || 'Not extracted'}
						</Text>
					</Group>

					<Group justify='space-between'>
						<Text size='sm' c='dimmed'>
							Identity Documents
						</Text>
						<Badge color='green'>
							{identityDocs.length +
								(applicant?.documents?.filter(
									(d) => d.document.type === 'identity'
								).length || 0)}{' '}
							uploaded
						</Badge>
					</Group>

					<Group justify='space-between'>
						<Text size='sm' c='dimmed'>
							Academic Records
						</Text>
						<Badge color='green'>
							{academicDocs.length + (applicant?.academicRecords?.length || 0)}{' '}
							uploaded
						</Badge>
					</Group>
				</Stack>
			</Paper>

			<Button
				size='lg'
				radius='xl'
				rightSection={<IconArrowRight size={20} />}
				onClick={onComplete}
			>
				Browse Available Courses
			</Button>
		</Stack>
	);
}
