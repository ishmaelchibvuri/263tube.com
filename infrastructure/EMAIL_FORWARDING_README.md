# Email Forwarding Infrastructure

This infrastructure automatically forwards emails from `support@regulatoryexams.co.za` to your Jira Service Desk at `support@regulatoryexams.atlassian.net`.

## Architecture

```
Customer Email → SES (MX Record) → S3 (Backup) → Lambda → Jira Service Desk
                                                ↓
                                         CloudWatch Logs
```

### Components

1. **S3 Bucket**: Stores all incoming emails for 30 days (automatic deletion after)
2. **Lambda Function**: Forwards emails to Jira while preserving original sender info
3. **SES Receipt Rules**: Processes incoming emails and triggers actions
4. **IAM Roles**: Provides necessary permissions for Lambda and SES

## Deployment

### Prerequisites

- AWS CLI configured with appropriate credentials
- AWS CDK installed (`npm install -g aws-cdk`)
- Domain verified in AWS SES (`regulatoryexams.co.za`)
- MX record pointing to SES: `10 inbound-smtp.af-south-1.amazonaws.com`

### Deploy with CDK

```bash
cd infrastructure

# Install dependencies
npm install

# Deploy the email forwarding stack
cdk deploy RegulatoryExamsEmailForwarding

# Or deploy all stacks
cdk deploy --all
```

### Manual Deployment (Already Done)

The infrastructure has been manually deployed and is currently active:
- S3 Bucket: `regulatoryexams-inbound-emails`
- Lambda Function: `ses-email-forwarder`
- Receipt Rule Set: `default-rule-set`
- Receipt Rule: `support-email-rule`

## DNS Configuration

The following DNS records are configured in Route 53:

### MX Record
```
regulatoryexams.co.za.  300  IN  MX  10 inbound-smtp.af-south-1.amazonaws.com
```

### SPF Record
```
regulatoryexams.co.za.  300  IN  TXT  "v=spf1 include:spf.sendinblue.com include:amazonses.com ~all"
```

### DKIM Records (Already configured)
- Three DKIM records for AWS SES authentication

## How It Works

1. **Email Reception**:
   - Customer sends email to `support@regulatoryexams.co.za`
   - DNS routes to AWS SES via MX record
   - SES receives and scans the email

2. **Storage**:
   - Email is stored in S3 bucket: `s3://regulatoryexams-inbound-emails/emails/`
   - Retained for 30 days then automatically deleted

3. **Forwarding**:
   - Lambda function is triggered
   - Reads email from S3
   - Preserves original sender in headers and body
   - Forwards to `support@regulatoryexams.atlassian.net`
   - Sets Reply-To to original sender

4. **Jira Integration**:
   - Jira receives email at service desk address
   - Creates ticket automatically
   - Original sender info preserved in ticket

## Testing

### Send a Test Email

```bash
# Option 1: Using AWS SES
aws ses send-email \
  --region af-south-1 \
  --from "test@example.com" \
  --destination "ToAddresses=support@regulatoryexams.co.za" \
  --message "Subject={Data='Test Email'},Body={Text={Data='This is a test'}}"

# Option 2: Send from any email client
# Just send an email to support@regulatoryexams.co.za
```

### Verify Email Delivery

```bash
# Check S3 for received emails
aws s3 ls s3://regulatoryexams-inbound-emails/emails/ --region af-south-1

# Check Lambda logs
aws logs tail /aws/lambda/ses-email-forwarder --follow --region af-south-1

# Check Jira Service Desk for new ticket
```

## Monitoring

### CloudWatch Logs

Lambda function logs are available at:
```
/aws/lambda/ses-email-forwarder
```

### Metrics to Monitor

- **Lambda Invocations**: Should match email volume
- **Lambda Errors**: Should be zero or very low
- **S3 Object Count**: Track email volume
- **SES Bounce Rate**: Monitor delivery issues

### Common Issues

1. **Email not received in Jira**:
   - Check Lambda logs for errors
   - Verify Jira email address is correct
   - Check SES sending limits

2. **Emails stored but not forwarded**:
   - Check Lambda function environment variables
   - Verify Lambda has SES send permissions
   - Check S3 bucket policy allows Lambda read access

3. **Original sender info lost**:
   - Check Lambda code preserves headers
   - Verify Reply-To header is set correctly

## Cost Estimate

- **SES Receiving**: First 1,000 emails/month FREE, then $0.10 per 1,000
- **SES Sending (forwarding)**: $0.10 per 1,000 emails
- **S3 Storage**: ~$0.023/GB per month (emails auto-deleted after 30 days)
- **Lambda**: 1M requests FREE, then $0.20 per 1M requests
- **Estimated Total**: < $1/month for typical support email volume

## Configuration

### Update Jira Email Address

Edit `infrastructure/bin/app.ts`:
```typescript
jiraEmail: 'your-new-email@atlassian.net',
```

Then redeploy:
```bash
cdk deploy RegulatoryExamsEmailForwarding
```

### Change Email Retention Period

Edit `infrastructure/lib/email-forwarding-stack.ts`:
```typescript
lifecycleRules: [
  {
    expiration: cdk.Duration.days(60), // Change from 30 to 60 days
    enabled: true,
  },
],
```

## Cleanup

To remove all resources:

```bash
# Delete the stack
cdk destroy RegulatoryExamsEmailForwarding

# Note: If S3 bucket contains data and RemovalPolicy is RETAIN,
# you'll need to manually delete the bucket:
aws s3 rm s3://regulatoryexams-inbound-emails --recursive --region af-south-1
aws s3 rb s3://regulatoryexams-inbound-emails --region af-south-1
```

## Security

- All emails are encrypted at rest in S3 (S3_MANAGED encryption)
- Lambda function has minimal IAM permissions (read S3, send via SES)
- SES scans all incoming emails for spam/viruses
- No public access to S3 bucket (BLOCK_ALL)
- Emails auto-deleted after 30 days to minimize data retention

## Support

For issues or questions:
1. Check Lambda CloudWatch logs
2. Review SES bounce notifications
3. Verify DNS configuration with: `nslookup -type=MX regulatoryexams.co.za`
4. Test SMTP connectivity: `telnet inbound-smtp.af-south-1.amazonaws.com 25`
