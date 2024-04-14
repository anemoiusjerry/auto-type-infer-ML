import pandas as pd
import numpy as np

def enumify(dtype): 
    """ Convert column datatypes to integer 
        dtypes: pandas dtype as str
        returns: int code
    """
    # all type string retrieved from pandas doc website
    # no method to get all dtypes exist
    if dtype in ['int8', 'int16', 'int32', 'int64', 'uint8', 'uint16', 'uint32', 'uint64']:
        return 1
    elif dtype in ['float16', 'float32', 'float64']:
        return 2
    elif dtype == 'bool':
        return 3
    elif dtype in ['datetime64[ns]', 'timedelta64[ns]']:
        return 4
    elif dtype == 'category':
        return 5
    elif dtype in [ 'complex64', 'complex128']:
        return 6
    else:
        return 0

def convert_data_types(df, new_column_types):
    print(new_column_types)
    i = 0
    for col in df.columns:
        type_code = new_column_types[i]
        if type_code == 1 or type_code == 2:
            print(df[col].dtypes)
            df[col] = pd.to_numeric(df[col], errors='coerce')
        elif type_code == 3:
            df[col] = df[col].astype(bool)
        elif type_code == 4:
            df[col] = pd.to_datetime(df[col])
        elif type_code == 5:
            df[col] = pd.Categorical(df[col])
        elif type_code == 6:
            df[col] = df[col].apply(lambda x: np.complex(x))
        else:
            df[col] = df[col].astype(str)
        i += 1
    #print(df.dtypes)
    return df