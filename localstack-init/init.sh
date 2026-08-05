#!/bin/bash
echo "Initializing LocalStack resources..."
awslocal s3 mb s3://ind-spoiler-alert-surplus
awslocal sqs create-queue --queue-name ind-spoiler-alert-ingestion-jobs
echo "LocalStack resources initialized successfully."
