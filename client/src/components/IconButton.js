import { Button, OverlayTrigger, Tooltip } from "react-bootstrap";

export const IconButton = ({label, icon, _onClick}) => {
    return (
        <OverlayTrigger
            placement="top"
            delay={{ show: 250, hide: 400 }}
            overlay={<Tooltip>{label}</Tooltip>}
        >
            <Button className="ms-2" onClick={_onClick}>
                {icon}
            </Button>
        </OverlayTrigger>
    );
}