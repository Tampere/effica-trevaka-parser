export type EfficaApplication = {
    personid: string;
    applicationdate: Date;
    placeneed: number;
    specialhandlingtime: number;
    transferapplication: boolean;
    guid: string;
};

export type EfficaApplicationRow = {
    personid: string;
    priority: number;
    unitcode: number;
    childminder: string | null;
    areacode: string;
    startdate: Date;
    hours: number;
    childmindercare: number;
    unitcare: number;
    days: number;
    extent: number;
    type: string | null;
    guid: string;
};
