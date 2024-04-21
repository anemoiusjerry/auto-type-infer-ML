import { useContext } from 'react';
import Form from 'react-bootstrap/Form';
import { DataTypeContext } from '../App';

export const DataTypeSelect = ({index}) => {
    // pandas datatype codes
    const dtypeOptions = [
        {value: 0, name: "Text"},
        {value: 1, name: "Whole Number (int)"},
        {value: 2, name: "Real Number (float)"},
        {value: 3, name: "True/False (bool)"},
        {value: 4, name: "Datetime"},
        {value: 5, name: "Categorical"},
        {value: 6, name: "Complex Number"},
    ]

    const {dtypes, setDtypes} = useContext(DataTypeContext);

    const _handleManualTypeDef = (index, optVal) => {
        let newDtypes = [...dtypes];
        newDtypes[index] = optVal;
        setDtypes(newDtypes);
    }

    return (
        <Form.Select value={dtypes[index]} onChange={e => _handleManualTypeDef(index, Number(e.target.value))}>
            {dtypeOptions.map(opt => 
                <option key={opt.value} value={opt.value}>{opt.name}</option>
            )}
        </Form.Select>
    );
}