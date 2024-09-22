FROM python:3.9.20-slim-bullseye


WORKDIR /app
COPY . /app
RUN pip install -r requirements.txt
EXPOSE 8000
CMD ["python3", "main.py"]