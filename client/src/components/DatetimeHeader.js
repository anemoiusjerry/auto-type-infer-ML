import { useState, useContext } from "react";
import {Form, OverlayTrigger, Popover} from 'react-bootstrap';
import { DataTypeSelect } from "./DataTypeSelect";
import { DataTypeContext } from "../App";

export const DatetimeHeader = ({index}) => {
    const {dtformats, setDtformats} = useContext(DataTypeContext);
    const [ownFormat, setOwmFormat] = useState(false);

    const _handleSetFormat = (newFormat) => {
        let formatArray = [...dtformats];
        formatArray[index] = newFormat;
        setDtformats(formatArray);
    }

    return (
        <th>
            <OverlayTrigger
                trigger="click"
                placement='top'
                overlay={
                    <Popover>
                        <Popover.Body>
                            <Form.Control placeholder="%m/%d/%Y" value={dtformats[index]} onChange={e => _handleSetFormat(e.target.value)}/>
                        </Popover.Body>
                    </Popover>
                }
                >
                    <Form.Check 
                        type="checkbox"
                        label="Custom Format"
                        checked={ownFormat}
                        onChange={() => setOwmFormat(!ownFormat)}
                        style={{fontWeight:'normal'}}
                    />
            </OverlayTrigger>

            <DataTypeSelect index={index} />
        </th>
    );
}