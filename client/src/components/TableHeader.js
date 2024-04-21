import { DataTypeSelect } from './DataTypeSelect';

export const TableHeader = ({index}) => {
    return (
        <th>
            <DataTypeSelect index={index} />
        </th>
    );
}