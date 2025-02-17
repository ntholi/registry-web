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
    sponsor: string;
    borrowerNo?: string;
  }) => void;
}

export default function SponsorSelect({ onSponsorChange }: SponsorSelectProps) {
  const [selectedSponsor, setSelectedSponsor] = useState<string>('');
  const [borrowerNo, setBorrowerNo] = useState<string>('');

  const { data: sponsors } = useQuery({
    queryKey: ['sponsors'],
    queryFn: () => findAllSponsors(1),
    select: (data) => data.data,
  });

  const handleSponsorChange = (value: string) => {
    setSelectedSponsor(value);
    if (value === 'NMDS') {
      onSponsorChange({ sponsor: value }); // Initial update without borrowerNo
    } else {
      onSponsorChange({ sponsor: value });
    }
  };

  const handleBorrowerNoChange = (value: string) => {
    setBorrowerNo(value);
    if (selectedSponsor === 'NMDS') {
      onSponsorChange({ sponsor: selectedSponsor, borrowerNo: value });
    }
  };

  return (
    <div className='space-y-4'>
      <div className='space-y-2'>
        <Label htmlFor='sponsor'>Sponsor</Label>
        <Select value={selectedSponsor} onValueChange={handleSponsorChange}>
          <SelectTrigger id='sponsor'>
            <SelectValue placeholder='Select a sponsor' />
          </SelectTrigger>
          <SelectContent>
            {sponsors?.map((sponsor) => (
              <SelectItem key={sponsor.id} value={sponsor.name}>
                {sponsor.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedSponsor === 'NMDS' && (
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
