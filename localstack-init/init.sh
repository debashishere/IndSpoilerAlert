#!/bin/bash
echo "Initializing LocalStack resources..."
awslocal s3 mb s3://spoiler-alert-surplus
awslocal sqs create-queue --queue-name spoiler-alert-ingestion-jobs
echo "LocalStack resources initialized successfully."
