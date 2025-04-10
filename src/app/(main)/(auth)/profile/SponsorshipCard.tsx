'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  getSponsoredStudent,
  updateStudentSponsorship,
} from '@/server/sponsors/actions';
import { findAllSponsors } from '@/server/sponsors/actions';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pencil } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { terms } from '@/db/schema';

type Props = {
  stdNo: number;
  term: NonNullable<typeof terms.$inferSelect>;
};

export default function StudentSponsorshipCard({ stdNo, term }: Props) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSponsor, setSelectedSponsor] = useState<string>('');
  const [borrowerNo, setBorrowerNo] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const {
    data: sponsorship,
    isLoading,
    refetch: refetchSponsorship,
  } = useQuery({
    queryKey: ['sponsoredStudent', stdNo, term.id],
    queryFn: () => getSponsoredStudent(stdNo, term.id),
    enabled: !!term.id,
  });

  const { data: sponsorsData } = useQuery({
    queryKey: ['sponsors'],
    queryFn: () => findAllSponsors(1),
    select: ({ items }) => items,
  });

  const handleEditClick = () => {
    if (sponsorship) {
      setSelectedSponsor(sponsorship.sponsor?.name || '');
      setBorrowerNo(sponsorship.borrowerNo || '');
    }
    setIsEditDialogOpen(true);
  };

  const handleSponsorChange = (value: string) => {
    setSelectedSponsor(value);
    if (value !== 'NMDS') {
      setBorrowerNo('');
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedSponsor) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please select a sponsor',
      });
      return;
    }

    if (selectedSponsor === 'NMDS' && !borrowerNo) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please enter a borrower number for NMDS',
      });
      return;
    }

    try {
      setIsSaving(true);

      await updateStudentSponsorship({
        stdNo,
        termId: term.id,
        sponsorName: selectedSponsor,
        borrowerNo: selectedSponsor === 'NMDS' ? borrowerNo : undefined,
      });

      refetchSponsorship();
      setIsEditDialogOpen(false);
      refetchSponsorship();
    } catch (error) {
      console.error('Error updating sponsorship:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          'Failed to update sponsorship information. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center justify-between font-semibold'>
            Sponsorship Details
            <Button
              variant='ghost'
              size='sm'
              onClick={handleEditClick}
              disabled={isLoading}
            >
              <Pencil className='mr-1 size-2' />
              Edit
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='text-sm'>Loading sponsorship details...</div>
          ) : sponsorship ? (
            <dl className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <div>
                <dt className='text-sm font-medium text-muted-foreground'>
                  Sponsor
                </dt>
                <dd className='text-sm font-semibold'>
                  {sponsorship.sponsor?.name || 'Not specified'}
                </dd>
              </div>
              {sponsorship.borrowerNo && (
                <div>
                  <dt className='text-sm font-medium text-muted-foreground'>
                    Borrower Number
                  </dt>
                  <dd className='text-sm font-semibold'>
                    {sponsorship.borrowerNo}
                  </dd>
                </div>
              )}
            </dl>
          ) : (
            <div className='text-sm'>
              No sponsorship information available for the current term.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>Edit Sponsorship Details</DialogTitle>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='sponsor' className='text-right'>
                Sponsor
              </Label>
              <div className='col-span-3'>
                <Select
                  value={selectedSponsor}
                  onValueChange={handleSponsorChange}
                >
                  <SelectTrigger id='sponsor'>
                    <SelectValue placeholder='Select a sponsor' />
                  </SelectTrigger>
                  <SelectContent>
                    {sponsorsData?.map((sponsor) => (
                      <SelectItem key={sponsor.id} value={sponsor.name}>
                        {sponsor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedSponsor === 'NMDS' && (
              <div className='grid grid-cols-4 items-center gap-4'>
                <Label htmlFor='borrowerNo' className='text-right'>
                  Borrower No
                </Label>
                <Input
                  id='borrowerNo'
                  value={borrowerNo}
                  onChange={(e) => setBorrowerNo(e.target.value)}
                  className='col-span-3'
                  placeholder='Enter borrower number'
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveChanges} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
