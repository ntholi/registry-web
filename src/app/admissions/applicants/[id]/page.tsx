import { Badge, Tabs, Text } from '@mantine/core';
import {
	IconCertificate,
	IconFileText,
	IconPhone,
	IconUser,
	IconUsers,
} from '@tabler/icons-react';
import { notFound } from 'next/navigation';
import {
	DetailsView,
	DetailsViewBody,
	DetailsViewHeader,
	FieldView,
} from '@/shared/ui/adease';
import GuardianManager from '../_components/GuardianManager';
import PhoneManager from '../_components/PhoneManager';
import { deleteApplicant, getApplicant } from '../_server/actions';
import AcademicRecordsList from './academic-records/_components/AcademicRecordsList';
import DocumentsList from './documents/_components/DocumentsList';

type Props = {
	params: Promise<{ id: string }>;
};

export default async function ApplicantDetails({ params }: Props) {
	const { id } = await params;
	const item = await getApplicant(id);

	if (!item) {
		return notFound();
	}

	return (
		<DetailsView>
			<DetailsViewHeader
				title='Applicant'
				queryKey={['applicants']}
				handleDelete={async () => {
					'use server';
					await deleteApplicant(id);
				}}
			/>
			<DetailsViewBody>
				<Tabs defaultValue='personal'>
					<Tabs.List>
						<Tabs.Tab value='personal' leftSection={<IconUser size={16} />}>
							Personal Info
						</Tabs.Tab>
						<Tabs.Tab value='contact' leftSection={<IconPhone size={16} />}>
							Contact
						</Tabs.Tab>
						<Tabs.Tab value='guardians' leftSection={<IconUsers size={16} />}>
							Guardians
						</Tabs.Tab>
						<Tabs.Tab
							value='academic'
							leftSection={<IconCertificate size={16} />}
						>
							Academic Records
						</Tabs.Tab>
						<Tabs.Tab
							value='documents'
							leftSection={<IconFileText size={16} />}
						>
							Documents
						</Tabs.Tab>
					</Tabs.List>

					<Tabs.Panel value='personal' pt='md'>
						<FieldView label='Full Name'>{item.fullName}</FieldView>
						<FieldView label='Date of Birth'>{item.dateOfBirth}</FieldView>
						<FieldView label='National ID'>
							{item.nationalId || (
								<Text size='sm' c='dimmed'>
									Not provided
								</Text>
							)}
						</FieldView>
						<FieldView label='Nationality'>{item.nationality}</FieldView>
						<FieldView label='Gender'>
							<Badge variant='light'>{item.gender}</Badge>
						</FieldView>
						<FieldView label='Birth Place'>
							{item.birthPlace || (
								<Text size='sm' c='dimmed'>
									Not provided
								</Text>
							)}
						</FieldView>
						<FieldView label='Religion'>
							{item.religion || (
								<Text size='sm' c='dimmed'>
									Not provided
								</Text>
							)}
						</FieldView>
						<FieldView label='Address'>
							{item.address || (
								<Text size='sm' c='dimmed'>
									Not provided
								</Text>
							)}
						</FieldView>
					</Tabs.Panel>

					<Tabs.Panel value='contact' pt='md'>
						<PhoneManager applicantId={item.id} phones={item.phones} />
					</Tabs.Panel>

					<Tabs.Panel value='guardians' pt='md'>
						<GuardianManager applicantId={item.id} guardians={item.guardians} />
					</Tabs.Panel>

					<Tabs.Panel value='academic' pt='md'>
						<AcademicRecordsList
							applicantId={item.id}
							records={item.academicRecords}
						/>
					</Tabs.Panel>

					<Tabs.Panel value='documents' pt='md'>
						<DocumentsList applicantId={item.id} documents={item.documents} />
					</Tabs.Panel>
				</Tabs>
			</DetailsViewBody>
		</DetailsView>
	);
}
