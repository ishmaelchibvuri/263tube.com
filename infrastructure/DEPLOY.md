# Quick Deployment Guide

## Deploy to QA
```bash
cd infrastructure
cdk deploy -c environment=qa --all --require-approval never
```

## Deploy to Dev
```bash
cd infrastructure
cdk deploy -c environment=dev --all --require-approval never
```

## Deploy to Production
```bash
cd infrastructure
cdk deploy -c environment=prod --all --require-approval never
```

## Important Notes

- Always use `-c environment=<env>` to ensure correct CORS origins are configured
- The `--all` flag deploys all stacks
- The `--require-approval never` flag skips manual approval prompts

## Verify Deployment

After deploying to QA, test at: https://qa.regulatoryexams.co.za
After deploying to prod, test at: https://app.regulatoryexams.co.za
