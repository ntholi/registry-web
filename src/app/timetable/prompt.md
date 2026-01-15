I want you to curfully verify and validate the timetable slots feature, be 100% sure that it is working the way it was supposed to work, it is at it's optimal point, the tests are very good and test all possible scenarios, the feature was built from the following instructions:

I need you to think extra hard about them, whether you have followed them completely, or follow them 100 per cent to perfection! Think hard about the best possible solution, think very hard and long about this, even if it takes you 10 days thinking do that, what I want is the best possible solution

Here are the original instructions. Please add more tests when necessary to make sure that you have followed them to the maximum: 

Create timetable slots schema that tracks time table allocations (a slot represents a slot on the timetable) a slot should have the venue, time and a timetableAllocations, everytime a new timetable allocation is created a new slot should be autometically determined using the best possible algorithem, research about it, make a full extensive research, then think hard about the best possible solution, even if it takes you hours thinking about the best possible solution, do that, create a solution far better than that of google's OR-Tools. 

First, let me define what I mean by "Class" A class is a group of students who belong to the same program and are in the same semester. In this case, all timetableAllocations that have semesterModules that belong to the same semesterId those timetableAllocations belong to the same class, this is a class of students because at a later stage students will enroll to that particular semesterId.

Here are a few constraints that you need to be aware of:
- A venue can not have more than one slot at a time, However, a venue may share slots only and only if those slots are of the same lecturer and who's semesterModules have the same module name (note that I said module name, not module id, or code). 

- And since we have limited slots, prioritise combining venues where possible and only if it does not violate the rule above

- Put the slots in random places. I have realised that the current code always puts slots in the morning, I need it to be more random, please use the configuration's timetable.timetableAllocations.duration value to determine the correct slot for example, if timetableAllocations.startTime (note that this timetableAllocations createWithVenueTypes's allocation: TimetableAllocationInsert) is 08:30 for example, you can place one class at 08:30 and another one at 12:30 the same day or another day or maybe the very first class can be on Tuesday 10:30. Please make it always start at a time consistent with the configuration's set startTime and duration for example, if startTime is 08:30, endTime is 17:30 and duration is 3hours, the only possible times to allocate the slots are 08:30, 11:30 and 14:30. 


- a timetableAllocations can ONLY be given a slot in a venue that belongs to the same school that the lecturer (user) belongs to (use the userSchools table and venueSchools table)

- a lecturer cannot have overlapping slots of different modules (modules with different names)

- A lecturer cannot have overlapping slots of the same module if the timetableAllocations classTypes are different

- A class cannot have more than one slot at a time

- a class cannot have 3 imediatly consegative slots at a time unless there are no more available slots, by consegative slots I mean for example assuming a slot is 1 hour they can not have a slot at 8 am-9 am, 9 am-10 am, then at 10 am-11 am, they may however have a slot at 8 am-9 am, 9 am-10 am then 11 am-12 pm or any variation as long as they are not consergative, the same rule applies to lectuerers, you can break this rule only if there are no more possible slots other than consegative slots and finally a class and/lectuere should not have more than maxSlotsPerDay which is defined in src/config/ Remember you may violate this maxSlotsPerDay rule only if there are absolutely no other way, if it absolutely is impossible to find another slot, only then you may violate this rule

- Assign a slot only to the vanueTypes specified in the respective timetableAllocations, unless there is no vanueType specified, then you may assign a slot to any venue

- Determine the right venue based on the number of students in the timetableAllocations. Note that each venue has a capacity value; you may overcapacitate the venue by not more than 10%

- Follow the constraints that have been provided to the lectuereAllocation which are allowedDays and startTime (the earliest time that the slot can start or can begin from) and endTime (the latest time the slot can finish at)

- Please note that one class can occupy a slot/venue for 2 hours and another 3 hours and 30 minutes, another any variable amount of time.

Think extra hard about the best possible algorithm, and I want you to build it in such a way that when a user enters a new timetableAllocations it recalculates and or adjusts already existing slots when necessary to accommodate the new slot as long as shifting and reallocating already allocated slots does not break their timetableAllocation's constraints

Very Imporetently, what I want you to also do is to write tests many many tests to put stress on it and see if it holds up, update the algorithem if necessary, make sure the tests are ruthless, extra super ruthless, stress tests, test it to the maximum and make sure it passes the tests, validate it agains known and super efficient and commonly used