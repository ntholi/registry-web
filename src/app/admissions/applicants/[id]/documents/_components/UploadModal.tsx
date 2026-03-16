'use client';

import { Button, Group, Modal, Select, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { documentTypeEnum } from '@registry/_database';
import { IconUpload } from '@tabler/icons-react';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import {
	DocumentUpload,
	type DocumentUploadResult,
} from '@/app/apply/_components/DocumentUpload';
import type { DocumentAnalysisResult } from '@/core/integrations/ai/documents';
import { unwrap } from '@/shared/lib/actions/actionResult';
import {
	createAcademicRecordFromDocument,
	saveApplicantDocument,
	updateApplicantFromIdentity,
	uploadApplicantFile,
} from '../_server/actions';

type DocumentType = (typeof documentTypeEnum.enumValues)[number];

const TYPE_OPTIONS = documentTypeEnum.enumValues.map((t) => ({
	value: t,
	label: t.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
}));

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
			case 'academic_record':
				return 'academic_record';
			case 'recommendation_letter':
				return 'recommendation_letter';
			default:
				return 'academic_record';
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

			const fileKey = unwrap(
				await uploadApplicantFile(applicantId, uploadResult.file)
			);
			const analysis = uploadResult.analysis;
			const savedDoc = unwrap(
				await saveApplicantDocument({
					applicantId,
					fileName: uploadResult.file.name,
					fileUrl: fileKey,
					type,
				})
			);

			if (analysis.category === 'identity' && type === 'identity') {
				unwrap(
					await updateApplicantFromIdentity(applicantId, {
						fullName: analysis.fullName,
						dateOfBirth: analysis.dateOfBirth,
						nationalId: analysis.nationalId,
						nationality: analysis.nationality,
						gender: analysis.gender,
						birthPlace: analysis.birthPlace,
						address: analysis.address,
					})
				);
				notifications.show({
					title: 'Personal Info Updated',
					message:
						'Applicant information has been updated from the identity document',
					color: 'blue',
				});
			}

			if (
				analysis.category === 'academic' &&
				(type === 'certificate' || type === 'academic_record')
			) {
				if (analysis.examYear && analysis.institutionName) {
					unwrap(
						await createAcademicRecordFromDocument(
							applicantId,
							{
								institutionName: analysis.institutionName,
								examYear: analysis.examYear,
								certificateType: analysis.certificateType,
								certificateNumber: analysis.certificateNumber,
								candidateNumber: analysis.candidateNumber,
								subjects: analysis.subjects,
								overallClassification: analysis.overallClassification,
							},
							savedDoc?.document?.id
						)
					);
					notifications.show({
						title: 'Academic Record Created',
						message: 'A new academic record has been created from the document',
						color: 'blue',
					});
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
