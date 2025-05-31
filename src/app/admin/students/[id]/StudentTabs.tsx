'use client';

import { useLocalStorage } from '@/hooks/useLocalStorage';
import { getRegistrationRequestsByStudent } from '@/server/registration-requests/actions';
import { getStudent } from '@/server/students/actions';
import { Box, Tabs, TabsList, TabsPanel, TabsTab } from '@mantine/core';
import AcademicsView from './AcademicsView';
import RegistrationView from './RegistrationView';
import StatementOfResultsPrinter from './statements/StatementOfResultsPrinter';
import StudentView from './StudentView';

type StudentTabsProps = {
  student: NonNullable<Awaited<ReturnType<typeof getStudent>>>;
  showRegistrationTab: boolean;
  registrationRequests: Awaited<
    ReturnType<typeof getRegistrationRequestsByStudent>
  >;
};

export function StudentTabs({
  student,
  showRegistrationTab,
  registrationRequests,
}: StudentTabsProps) {
  const [activeTab, setActiveTab] = useLocalStorage<string | null>(
    'studentDetailsTab',
    'academics',
  );

  return (
    <Tabs value={activeTab} onChange={setActiveTab} variant='outline' mt={'xl'}>
      <TabsList>
        <TabsTab value='academics'>Academics</TabsTab>
        <TabsTab value='info'>Student</TabsTab>
        {showRegistrationTab && (
          <TabsTab value='registration'>Registration</TabsTab>
        )}
        <Box ml='auto'>
          <StatementOfResultsPrinter student={student} />
        </Box>
      </TabsList>
      <TabsPanel value='academics' pt={'xl'} p={'sm'}>
        <AcademicsView student={student} showMarks />
      </TabsPanel>
      <TabsPanel value='info' pt={'xl'} p={'sm'}>
        <StudentView student={student} />
      </TabsPanel>
      <TabsPanel value='registration' pt={'xl'} p={'sm'}>
        <RegistrationView registrationRequests={registrationRequests} />
      </TabsPanel>
    </Tabs>
  );
}
