# DNS Migration Guide: Afrihost to AWS Route53

## Overview
This guide will help you migrate your DNS records for `debtpayoff.co.za` from Afrihost to AWS Route53.

## Prerequisites
- AWS CLI installed and configured with appropriate credentials
- AWS account with Route53 access
- A hosted zone created in Route53 for `debtpayoff.co.za`

## Step 1: Create Hosted Zone (if not already done)

```bash
aws route53 create-hosted-zone \
    --name debtpayoff.co.za \
    --caller-reference $(date +%s) \
    --hosted-zone-config Comment="Migration from Afrihost"
```

Note the Hosted Zone ID from the output.

## Step 2: Get Your Hosted Zone ID

If you already created a hosted zone, find its ID:

```bash
aws route53 list-hosted-zones | grep debtpayoff.co.za -A 3
```

Or in PowerShell:
```powershell
aws route53 list-hosted-zones | Select-String "debtpayoff.co.za" -Context 0,3
```

## Step 3: Run the Migration Script

### For Linux/Mac (Bash):
1. Edit `route53-migration.sh` and replace `YOUR_HOSTED_ZONE_ID` with your actual hosted zone ID
2. Make the script executable:
   ```bash
   chmod +x route53-migration.sh
   ```
3. Run the script:
   ```bash
   ./route53-migration.sh
   ```

### For Windows (PowerShell):
1. Edit `route53-migration.ps1` and replace `YOUR_HOSTED_ZONE_ID` with your actual hosted zone ID
2. Run the script:
   ```powershell
   .\route53-migration.ps1
   ```

## Step 4: Verify the Records

### Using AWS CLI:
```bash
aws route53 list-resource-record-sets --hosted-zone-id YOUR_HOSTED_ZONE_ID
```

### Using AWS Console:
1. Go to Route53 in AWS Console
2. Click on "Hosted zones"
3. Click on `debtpayoff.co.za`
4. Review all the records

## Step 5: Get Your Route53 Nameservers

```bash
aws route53 get-hosted-zone --id YOUR_HOSTED_ZONE_ID
```

You'll see 4 nameservers like:
- ns-1234.awsdns-12.org
- ns-5678.awsdns-56.com
- ns-9012.awsdns-90.net
- ns-3456.awsdns-34.co.uk

## Step 6: Update Your Domain Registrar

1. Log in to your domain registrar (where you registered debtpayoff.co.za)
2. Navigate to DNS/Nameserver settings
3. Replace the current nameservers with the 4 Route53 nameservers
4. Save the changes

## Step 7: Wait for DNS Propagation

- DNS changes can take up to 48 hours to propagate globally
- Usually, changes are visible within a few hours
- You can check propagation status at: https://www.whatsmydns.net/

## Step 8: Test DNS Resolution

### Test using dig (Linux/Mac):
```bash
dig @8.8.8.8 debtpayoff.co.za
dig @8.8.8.8 www.debtpayoff.co.za
dig @8.8.8.8 mail.debtpayoff.co.za
```

### Test using nslookup (Windows):
```powershell
nslookup debtpayoff.co.za 8.8.8.8
nslookup www.debtpayoff.co.za 8.8.8.8
nslookup mail.debtpayoff.co.za 8.8.8.8
```

## Records Being Migrated

### A Records
- `@` (root) → 102.222.124.101
- `www` → 102.222.124.101
- `ftp` → 102.222.124.101
- `cpanel` → 102.222.124.101
- `webmail` → 102.222.124.101
- `mail` → 102.222.124.101
- `*` (wildcard) → 102.222.124.101

### MX Record
- Priority 10 → mail.debtpayoff.co.za

### TXT Records
- SPF: `v=spf1 include:spf.aserv.co.za +a +mx -all`
- DMARC: `v=DMARC1; p=none; fo=0; adkim=s; aspf=s`
- Mail Config: `mailconf=https://envoy.aserv.co.za/mail/config-v1.1.xml`

### CNAME Records
- `autoconfig` → envoy.aserv.co.za
- `autodiscover` → envoy.aserv.co.za

### SRV Records
- `_imaps._tcp` → 1 1 993 envoy.aserv.co.za
- `_autodiscover._tcp` → 0 1 443 envoy.aserv.co.za
- `_submission._tcp` → 1 1 25 envoy.aserv.co.za

## Important Notes

1. **TTL Values**: All records use a 7200 second (2 hour) TTL, matching your Afrihost configuration

2. **Nameservers**: The NS records will be automatically created by Route53 when you create the hosted zone. Don't manually create these.

3. **SOA Record**: Route53 automatically creates and manages the SOA record. You don't need to migrate this.

4. **Email Continuity**: Your email will continue to work as long as the MX and mail-related records are correctly configured

5. **Testing Before Switching**: You can test the Route53 records before updating your nameservers by querying the Route53 nameservers directly:
   ```bash
   dig @ns-xxxx.awsdns-xx.org debtpayoff.co.za
   ```

## Rollback Plan

If something goes wrong, you can rollback by:
1. Changing the nameservers back to Afrihost's nameservers in your domain registrar
2. Your original Afrihost DNS configuration will still be active

## Cost Considerations

- Hosted Zone: $0.50/month per hosted zone
- Queries: $0.40 per million queries for the first billion queries/month
- Most small websites cost less than $1/month for Route53

## Support

If you encounter issues:
- AWS Route53 Documentation: https://docs.aws.amazon.com/route53/
- Check AWS Service Health Dashboard
- Review CloudWatch metrics for Route53
