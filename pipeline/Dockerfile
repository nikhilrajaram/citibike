FROM python:3.9-slim

WORKDIR /app
COPY ./requirements.txt .
COPY src/ src/

RUN python -m pip install -r ./requirements.txt
