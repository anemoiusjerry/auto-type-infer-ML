import { useState, useEffect } from "react";
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';

export const AutoDismissToast = ({show, setShow, success, message, delay=5000}) => {
    const successColour = "#32CD32";
    const errorColour = "#FF5733";
    const [colour, setColour] = useState(success ? successColour : errorColour);

    useEffect(() => {
        if (success) {
            setColour(successColour);
        }
        else {
            setColour(errorColour)
        }
    }, [success]);

    return (
        <ToastContainer position="top-end" className="p-3">
            <Toast show={show} onClose={() => setShow(false)} delay={delay} autohide>
                <Toast.Body style={{backgroundColor: colour, borderRadius:5}}>{message}</Toast.Body>
            </Toast>
        </ToastContainer>
    );
}