FROM  python:3.12.3-bullseye

ENV PYTHONUNBUFFERED=1

WORKDIR /server

# install dependencies
RUN pip install django djangorestframework django-cors-headers pandas

# copy from the current directory of the Dockerfile 
COPY . . 

EXPOSE 8000