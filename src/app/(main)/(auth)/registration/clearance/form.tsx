'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StudentModuleStatus } from '@/db/schema';
import { useToast } from '@/hooks/use-toast';
import { formatSemester } from '@/lib/utils';
import { createRegistrationWithModules } from '@/server/registration-requests/actions';
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';
import SponsorSelect from './sponsor-select';

type Props = {
  stdNo: number;
};

type Module = {
  name: string;
  code: string;
  status: StudentModuleStatus;
  id: number;
};

export default function ClearanceRequestForm({ stdNo }: Props) {
  const router = useRouter();
  const { toast } = useToast();

  const [modules, setStoredModules] = React.useState<Array<Module>>([]);
  const [sponsorData, setSponsorData] = React.useState<{
    sponsorId: number;
    sponsorName: string;
    borrowerNo?: string;
  } | null>(null);
  const [semesterInfo, setSemesterInfo] = React.useState<{
    semesterNo: number;
    semesterStatus: string;
  } | null>(null);

  React.useEffect(() => {
    const stored = sessionStorage.getItem('selectedModules');
    const storedSemesterInfo = sessionStorage.getItem('semesterInfo');
    if (stored) {
      setStoredModules(JSON.parse(stored));
    }
    if (storedSemesterInfo) {
      setSemesterInfo(JSON.parse(storedSemesterInfo));
    }
  }, []);

  async function handleSubmit() {
    try {
      if (!sponsorData?.sponsorId) throw new Error('Please select a sponsor');
      if (sponsorData.sponsorName === 'NMDS' && !sponsorData.borrowerNo) {
        throw new Error('Please enter your NMDS borrower number');
      }
      if (!semesterInfo) throw new Error('Semester information not found');

      await createRegistrationWithModules({
        stdNo,
        modules: modules.map((module) => ({
          moduleId: module.id,
          moduleStatus: module.status,
        })),
        sponsorId: sponsorData.sponsorId,
        borrowerNo: sponsorData.borrowerNo,
        semesterNumber: semesterInfo.semesterNo,
        semesterStatus: semesterInfo.semesterStatus as 'Active' | 'Repeat',
      });

      sessionStorage.removeItem('selectedModules');
      sessionStorage.removeItem('semesterInfo');
      router.push('/registration');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to submit clearance request',
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-2xl'>Request Clearance</CardTitle>
        <CardDescription>
          Submit a clearance request for the current term
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='space-y-1'>
          <p className='text-sm font-medium'>Semester</p>
          <p className='text-sm text-muted-foreground'>
            {formatSemester(semesterInfo?.semesterNo)}
          </p>
        </div>

        <SponsorSelect onSponsorChange={setSponsorData} />

        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <p className='text-sm font-medium'>Modules Requested</p>
            <p className='text-xs text-muted-foreground'>
              {modules?.length || 0} modules
            </p>
          </div>

          <ScrollArea className='h-[44vh] rounded-md border p-4'>
            {modules && modules.length > 0 ? (
              <div className='space-y-4'>
                {modules.map((it) => (
                  <div
                    key={it.id}
                    className='flex items-start justify-between gap-4 border-b pb-4 last:border-0 last:pb-0'
                  >
                    <div className='space-y-1'>
                      <p className='text-sm font-medium'>{it.name}</p>
                      <p className='text-xs text-muted-foreground'>{it.code}</p>
                    </div>
                    <ModuleStatusBadge status={it.status} />
                  </div>
                ))}
              </div>
            ) : (
              <div className='flex h-full items-center justify-center'>
                <p className='text-sm text-muted-foreground'>
                  No modules found
                </p>
              </div>
            )}
          </ScrollArea>
        </div>

        <div className='flex justify-end'>
          <Button
            onClick={handleSubmit}
            disabled={!sponsorData?.sponsorId}
            className='w-full sm:w-auto'
          >
            Submit Request
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ModuleStatusBadge({ status }: { status: StudentModuleStatus }) {
  return (
    <Badge
      variant={status === 'Compulsory' ? 'secondary' : 'destructive'}
      className='flex items-center gap-1'
    >
      <Check className='h-3 w-3' />
      {status}
    </Badge>
  );
}
