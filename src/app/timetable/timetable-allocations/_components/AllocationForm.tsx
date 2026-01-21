import {
	Checkbox,
	Grid,
	MultiSelect,
	NumberInput,
	Select,
	Stack,
	Tabs,
} from '@mantine/core';
import { TimeInput } from '@mantine/dates';
import type { UseFormReturnType } from '@mantine/form';
import DurationInput from '@/shared/ui/DurationInput';
import {
	applyTimeRefinements,
	type BaseAllocationFormValues,
	baseAllocationSchema,
	baseAllocationSchemaInner,
	classTypes,
	type DayOfWeek,
	daysOfWeek,
} from '../_lib/schemas';

export {
	applyTimeRefinements,
	baseAllocationSchema,
	baseAllocationSchemaInner,
	classTypes,
	daysOfWeek,
};
export type { BaseAllocationFormValues, DayOfWeek };

type Props<T extends BaseAllocationFormValues> = {
	form: UseFormReturnType<T>;
	venueTypes: { id: string; name: string }[];
	renderTopDetails?: () => React.ReactNode;
	renderMiddleDetails?: () => React.ReactNode;
};

export function AllocationForm<T extends BaseAllocationFormValues>({
	form,
	venueTypes,
	renderTopDetails,
	renderMiddleDetails,
}: Props<T>) {
	return (
		<Tabs defaultValue='details'>
			<Tabs.List>
				<Tabs.Tab value='details'>Details</Tabs.Tab>
				<Tabs.Tab value='constraints'>Constraints</Tabs.Tab>
			</Tabs.List>

			<Tabs.Panel value='details' pt='md'>
				<Stack gap='md'>
					{renderTopDetails?.()}

					<Grid align='end'>
						<Grid.Col span={6}>
							<DurationInput
								label='Duration'
								value={form.values.duration}
								onChange={(value) => {
									// biome-ignore lint/suspicious/noExplicitAny: Generic form handling
									const castValue = value as any;
									form.setFieldValue('duration', castValue);
								}}
								error={form.errors.duration}
								required
							/>
						</Grid.Col>
						<Grid.Col span={6}>
							<NumberInput
								label='Number of Students'
								placeholder='Enter number of students'
								value={form.values.numberOfStudents}
								onChange={(value) => {
									// biome-ignore lint/suspicious/noExplicitAny: Generic form handling
									const castValue = value as any;
									form.setFieldValue('numberOfStudents', castValue);
								}}
								error={form.errors.numberOfStudents}
								min={0}
								required
							/>
						</Grid.Col>
					</Grid>
					<Select
						label='Class Type'
						placeholder='Select class type'
						data={classTypes}
						value={form.values.classType}
						onChange={(value) => {
							// biome-ignore lint/suspicious/noExplicitAny: Generic form handling
							const castValue = value as any;
							form.setFieldValue('classType', castValue);
						}}
						error={form.errors.classType}
						required
					/>

					{renderMiddleDetails?.()}

					<MultiSelect
						label='Venue Types'
						placeholder='Select venue types (optional)'
						data={venueTypes.map((vt) => ({
							value: vt.id,
							label: vt.name,
						}))}
						value={form.values.venueTypeIds}
						onChange={(values) => {
							// @ts-expect-error - Generic form type inference limitation with Mantine
							form.setFieldValue('venueTypeIds', values);
						}}
						searchable
						clearable
					/>
				</Stack>
			</Tabs.Panel>

			<Tabs.Panel value='constraints' pt='md'>
				<Stack gap='md'>
					<Checkbox.Group
						label='Allowed Days'
						description='Select which days of the week this allocation can be scheduled'
						value={form.values.allowedDays}
						onChange={(value) => {
							// @ts-expect-error - Generic form type inference limitation with Mantine
							form.setFieldValue('allowedDays', value);
						}}
						error={form.errors.allowedDays}
						required
					>
						<Stack mt='xs' gap='xs'>
							{daysOfWeek.map((day) => (
								<Checkbox
									key={day}
									value={day}
									label={day.charAt(0).toUpperCase() + day.slice(1)}
								/>
							))}
						</Stack>
					</Checkbox.Group>

					<TimeInput
						label='Start Time'
						description='Earliest time this allocation can be scheduled (24hr format)'
						placeholder='HH:mm'
						value={form.values.startTime}
						onChange={(event) => {
							// biome-ignore lint/suspicious/noExplicitAny: Generic form handling
							const castValue = event.currentTarget.value as any;
							form.setFieldValue('startTime', castValue);
						}}
						error={form.errors.startTime}
						required
					/>

					<TimeInput
						label='End Time'
						description='Latest time this allocation can be scheduled (24hr format)'
						placeholder='HH:mm'
						value={form.values.endTime}
						onChange={(event) => {
							// biome-ignore lint/suspicious/noExplicitAny: Generic form handling
							const castValue = event.currentTarget.value as any;
							form.setFieldValue('endTime', castValue);
						}}
						error={form.errors.endTime}
						required
					/>
				</Stack>
			</Tabs.Panel>
		</Tabs>
	);
}
