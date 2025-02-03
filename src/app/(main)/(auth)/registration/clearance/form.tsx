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
import { ModuleStatus } from '@/db/schema';
import { useCurrentTerm } from '@/hooks/use-current-term';
import { useToast } from '@/hooks/use-toast';
import { createRegistrationWithModules } from '@/server/registration-requests/actions';
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';

type Props = {
  stdNo: number;
};

type Module = {
  name: string;
  code: string;
  status: ModuleStatus;
  id: number;
};

export default function ClearanceRequestForm({ stdNo }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const { currentTerm } = useCurrentTerm();

  const [modules, setStoredModules] = React.useState<Array<Module>>([]);

  React.useEffect(() => {
    const stored = sessionStorage.getItem('selectedModules');
    if (stored) {
      console.log({ stored });
      setStoredModules(JSON.parse(stored));
    }
  }, []);

  async function handleSubmit() {
    try {
      if (!currentTerm) throw new Error('No Current Term');
      await createRegistrationWithModules({
        termId: currentTerm.id,
        stdNo,
        modules,
      });

      sessionStorage.removeItem('selectedModules');
      toast({
        title: 'Success',
        description: 'Clearance request submitted successfully',
      });

      router.push('/clearance');
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to submit clearance request',
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
          <p className='text-sm font-medium'>Term</p>
          <p className='text-sm text-muted-foreground'>
            {currentTerm?.name || 'Loading...'}
          </p>
        </div>
        <div className='space-y-1'>
          <p className='text-sm font-medium'>Student Number</p>
          <p className='text-sm text-muted-foreground'>
            {stdNo || 'Loading...'}
          </p>
        </div>

        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <p className='text-sm font-medium'>Enrolled Modules</p>
            <p className='text-xs text-muted-foreground'>
              {modules?.length || 0} modules
            </p>
          </div>

          <ScrollArea className='h-[200px] rounded-md border p-4'>
            {modules && modules.length > 0 ? (
              <div className='space-y-4'>
                {modules.map((it) => (
                  <div
                    key={it.id}
                    className='flex items-start justify-between gap-4 pb-4 last:pb-0 border-b last:border-0'
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
              <div className='flex items-center justify-center h-full'>
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
            disabled={!currentTerm?.id}
            className='w-full sm:w-auto'
          >
            Submit Request
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ModuleStatusBadge({ status }: { status: ModuleStatus }) {
  return (
    <Badge
      variant={status === 'Compulsory' ? 'secondary' : 'destructive'}
      className='flex items-center gap-1'
    >
      <Check className='w-3 h-3' />
      {status}
    </Badge>
  );
}
