'use client';

import { Divider, Stack, Text } from '@mantine/core';
import type { applicants } from '@/core/database';
import { updateApplicantField } from '../_server/actions';
import EditableField from './EditableField';

type Applicant = typeof applicants.$inferSelect;

type Props = {
	applicant: Applicant;
};

const GENDER_OPTIONS = [
	{ value: 'Male', label: 'Male' },
	{ value: 'Female', label: 'Female' },
];

export default function IdentityDataPanel({ applicant }: Props) {
	const handleSave = async (field: string, value: string | null) => {
		await updateApplicantField(applicant.id, field, value);
	};

	return (
		<Stack gap='md'>
			<Text size='sm' fw={600} c='dimmed' tt='uppercase' lts={1}>
				Identity Information
			</Text>
			<Divider />
			<EditableField
				label='Full Name'
				value={applicant.fullName}
				onSave={(v) => handleSave('fullName', v)}
			/>
			<EditableField
				label='Date of Birth'
				value={applicant.dateOfBirth}
				onSave={(v) => handleSave('dateOfBirth', v)}
				inputType='date'
				placeholder='YYYY-MM-DD'
			/>
			<EditableField
				label='National ID'
				value={applicant.nationalId}
				onSave={(v) => handleSave('nationalId', v)}
			/>
			<EditableField
				label='Nationality'
				value={applicant.nationality}
				onSave={(v) => handleSave('nationality', v)}
			/>
			<EditableField
				label='Gender'
				value={applicant.gender}
				onSave={(v) => handleSave('gender', v)}
				inputType='select'
				selectOptions={GENDER_OPTIONS}
			/>
			<EditableField
				label='Birth Place'
				value={applicant.birthPlace}
				onSave={(v) => handleSave('birthPlace', v)}
			/>
			<EditableField
				label='Address'
				value={applicant.address}
				onSave={(v) => handleSave('address', v)}
			/>
		</Stack>
	);
}
