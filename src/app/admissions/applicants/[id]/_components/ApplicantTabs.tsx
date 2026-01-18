'use client';

import { Tabs, TabsPanel, TabsTab } from '@mantine/core';
import {
	IconCertificate,
	IconFileText,
	IconPhone,
	IconUser,
	IconUsers,
} from '@tabler/icons-react';
import { useQueryState } from 'nuqs';
import ScrollableTabsList from '@/shared/ui/ScrollableTabsList';
import type { getApplicant } from '../../_server/actions';
import AcademicRecordsTab from './AcademicRecordsTab';
import AddAcademicRecordAction from './AddAcademicRecordAction';
import AddDocumentAction from './AddDocumentAction';
import AddGuardianAction from './AddGuardianAction';
import AddPhoneAction from './AddPhoneAction';
import ContactTab from './ContactTab';
import DocumentsTab from './DocumentsTab';
import GuardiansTab from './GuardiansTab';
import PersonalInfoTab from './PersonalInfoTab';

type Props = {
	applicant: NonNullable<Awaited<ReturnType<typeof getApplicant>>>;
};

export default function ApplicantTabs({ applicant }: Props) {
	const [activeTab, setActiveTab] = useQueryState('tab', {
		defaultValue: 'personal',
	});

	function renderTabActions() {
		switch (activeTab) {
			case 'contact':
				return <AddPhoneAction applicantId={applicant.id} />;
			case 'guardians':
				return <AddGuardianAction applicantId={applicant.id} />;
			case 'academic':
				return <AddAcademicRecordAction applicantId={applicant.id} />;
			case 'documents':
				return <AddDocumentAction applicantId={applicant.id} />;
			default:
				return null;
		}
	}

	return (
		<Tabs value={activeTab} onChange={setActiveTab} variant='outline'>
			<ScrollableTabsList actions={renderTabActions()}>
				<TabsTab value='personal' leftSection={<IconUser size={16} />}>
					Personal
				</TabsTab>
				<TabsTab value='contact' leftSection={<IconPhone size={16} />}>
					Contact
				</TabsTab>
				<TabsTab value='guardians' leftSection={<IconUsers size={16} />}>
					Guardians
				</TabsTab>
				<TabsTab value='academic' leftSection={<IconCertificate size={16} />}>
					Academic
				</TabsTab>
				<TabsTab value='documents' leftSection={<IconFileText size={16} />}>
					Documents
				</TabsTab>
			</ScrollableTabsList>

			<TabsPanel value='personal' pt='lg'>
				<PersonalInfoTab
					fullName={applicant.fullName}
					dateOfBirth={applicant.dateOfBirth}
					nationalId={applicant.nationalId}
					nationality={applicant.nationality}
					birthPlace={applicant.birthPlace}
					religion={applicant.religion}
					address={applicant.address}
				/>
			</TabsPanel>

			<TabsPanel value='contact' pt='lg'>
				<ContactTab phones={applicant.phones} />
			</TabsPanel>

			<TabsPanel value='guardians' pt='lg'>
				<GuardiansTab guardians={applicant.guardians} />
			</TabsPanel>

			<TabsPanel value='academic' pt='lg'>
				<AcademicRecordsTab records={applicant.academicRecords} />
			</TabsPanel>

			<TabsPanel value='documents' pt='lg'>
				<DocumentsTab documents={applicant.documents} />
			</TabsPanel>
		</Tabs>
	);
}
