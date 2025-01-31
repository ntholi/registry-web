'use client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCurrentTerm } from '@/hooks/use-current-term';
import { useToast } from '@/hooks/use-toast';
import { createClearanceRequest } from '@/server/clearance-requests/actions';
import { useRouter } from 'next/navigation';

type Props = {
  stdNo: number;
};

export default function ClearanceRequestForm({ stdNo }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const { currentTerm } = useCurrentTerm();

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
      <CardContent className='space-y-4'>
        <div className='space-y-2'>
          <p className='text-sm font-medium'>Term</p>
          <p className='text-sm text-muted-foreground'>
            {currentTerm?.name || 'Loading...'}
          </p>
        </div>
        <div className='space-y-2'>
          <p className='text-sm font-medium'>Student Number</p>
          <p className='text-sm text-muted-foreground'>
            {stdNo || 'Loading...'}
          </p>
        </div>
        <div className='flex justify-end'>
          <Button
            onClick={handleSubmit}
            disabled={!currentTerm}
            className='w-full sm:w-auto'
          >
            Submit Request
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
