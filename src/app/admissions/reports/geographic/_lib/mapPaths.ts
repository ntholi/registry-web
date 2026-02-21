export interface MapRegion {
	name: string;
	path: string;
	centroid: { x: number; y: number };
}

export const SOUTHERN_AFRICA_VIEWBOX = '0 0 800 600';

export const SOUTHERN_AFRICA_COUNTRIES: MapRegion[] = [
	{
		name: 'Lesotho',
		path: 'M480,420 L490,400 L510,395 L525,405 L530,420 L520,440 L500,445 L485,435 Z',
		centroid: { x: 505, y: 420 },
	},
	{
		name: 'South Africa',
		path: 'M350,300 L400,280 L450,290 L480,310 L520,320 L560,350 L570,400 L550,460 L500,490 L440,500 L380,480 L340,440 L320,380 L330,340 Z',
		centroid: { x: 440, y: 390 },
	},
	{
		name: 'Mozambique',
		path: 'M560,200 L580,220 L590,280 L580,340 L570,380 L560,350 L550,300 L555,250 Z',
		centroid: { x: 570, y: 290 },
	},
	{
		name: 'Eswatini',
		path: 'M540,355 L555,345 L560,360 L550,370 L540,365 Z',
		centroid: { x: 548, y: 358 },
	},
	{
		name: 'Botswana',
		path: 'M370,250 L420,240 L450,260 L460,300 L440,330 L400,340 L370,320 L360,280 Z',
		centroid: { x: 410, y: 290 },
	},
	{
		name: 'Zimbabwe',
		path: 'M450,200 L500,190 L540,210 L550,250 L530,290 L490,300 L460,280 L450,240 Z',
		centroid: { x: 495, y: 245 },
	},
	{
		name: 'Namibia',
		path: 'M260,250 L320,230 L360,260 L370,320 L340,380 L300,400 L260,370 L250,310 Z',
		centroid: { x: 310, y: 310 },
	},
	{
		name: 'Zambia',
		path: 'M400,130 L460,120 L510,140 L530,180 L510,210 L460,220 L420,210 L400,170 Z',
		centroid: { x: 460, y: 170 },
	},
	{
		name: 'Malawi',
		path: 'M540,150 L555,140 L565,170 L560,210 L545,220 L535,190 Z',
		centroid: { x: 550, y: 180 },
	},
];

export const LESOTHO_VIEWBOX = '0 0 600 500';

export const LESOTHO_DISTRICTS: MapRegion[] = [
	{
		name: 'Maseru',
		path: 'M200,280 L250,260 L290,280 L300,320 L270,340 L230,330 L210,310 Z',
		centroid: { x: 250, y: 300 },
	},
	{
		name: 'Berea',
		path: 'M260,220 L310,210 L330,240 L310,270 L280,270 L260,250 Z',
		centroid: { x: 290, y: 245 },
	},
	{
		name: 'Leribe',
		path: 'M260,150 L320,140 L350,170 L330,210 L290,220 L260,200 Z',
		centroid: { x: 300, y: 180 },
	},
	{
		name: 'Butha-Buthe',
		path: 'M270,100 L320,90 L340,120 L320,145 L280,150 L265,130 Z',
		centroid: { x: 300, y: 120 },
	},
	{
		name: 'Mokhotlong',
		path: 'M340,100 L400,90 L420,130 L400,170 L360,175 L340,140 Z',
		centroid: { x: 375, y: 135 },
	},
	{
		name: 'Thaba-Tseka',
		path: 'M330,200 L390,190 L410,230 L390,270 L350,280 L320,250 Z',
		centroid: { x: 365, y: 235 },
	},
	{
		name: "Qacha's Nek",
		path: 'M350,320 L400,300 L430,330 L420,370 L380,380 L350,350 Z',
		centroid: { x: 390, y: 340 },
	},
	{
		name: 'Quthing',
		path: 'M270,350 L320,330 L350,350 L340,390 L300,400 L270,380 Z',
		centroid: { x: 310, y: 365 },
	},
	{
		name: "Mohale's Hoek",
		path: 'M200,330 L250,320 L270,350 L260,390 L220,400 L200,370 Z',
		centroid: { x: 235, y: 360 },
	},
	{
		name: 'Mafeteng',
		path: 'M180,300 L220,290 L240,320 L230,350 L200,360 L180,340 Z',
		centroid: { x: 210, y: 325 },
	},
];
