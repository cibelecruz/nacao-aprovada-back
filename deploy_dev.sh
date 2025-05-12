#!/bin/bash

# Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

export GOOGLE_APPLICATION_CREDENTIALS=serviceAccount.json

# Deploy para o Google Cloud Run
gcloud run deploy \
    smart-study-back-dev \
    --project=smart-estudos \
    --source . \
    --set-env-vars "MONGODB_URI=$MONGODB_URI,EMAIL=$EMAIL,PASS=$PASS,SMTP_HOST=$SMTP_HOST,SMTP_PORT=$SMTP_PORT,ACCOUNT_SID=$ACCOUNT_SID,AUTH_TOKEN=$AUTH_TOKEN,STORAGE_BUCKET=$STORAGE_BUCKET" \
    --region=southamerica-east1
