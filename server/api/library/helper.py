import pandas as pd
import numpy as np
import re
from dateutil import parser
from multiprocessing import Value, Lock

CHUNK_SIZE = 1000 # num of rows in df
SAMPLE_SIZE = 0.7 # percentage of records to take from dataframe

# cancel processing
interrupt_process = Value('b', False)
lock = Lock()

def enumify(dtype): 
    """ Convert column datatypes to integer 
        dtypes: pandas dtype as str
        returns: int type_id
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

def sample_df(df):
    """ Random select a fraction of records in df 
        df: pandas dataframe
        frac: % of dataframe to be selected (in decimal)
        returns sampled dataframe
    """
    if df.shape[0] > CHUNK_SIZE:
        return df.sample(frac=SAMPLE_SIZE).reset_index(drop=True)
    return df

def count_data_types(df):
    """ Count number of times a datatype is inferred
        df: dataframe
        returns: dictionary of lists, key: column, value: list of counts where index is the type_id
    """
    global interrupt_process
    print("process started")
    type_counts = {}
    for j in range(df.shape[1]):
        # dict key: int code for pandas dtypes
        type_counts[j] = [0,0,0,0,0,0,0]
        # check if category first as that works differently
        if check_category(df.iloc[:,j]):
            type_counts[j][5] = df.shape[0]
            continue # no need to count other types

        # analyse each row count types
        for i in range(df.shape[0]):
            with lock:
                if interrupt_process.value:
                    raise Exception("Processing cancelled.")
                
            value = df.iloc[i,j]
            # priortise displaying data so dont worry about errors
            try:
                num_result = check_numeric(value)
                if num_result:
                    type_counts[j][num_result] += 1
                elif check_bool(value):
                    type_counts[j][3] += 1
                elif check_datetime(value):
                    type_counts[j][4] += 1
                elif check_complex(value):
                    type_counts[j][6] += 1
                else:
                    type_counts[j][0] += 1
            except:
                pass
    print("finished")
    return type_counts

def infer_data_types(count_dicts):
    """ Infer datatype based off aggregate count from dataframe chunks
        count_dicts: list of type_count dictionaries from count_data_types
        returns: list of type_ids
    """
    combined_dict = {}
    for dict in count_dicts:
        for col, counts in dict.items():
            # If any unforeseen errors occur simply dont add and continue
            # prioritise returning data as user can specify datatype
            try:
                if col in combined_dict:
                    combined_dict[col] + np.array(counts)
                else:
                    combined_dict[col] = np.array(counts)
            except:
                pass
    
    inferred_data_types = [0] * len(combined_dict)
    # use col as index as dict does not guarantee order
    for col, counts in combined_dict.items():
        inferred_data_types[col] = int(np.argmax(counts))
    return inferred_data_types

def convert_data_types(df, new_column_types, **kwargs):
    """ Converts pandas dataframe to the specified types
        df: pandas dataframe
        new_column_types: array of ints of the type id
        returns: converted pandas dataframe
    """
    for i in range(len(df.columns)):
        col = df.columns[i]
        type_code = new_column_types[i]
        # Prioritise conversion output, if error then just leave it
        try:
            if type_code == 1 or type_code == 2:
                # coerce errors to convert to NaN
                df[col] = pd.to_numeric(df[col], errors='coerce')
            elif type_code == 3:
                df[col] = df[col].astype(bool)
            elif type_code == 4:
                try:
                    if (kwargs['format']):
                        df[col] = pd.to_datetime(df[col], format=kwargs['format'])
                    else:
                        df[col] = pd.to_datetime(df[col])
                except ValueError as ve:
                    pattern = r"match format \"([^']*)\""
                    match = re.search(pattern, str(ve))
                    date_format = match.group(1)
                    # swtich the day and month - try again
                    parts = date_format.split("%")
                    for i in range(len(parts)):
                        p = parts[i]
                        if "m" in p:
                            parts[i] = p.replace("m", "d")
                        elif "d" in p:
                            parts[i] = p.replace("d", "m")
                    date_format = "%".join(parts)

                    df[col] = pd.to_datetime(df[col], format=date_format, errors='coerce')
                    df[col] = df[col].replace(pd.NaT, "NA")
                    
            elif type_code == 5:
                df[col] = pd.Categorical(df[col])
            elif type_code == 6:
                df[col] = df[col].apply(lambda x: np.complex(x))
            else:
                df[col] = df[col].astype(str)
        except:
            pass
    return df


def check_numeric(value):
    try:
        num = float(value)
        if num.is_integer():
            return 1
        return 2
    except:
        return False

def check_bool(value):
    if value.lower() in ["false", "true"]:
        return True
    return False

def check_datetime(value):
    try:
        parser.parse(value)
        return True
    except:
        return False

def check_category(df_col):
    """ Pass entire df column
    """
    if len(df_col.unique()) / len(df_col) < 0.5:  # Example threshold for categorization
        return True
    return False

def check_complex(value):
    try:
        complex(value.replace("i", "j"))
        return True
    except:
        return False