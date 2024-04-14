from django.shortcuts import render
from django.http import JsonResponse, HttpResponse
from django.template.loader import render_to_string
from django.middleware.csrf import get_token
import pandas as pd
from .library.infer_data_types import infer_and_convert_data_types
from .library.helper import enumify, convert_data_types

# Create your views here.
def upload_spreadsheet(request):
    if (request.method == 'POST' and request.FILES['spreadsheet']):
        spreadsheet = request.FILES['spreadsheet']
        str_types = request.POST.get('columntypes')

        new_datatypes = []
        if str_types:
            new_datatypes = [int(elmt) for elmt in str_types.split(",")]
        
        df = pd.DataFrame()
        # read spreadsheet into df
        if (spreadsheet.content_type == 'text/csv'):
            df = pd.read_csv(spreadsheet)
        else:
            df = pd.read_excel(spreadsheet)

        # infer data types or use manual types supplied
        if new_datatypes:
            df = convert_data_types(df, new_datatypes)
        else:
            df = infer_and_convert_data_types(df)
            
        df_dict = df.to_dict(orient='split')
        context = {'df_dict': df_dict['data']}
        # Convert to html viewable template
        table_html = render_to_string('spreadsheet.html', context)
        # generate a array of ints to represent dtype
        inferred_dtypes = [enumify(dtype) for dtype in df.dtypes.astype(str)]
        # Send pandas char encoding for dtypes to render dropdown lists in frontend
        return JsonResponse({'html': table_html, 'columns': list(df_dict['columns']), 'dtypes': inferred_dtypes}, status=200)
    
    return HttpResponse("Error: no file detected", status=500)


def get_csrf_token(request):
    return JsonResponse({'csrfToken': get_token(request)})