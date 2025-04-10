import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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

interface SponsorSelectProps {
  onSponsorChange: (sponsorData: {
    sponsorId: number;
    sponsorName: string;
    borrowerNo?: string;
  }) => void;
}

export default function SponsorSelect({ onSponsorChange }: SponsorSelectProps) {
  const [selectedSponsorId, setSelectedSponsorId] = useState<string>('');
  const [borrowerNo, setBorrowerNo] = useState<string>('');

  const { data: sponsors } = useQuery({
    queryKey: ['sponsors'],
    queryFn: () => findAllSponsors(1),
    select: ({ items }) => items,
  });

  const handleSponsorChange = (value: string) => {
    setSelectedSponsorId(value);
    const selectedSponsor = sponsors?.find(
      (sponsor) => sponsor.id === parseInt(value),
    );

    if (!selectedSponsor) return;

    if (selectedSponsor.name === 'NMDS') {
      setBorrowerNo('');
    } else {
      onSponsorChange({
        sponsorId: selectedSponsor.id,
        sponsorName: selectedSponsor.name,
      });
    }
  };

  const handleBorrowerNoChange = (value: string) => {
    setBorrowerNo(value);
    const selectedSponsor = sponsors?.find(
      (sponsor) => sponsor.id === parseInt(selectedSponsorId),
    );

    if (selectedSponsor?.name === 'NMDS' && value.trim()) {
      onSponsorChange({
        sponsorId: selectedSponsor.id,
        sponsorName: selectedSponsor.name,
        borrowerNo: value,
      });
    }
  };

  const getNMDSSponsor = () => {
    return sponsors?.find((sponsor) => sponsor.name === 'NMDS');
  };

  return (
    <div className='space-y-4'>
      <div className='space-y-2'>
        <Label htmlFor='sponsor'>Sponsor</Label>
        <Select value={selectedSponsorId} onValueChange={handleSponsorChange}>
          <SelectTrigger id='sponsor'>
            <SelectValue placeholder='Select a sponsor' />
          </SelectTrigger>
          <SelectContent>
            {sponsors?.map((sponsor) => (
              <SelectItem key={sponsor.id} value={sponsor.id.toString()}>
                {sponsor.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedSponsorId &&
        getNMDSSponsor()?.id.toString() === selectedSponsorId && (
          <div className='space-y-2'>
            <Label htmlFor='borrowerNo'>NMDS Borrower Number</Label>
            <Input
              id='borrowerNo'
              value={borrowerNo}
              onChange={(e) => handleBorrowerNoChange(e.target.value)}
              placeholder='Enter your NMDS borrower number'
              required
            />
          </div>
        )}
    </div>
  );
}
