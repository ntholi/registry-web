import { Badge, Group, Table, Text } from '@mantine/core';
import { notFound } from 'next/navigation';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';
import { deleteCertificateType, getCertificateType } from '../_server/actions';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function CertificateTypeDetails({ params }: Props) {
	const { id } = await params;
	const item = await getCertificateType(Number(id));

	if (!item) {
		return notFound();
	}

	return (
		<DetailsView>
			<DetailsViewHeader
				title='Certificate Type'
				queryKey={['certificate-types']}
				handleDelete={async () => {
					'use server';
					await deleteCertificateType(Number(id));
				}}
			/>
			<DetailsViewBody>
				<FieldView label='Name'>{item.name}</FieldView>
				<FieldView label='Description'>
					{item.description || (
						<Text size='sm' c='dimmed'>
							No description
						</Text>
					)}
				</FieldView>
				<FieldView label='LQF Level'>
					<Badge variant='light'>Level {item.lqfLevel}</Badge>
				</FieldView>

				{item.lqfLevel === 4 ? (
					<FieldView label='Grade Mappings'>
						{item.gradeMappings && item.gradeMappings.length > 0 ? (
							<Table>
								<Table.Thead>
									<Table.Tr>
										<Table.Th>Original Grade</Table.Th>
										<Table.Th>Standard Grade (LGCSE)</Table.Th>
									</Table.Tr>
								</Table.Thead>
								<Table.Tbody>
									{item.gradeMappings.map((mapping) => (
										<Table.Tr key={mapping.id}>
											<Table.Td>{mapping.originalGrade}</Table.Td>
											<Table.Td>
												<Badge variant='outline'>{mapping.standardGrade}</Badge>
											</Table.Td>
										</Table.Tr>
									))}
								</Table.Tbody>
							</Table>
						) : (
							<Text size='sm' c='dimmed'>
								No grade mappings defined
							</Text>
						)}
					</FieldView>
				) : (
					<FieldView label='Assessment Type'>
						<Group gap='xs'>
							<Text size='sm'>Uses result classifications:</Text>
							{['Distinction', 'Merit', 'Credit', 'Pass', 'Fail'].map(
								(classification) => (
									<Badge key={classification} variant='outline' size='sm'>
										{classification}
									</Badge>
								)
							)}
						</Group>
					</FieldView>
				)}
			</DetailsViewBody>
		</DetailsView>
	);
}
