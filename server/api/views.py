from django.shortcuts import render
from django.http import JsonResponse, HttpResponse
from django.template.loader import render_to_string
from django.middleware.csrf import get_token
import pandas as pd
from multiprocessing import Pool
from .library.helper import sample_df, count_data_types, infer_data_types, convert_data_types, CHUNK_SIZE
from .library.helper import lock, interrupt_process

# Create your views here.
def upload_spreadsheet(request):
    if (request.method == 'POST' and request.FILES['spreadsheet']):
        spreadsheet = request.FILES['spreadsheet']
        str_types = request.POST.get('columntypes')
        
        # read spreadsheet into df by chunks to handle large files 
        df_chunks = None
        if (spreadsheet.content_type == 'text/csv'):
            df_chunks = pd.read_csv(spreadsheet, chunksize=CHUNK_SIZE)
        else:
            df_chunks = pd.read_excel(spreadsheet, chunksize=CHUNK_SIZE)
        df_chunks = [chunk for chunk in df_chunks]

        pool = Pool()
        inferred_dtypes = []

        # catch all unforeseen errors to display as toast
        try:
            if str_types:
                inferred_dtypes = [int(elmt) for elmt in str_types.split(",")]
            # No manual types => perform inference
            else:
                sampled_chunks = pool.map(sample_df, df_chunks)
                # results is a list of list of inferred type_id for each chunk: [[1,4,5], [2,0,3],...]
                results = pool.map(count_data_types, sampled_chunks)
                inferred_dtypes = infer_data_types(results)
            
            results = []
            # Parallel process for type conversion
            for chunk in df_chunks:
                covnerted_chunks = pool.apply_async(convert_data_types, args=(chunk, inferred_dtypes))
                results.append(covnerted_chunks)
            output = [res.get() for res in results]
            pool.close()
            pool.join()
            df = pd.concat(output)
            df_dict = df.to_dict(orient='split')

            # # Convert to html viewable template
            # context = {'df_dict': df_dict['data']}
            # table_html = render_to_string('spreadsheet.html', context)
            # return JsonResponse({'html': table_html, 'columns': list(df_dict['columns']), 'dtypes': inferred_dtypes}, status=200)

            return JsonResponse({"data": df_dict, "dtypes": inferred_dtypes}, status=200)
        
        except Exception as e:
            return HttpResponse(str(e), status=500)
    
    return HttpResponse("Error: no file detected", status=500)

def cancel_processing(request):
    with lock:
        interrupt_process.value = True
    return HttpResponse("Cancelled", status=200)

def get_csrf_token(request):
    return JsonResponse({'csrfToken': get_token(request)})