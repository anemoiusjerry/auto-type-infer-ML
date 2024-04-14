import './App.css';
import { useState, useEffect } from 'react';
import {Button, Form, Table, Spinner} from 'react-bootstrap';

function App() {
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
  // mimeTypes
  const spreadsheetTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'];

  const [csrfToken, setCsrfToken] = useState();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState();
  // form fields validity
  const [inValid, setInValid] = useState();
  const [tableBody, setTableBody] = useState();
  const [columns, setColumns] = useState([]);
  const [dtypes, setDtypes] = useState([]);
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    fetch('/api/gettoken')
    .then(res => res.json())
    .then(token => setCsrfToken(token.csrfToken));
  }, []);

  const processUpload = async (file, newDataTypes = []) => {
    // Allow single uploads only
    if (spreadsheetTypes.includes(file.type)) {
      setFile(file);
      setInValid(false);

      let formData = new FormData();
      formData.append('spreadsheet', file);
      if (newDataTypes) {
        console.log(newDataTypes)
        formData.append('columntypes', newDataTypes);
      }

      try {
        const res = await fetch('api/uploadspreadsheet', {
          method: 'POST',
          headers: {'X-CSRFToken': csrfToken},
          body: formData
        })
      
        if (res.ok) {
          const data = await res.json();
          console.log(data);
          setTableBody(data.html);
          setColumns(data.columns);
          setDtypes(data.dtypes);
        }
        else {
          setError(res.text);
          setInValid(true);
        }
      } catch (error) {
        setError(error.message);
        console.error(error.message);
      }
    }
    else {
      setError("Only CSV and excel like documents, thank you.")
      setInValid(true);
    }
  }

  const _handleUpload = async (files) => {
    setLoading(true);
    // allow uploading of one file only
    if (files.length > 1) {
      setError("Please select only 1 file!");
    }
    else { 
      await processUpload(files[0]) 
    }
    setLoading(false);
  }
  
  const _handleManualTypeDef = (index, optVal) => {
    let newDtypes = [...dtypes];
    newDtypes[index] = optVal;
    setDtypes(newDtypes);
    console.log(newDtypes)
    setChanged(true);
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
          <Form.Control.Feedback type="invalid">
            {error}
          </Form.Control.Feedback>
        </Form.Group>
        <div className="align-self-end">
          <Button className="ms-2" disabled={!changed} onClick={() => processUpload(file, dtypes)}>Process Again</Button>
        </div>
      </Form>

      <br/>

      {/* Displaying processed data */}
      {loading ? <Spinner animation='grow'/>:
       <Table striped bordered variant="dark">
       <thead>
         {/* header row 1, name */}
         <tr>
           {columns.map(header => <th key={`header-${header}`}>{header}</th>)}
         </tr>

         {/* header row 2, type select */}
         <tr>
           {columns.map((header,index) => 
             <th key={`select-${header}`}>
               <Form.Select value={dtypes[index]} onChange={e => _handleManualTypeDef(index, Number(e.target.value))}>
                 {dtypeOptions.map(opt => 
                   <option key={opt.value} value={opt.value}>{opt.name}</option>
                 )}
               </Form.Select>
             </th>
           )}
         </tr>
       </thead>
       <tbody dangerouslySetInnerHTML={{__html: tableBody}}></tbody>
     </Table>
      }
    </div>
  );
}

export default App;
