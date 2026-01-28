'use client';

import { Button, Group, Modal, Select, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { documentTypeEnum } from '@registry/_database';
import { IconUpload } from '@tabler/icons-react';
import { nanoid } from 'nanoid';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import type { DocumentAnalysisResult } from '@/core/integrations/ai/documents';
import { uploadDocument } from '@/core/integrations/storage';
import {
	DocumentUpload,
	type DocumentUploadResult,
} from '@/shared/ui/DocumentUpload';
import {
	createAcademicRecordFromDocument,
	getDocumentFolder,
	saveApplicantDocument,
	updateApplicantFromIdentity,
} from '../_server/actions';

type DocumentType = (typeof documentTypeEnum.enumValues)[number];

const TYPE_OPTIONS = documentTypeEnum.enumValues.map((t) => ({
	value: t,
	label: t.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
}));

function getFileExtension(name: string) {
	const index = name.lastIndexOf('.');
	if (index === -1 || index === name.length - 1) return '';
	return name.slice(index);
}

function mapDocumentTypeFromAI(
	result: DocumentAnalysisResult
): DocumentType | null {
	if (result.category === 'identity') {
		return result.documentType === 'identity'
			? 'identity'
			: result.documentType === 'passport_photo'
				? 'passport_photo'
				: null;
	}
	if (result.category === 'academic') {
		switch (result.documentType) {
			case 'certificate':
				return 'certificate';
			case 'transcript':
				return 'transcript';
			case 'academic_record':
				return 'academic_record';
			case 'recommendation_letter':
				return 'recommendation_letter';
			default:
				return 'certificate';
		}
	}
	if (result.category === 'other') {
		switch (result.documentType) {
			case 'proof_of_payment':
				return 'proof_of_payment';
			case 'personal_statement':
				return 'personal_statement';
			case 'medical_report':
				return 'medical_report';
			case 'enrollment_letter':
				return 'enrollment_letter';
			case 'clearance_form':
				return 'clearance_form';
			default:
				return 'other';
		}
	}
	return null;
}

type UploadModalProps = {
	opened: boolean;
	onClose: () => void;
	applicantId: string;
};

export function UploadModal({
	opened,
	onClose,
	applicantId,
}: UploadModalProps) {
	const router = useRouter();
	const [type, setType] = useState<DocumentType | null>(null);
	const [uploadResult, setUploadResult] =
		useState<DocumentUploadResult<'any'> | null>(null);
	const [saving, setSaving] = useState(false);

	function handleUploadComplete(result: DocumentUploadResult<'any'>) {
		setUploadResult(result);
		const detectedType = mapDocumentTypeFromAI(result.analysis);
		if (detectedType) {
			setType(detectedType);
		}
	}

	function handleRemove() {
		setUploadResult(null);
		setType(null);
	}

	function handleTypeChange(value: string | null) {
		setType(value as DocumentType | null);
	}

	async function handleSubmit() {
		if (!type) {
			notifications.show({
				title: 'Error',
				message: 'Please select a document type',
				color: 'red',
			});
			return;
		}

		if (!uploadResult) {
			notifications.show({
				title: 'Error',
				message: 'No file uploaded',
				color: 'red',
			});
			return;
		}

		try {
			setSaving(true);

			const folder = await getDocumentFolder(applicantId);
			const fileName = `${nanoid()}${getFileExtension(uploadResult.file.name)}`;
			await uploadDocument(uploadResult.file, fileName, folder);

			const result = uploadResult.analysis;

			await saveApplicantDocument({
				applicantId,
				fileName,
				type,
			});

			if (result.category === 'identity' && type === 'identity') {
				try {
					await updateApplicantFromIdentity(applicantId, {
						fullName: result.fullName,
						dateOfBirth: result.dateOfBirth,
						nationalId: result.nationalId,
						nationality: result.nationality,
						gender: result.gender,
						birthPlace: result.birthPlace,
						address: result.address,
					});
					notifications.show({
						title: 'Personal Info Updated',
						message:
							'Applicant information has been updated from the identity document',
						color: 'blue',
					});
				} catch {
					console.error('Failed to update applicant info');
				}
			}

			if (
				result.category === 'academic' &&
				(type === 'certificate' ||
					type === 'transcript' ||
					type === 'academic_record')
			) {
				if (result.examYear && result.institutionName) {
					try {
						await createAcademicRecordFromDocument(applicantId, {
							institutionName: result.institutionName,
							examYear: result.examYear,
							certificateType: result.certificateType,
							certificateNumber: result.certificateNumber,
							subjects: result.subjects,
							overallClassification: result.overallClassification,
						});
						notifications.show({
							title: 'Academic Record Created',
							message:
								'A new academic record has been created from the document',
							color: 'blue',
						});
					} catch {
						console.error('Failed to create academic record');
					}
				}
			}

			notifications.show({
				title: 'Success',
				message: 'Document saved successfully',
				color: 'green',
			});

			router.refresh();
			handleClose();
		} catch (error) {
			console.error('Save error:', error);
			notifications.show({
				title: 'Error',
				message: 'Failed to save document',
				color: 'red',
			});
		} finally {
			setSaving(false);
		}
	}

	function handleClose() {
		if (saving) return;
		setUploadResult(null);
		setType(null);
		onClose();
	}

	const isReady = !!uploadResult;

	return (
		<Modal
			opened={opened}
			onClose={handleClose}
			title='Upload Document'
			closeOnClickOutside={!saving}
			closeOnEscape={!saving}
		>
			<Stack gap='lg'>
				<Select
					label='Document Type'
					placeholder={!isReady ? 'Will be detected...' : 'Select type'}
					data={TYPE_OPTIONS}
					value={type}
					onChange={handleTypeChange}
					required
				/>

				<DocumentUpload
					type='any'
					onUploadComplete={handleUploadComplete}
					onRemove={handleRemove}
					disabled={saving}
				/>

				<Group justify='flex-end' mt='md'>
					<Button variant='subtle' onClick={handleClose} disabled={saving}>
						Cancel
					</Button>
					<Button
						leftSection={<IconUpload size={16} />}
						onClick={handleSubmit}
						loading={saving}
						disabled={!type || !isReady}
					>
						Save
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}
