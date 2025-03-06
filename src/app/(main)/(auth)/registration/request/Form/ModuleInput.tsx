import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { AlertCircle, Info } from 'lucide-react';
import { Control } from 'react-hook-form';
import { RegisterFormSchema } from '.';
import { getStudentSemesterModules } from '../actions';

type Props = {
  control: Control<RegisterFormSchema>;
  module: Awaited<
    ReturnType<typeof getStudentSemesterModules>
  >['modules'][number];
};

export default function ModuleInput({ control, module }: Props) {
  const hasFailedPrerequisites = (module.prerequisites?.length ?? 0) > 0;

  return (
    <FormField
      key={module.id}
      control={control}
      name='modules'
      render={({ field }) => (
        <FormItem className='relative flex w-full items-start gap-2 rounded-lg border border-input p-4 shadow-sm shadow-black/5 has-[[data-state=checked]]:border-ring'>
          <FormControl>
            <Checkbox
              className='order-1 after:absolute after:inset-0'
              checked={field.value?.includes(module.id)}
              disabled={hasFailedPrerequisites}
              onCheckedChange={(checked) => {
                return checked
                  ? field.onChange([...field.value, module.id])
                  : field.onChange(
                      field.value?.filter(
                        (value: number) => value !== module.id,
                      ),
                    );
              }}
            />
          </FormControl>
          <div className='grid grow gap-1.5'>
            <div className='flex items-center gap-2'>
              <FormLabel className='text-sm sm:text-base'>
                {module.name}
              </FormLabel>
              {hasFailedPrerequisites && (
                <AlertCircle className='h-4 w-4 text-destructive' />
              )}
            </div>
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <span className='font-mono'>{module.code}</span>
              <span>•</span>
              <span className='capitalize'>{module.type}</span>
            </div>
          </div>
          <div className='absolute bottom-3 right-4'>
            {hasFailedPrerequisites ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Badge variant='destructive' className='mb-1 cursor-pointer'>
                    Prerequisites <Info className='ml-1 inline h-3 w-3' />
                  </Badge>
                </PopoverTrigger>
                <PopoverContent className='border-foreground/60'>
                  <div className='space-y-2'>
                    <h4 className='text-sm font-semibold'>Prerequisites:</h4>
                    <ul className='list-inside list-disc space-y-1 text-xs'>
                      {module.prerequisites?.map((prereq) => (
                        <li key={prereq.code}>
                          <span className='font-medium'>{prereq.code}</span> -{' '}
                          {prereq.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <Badge
                variant={
                  module.status === 'Compulsory' ? 'secondary' : 'destructive'
                }
              >
                {module.status}
              </Badge>
            )}
          </div>
        </FormItem>
      )}
    />
  );
}
