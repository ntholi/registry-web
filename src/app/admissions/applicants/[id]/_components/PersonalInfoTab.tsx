'use client';

import { SimpleGrid } from '@mantine/core';
import { formatDate } from '@/shared/lib/utils/dates';
import { DetailsViewBody, FieldView } from '@/shared/ui/adease';

type Props = {
	fullName: string;
	dateOfBirth: string | null;
	nationalId: string | null;
	nationality: string;
	birthPlace: string | null;
	religion: string | null;
	address: string | null;
};

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
		<DetailsViewBody mt={'xl'} pt={0}>
			<FieldView label='Full Name'>{fullName}</FieldView>
			<SimpleGrid cols={{ base: 1, sm: 2 }} verticalSpacing='xl'>
				<FieldView label='Date of Birth'>{formatDate(dateOfBirth)}</FieldView>
				<FieldView label='National ID'>{nationalId}</FieldView>
				<FieldView label='Nationality'>{nationality}</FieldView>
				<FieldView label='Birth Place'>{birthPlace}</FieldView>
				<FieldView label='Religion'>{religion}</FieldView>
			</SimpleGrid>
			<FieldView label='Address' mt='md'>
				{address}
			</FieldView>
		</DetailsViewBody>
	);
}
