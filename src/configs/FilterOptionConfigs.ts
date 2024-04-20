import { GroupBase, OptionsOrGroups } from "react-select";

export const JobPostedInOptions: OptionsOrGroups<any, GroupBase<any>> = [
    { label: 'All Time', value: undefined },
    { label: 'Last 24 Hours', value: 1 },
    { label: 'Last 3 days', value: 3 },
    { label: 'Last week', value: 7 },
    { label: 'Last month', value: 31 },
]