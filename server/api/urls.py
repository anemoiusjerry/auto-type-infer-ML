from django.urls import path
from . import views

urlpatterns = [
    path('uploadspreadsheet', views.upload_spreadsheet),
    path('gettoken', views.get_csrf_token)
]