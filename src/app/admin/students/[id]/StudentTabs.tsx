'use client';

import { Tabs, TabsList, TabsPanel, TabsTab } from '@mantine/core';
import StudentView from './StudentView';
import AcademicsView from './AcademicsView';
import RegistrationView from './RegistrationView';
import { useLocalStorage } from '@/hooks/useLocalStorage';

type StudentTabsProps = {
  student: any;
  showRegistrationTab: boolean;
  registrationRequests: any[];
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
