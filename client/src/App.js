import './App.css';
import React, { createContext, useState, useEffect, useRef } from 'react';
import { Form, Table, Spinner } from 'react-bootstrap';
import ReplayIcon from '@mui/icons-material/Replay';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';

import { DatetimeHeader } from './components/DatetimeHeader';
import { TableHeader } from './components/TableHeader';
import { AutoDismissToast } from './components/AutoDismissToast';
import { IconButton } from './components/IconButton';
import { LazyTable } from './components/LazyTable';

export const DataTypeContext = createContext();

function App() {
  // mimeTypes
  const spreadsheetTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'];
  const controller = new AbortController();
  const { signal } = controller;
  const tableBodyRef = useRef(null);

  const [init, setInit] = useState(false);
  const [csrfToken, setCsrfToken] = useState();
  const [error, setError] = useState("An error occurred");
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState();

  // form fields validity
  const [inValid, setInValid] = useState(false);
  // const [tableBody, setTableBody] = useState();
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [nDisp, setnDisp] = useState(500);
  // data type ids
  const [dtypes, setDtypes] = useState([]);
  // Datetime formats
  const [dtformats, setDtformats] = useState([]);

  // Toast state
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    fetch('/api/gettoken')
    .then(res => res.json())
    .then(token => setCsrfToken(token.csrfToken));
  }, []);

  // show toast message whenever validity is changed
  useEffect(() => {
    // Run only after initial render
    if (init) { 
      if (!loading) {
        setShowToast(true) 
      }
    }
    else {
      setInit(true)
    }
  }, [inValid])

  const processUpload = async (file, newDataTypes = []) => {
    setLoading(true);

    let formData = new FormData();
    formData.append('spreadsheet', file);
    if (newDataTypes) {
      formData.append('columntypes', newDataTypes);
    }

    try {
      const res = await fetch('api/uploadspreadsheet', {
        signal,
        method: 'POST',
        headers: {'X-CSRFToken': csrfToken},
        body: formData
      })

      if (res.ok) {
        const data = await res.json();
        console.log(data);
        // setTableBody(data.html);
        setColumns(data.data.columns);
        setRows(data.data.data);
        setDtypes(data.dtypes);
        setDtformats(new Array(data.dtypes.length).fill(""));
        setInValid(false);
      }
      else {
        setError(await res.text());
        setInValid(true);
      }
    } catch (error) {
      setError(error.message);
      setInValid(true);
      console.error(error);
    }
    setLoading(false);
  }

  const _handleUpload = async (files) => {
    // allow uploading of one file only
    if (files.length == 1 && spreadsheetTypes.includes(files[0].type)) {
      const file = files[0]
      setFile(file);
      setInValid(false);
      await processUpload(file);
    }
    else {
      setError("Please select only 1 file, file must be CSV or excel like format!");
      setInValid(true);
    }
  }

  const _cancelProcessing = () => {
    controller.abort();
    fetch('api/cancelprocess').then(res => {
      if (res.ok) {
        setError("Cancelled");
        setInValid(true);
      }
    })
  }

  // Detect end of scroll to load more data into UI
  const _handleScroll = () => {
      if(tableBodyRef.current){
        const {clientHeight, scrollTop, scrollHeight} = tableBodyRef.current;
        if (clientHeight + scrollTop >= scrollHeight) {
          setnDisp(nDisp + 500);
        }
      }
  }

  return (
    <div className="App App-header" style={{padding:30}}>
      {/* Upload of data sheets */}
      <Form noValidate className="d-flex flex-row">
        <Form.Group>
          <Form.Label>Upload File</Form.Label>
          <Form.Control
            type='file' 
            accept={spreadsheetTypes} 
            onChange={e => _handleUpload(e.target.files)}
            onClick={e => e.target.value = null}
            isInvalid={inValid} 
          />
        </Form.Group>
        
        <div className="align-self-end">
          <IconButton label="Process again" icon={<ReplayIcon/>} _onClick={() => processUpload(file, dtypes)} />
          <IconButton label="Cancel" icon={<HighlightOffIcon/>} _onClick={_cancelProcessing} />
        </div>
      </Form>

      <br/>

      {/* Displaying processed data */}
      {loading ? <Spinner animation='grow'/> :
      <div className="scrollable-table" ref={tableBodyRef} onScroll={_handleScroll}>
        <Table striped bordered variant="dark" style={{fontSize:15}} >
          <thead style={{ position:"sticky", top:0}}>
            {/* header row 1, name */}
            <tr>
              {columns.map(header => <th key={`header-${header}`}>{header}</th>)}
            </tr>

            {/* header row 2, type select */}
            <DataTypeContext.Provider value={{dtypes, setDtypes, dtformats, setDtformats}}>
              <tr>
                {columns.map((header,index) => dtypes[index] === 4 ? 
                  <DatetimeHeader key={`select-${header}`} index={index} /> :
                  <TableHeader key={`select-${header}`} index={index} />
                )}
              </tr>
            </DataTypeContext.Provider>
          </thead>

          <tbody>
            <LazyTable data={rows} numRows={nDisp}/>
          </tbody>

          {/* <tbody dangerouslySetInnerHTML={{__html: tableBody}}></tbody> */}
        </Table>
      </div>
      }

      <AutoDismissToast 
        show={showToast} 
        setShow={setShowToast} 
        success={!inValid} 
        message={inValid ? error : "Processing complete!"} 
      />
    </div>
  );
}

export default App;
