'use client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCurrentTerm } from '@/hooks/use-current-term';
import { useToast } from '@/hooks/use-toast';
import { createClearanceRequest } from '@/server/clearance-requests/actions';
import { getRegistrationRequestByStdNo } from '@/server/registration-requests/actions';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Check, Clock } from 'lucide-react';
import { ModuleStatus } from '@/db/schema';

type Props = {
  stdNo: number;
};

export default function ClearanceRequestForm({ stdNo }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const { currentTerm } = useCurrentTerm();

  const { data: modules, isLoading } = useQuery({
    queryKey: ['studentModules', stdNo, currentTerm?.id],
    queryFn: async () => {
      if (!currentTerm?.id) throw new Error('Current term not found');
      return getRegistrationRequestByStdNo(stdNo, currentTerm.id);
    },
    select: (data) => data?.requestedModules,
    enabled: !!currentTerm?.id,
  });

  async function handleSubmit() {
    try {
      if (!currentTerm) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Missing required information (current term)',
        });
        return;
      }

      await createClearanceRequest({
        termId: currentTerm.id,
        stdNo,
      });

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
            {isLoading ? (
              <div className='flex items-center justify-center h-full'>
                <p className='text-sm text-muted-foreground'>
                  Loading modules...
                </p>
              </div>
            ) : modules && modules.length > 0 ? (
              <div className='space-y-4'>
                {modules.map(({ module, moduleStatus }) => (
                  <div
                    key={module.id}
                    className='flex items-start justify-between gap-4 pb-4 last:pb-0 border-b last:border-0'
                  >
                    <div className='space-y-1'>
                      <p className='text-sm font-medium'>{module.name}</p>
                      <p className='text-xs text-muted-foreground'>
                        {module.code}
                      </p>
                    </div>
                    <ModuleStatusBadge status={moduleStatus} />
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
            disabled={!currentTerm || isLoading}
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
      {status === 'Compulsory' ? (
        <Check className='w-3 h-3' />
      ) : (
        <Clock className='w-3 h-3' />
      )}
      {status}
    </Badge>
  );
}
