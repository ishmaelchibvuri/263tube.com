#!/bin/bash

# AWS Route53 DNS Migration Script for debtpayoff.co.za
# This script migrates DNS records from Afrihost to AWS Route53

# IMPORTANT: Replace YOUR_HOSTED_ZONE_ID with your actual Route53 hosted zone ID
# You can get it by running: aws route53 list-hosted-zones
HOSTED_ZONE_ID="YOUR_HOSTED_ZONE_ID"
DOMAIN="debtpayoff.co.za"

echo "=== Migrating DNS records for ${DOMAIN} to Route53 ==="
echo "Hosted Zone ID: ${HOSTED_ZONE_ID}"
echo ""

# Function to create a change batch and apply it
apply_change() {
    local change_file=$1
    echo "Applying change from ${change_file}..."
    aws route53 change-resource-record-sets \
        --hosted-zone-id "${HOSTED_ZONE_ID}" \
        --change-batch "file://${change_file}"
    echo "Change applied successfully!"
    echo ""
}

# 1. Create A record for root domain (@)
echo "Creating A record for root domain..."
cat > /tmp/route53-change-root-a.json <<EOF
{
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "${DOMAIN}",
      "Type": "A",
      "TTL": 7200,
      "ResourceRecords": [{"Value": "102.222.124.101"}]
    }
  }]
}
EOF
apply_change "/tmp/route53-change-root-a.json"

# 2. Create A records for subdomains
echo "Creating A records for subdomains..."
cat > /tmp/route53-change-subdomains.json <<EOF
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "www.${DOMAIN}",
        "Type": "A",
        "TTL": 7200,
        "ResourceRecords": [{"Value": "102.222.124.101"}]
      }
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "ftp.${DOMAIN}",
        "Type": "A",
        "TTL": 7200,
        "ResourceRecords": [{"Value": "102.222.124.101"}]
      }
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "cpanel.${DOMAIN}",
        "Type": "A",
        "TTL": 7200,
        "ResourceRecords": [{"Value": "102.222.124.101"}]
      }
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "webmail.${DOMAIN}",
        "Type": "A",
        "TTL": 7200,
        "ResourceRecords": [{"Value": "102.222.124.101"}]
      }
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "mail.${DOMAIN}",
        "Type": "A",
        "TTL": 7200,
        "ResourceRecords": [{"Value": "102.222.124.101"}]
      }
    }
  ]
}
EOF
apply_change "/tmp/route53-change-subdomains.json"

# 3. Create wildcard A record
echo "Creating wildcard A record..."
cat > /tmp/route53-change-wildcard.json <<EOF
{
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "*.${DOMAIN}",
      "Type": "A",
      "TTL": 7200,
      "ResourceRecords": [{"Value": "102.222.124.101"}]
    }
  }]
}
EOF
apply_change "/tmp/route53-change-wildcard.json"

# 4. Create MX record
echo "Creating MX record..."
cat > /tmp/route53-change-mx.json <<EOF
{
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "${DOMAIN}",
      "Type": "MX",
      "TTL": 7200,
      "ResourceRecords": [{"Value": "10 mail.${DOMAIN}"}]
    }
  }]
}
EOF
apply_change "/tmp/route53-change-mx.json"

# 5. Create TXT records (SPF, DMARC, mailconf)
echo "Creating TXT records..."
cat > /tmp/route53-change-txt.json <<EOF
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "${DOMAIN}",
        "Type": "TXT",
        "TTL": 7200,
        "ResourceRecords": [
          {"Value": "\"mailconf=https://envoy.aserv.co.za/mail/config-v1.1.xml\""},
          {"Value": "\"v=spf1 include:spf.aserv.co.za +a +mx -all\""}
        ]
      }
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "_dmarc.${DOMAIN}",
        "Type": "TXT",
        "TTL": 7200,
        "ResourceRecords": [{"Value": "\"v=DMARC1; p=none; fo=0; adkim=s; aspf=s\""}]
      }
    }
  ]
}
EOF
apply_change "/tmp/route53-change-txt.json"

# 6. Create CNAME records
echo "Creating CNAME records..."
cat > /tmp/route53-change-cname.json <<EOF
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "autoconfig.${DOMAIN}",
        "Type": "CNAME",
        "TTL": 7200,
        "ResourceRecords": [{"Value": "envoy.aserv.co.za"}]
      }
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "autodiscover.${DOMAIN}",
        "Type": "CNAME",
        "TTL": 7200,
        "ResourceRecords": [{"Value": "envoy.aserv.co.za"}]
      }
    }
  ]
}
EOF
apply_change "/tmp/route53-change-cname.json"

# 7. Create SRV records
echo "Creating SRV records..."
cat > /tmp/route53-change-srv.json <<EOF
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "_imaps._tcp.${DOMAIN}",
        "Type": "SRV",
        "TTL": 7200,
        "ResourceRecords": [{"Value": "1 1 993 envoy.aserv.co.za"}]
      }
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "_autodiscover._tcp.${DOMAIN}",
        "Type": "SRV",
        "TTL": 7200,
        "ResourceRecords": [{"Value": "0 1 443 envoy.aserv.co.za"}]
      }
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "_submission._tcp.${DOMAIN}",
        "Type": "SRV",
        "TTL": 7200,
        "ResourceRecords": [{"Value": "1 1 25 envoy.aserv.co.za"}]
      }
    }
  ]
}
EOF
apply_change "/tmp/route53-change-srv.json"

echo "=== Migration Complete ==="
echo ""
echo "IMPORTANT NEXT STEPS:"
echo "1. Verify all records in Route53 console or by running:"
echo "   aws route53 list-resource-record-sets --hosted-zone-id ${HOSTED_ZONE_ID}"
echo ""
echo "2. Note your Route53 nameservers:"
echo "   aws route53 get-hosted-zone --id ${HOSTED_ZONE_ID}"
echo ""
echo "3. Update your domain registrar to use the AWS Route53 nameservers"
echo "   (typically 4 nameservers like ns-xxx.awsdns-xx.com)"
echo ""
echo "4. Wait for DNS propagation (can take up to 48 hours, usually much faster)"
echo ""
echo "5. Test DNS resolution:"
echo "   dig @8.8.8.8 ${DOMAIN}"
echo "   dig @8.8.8.8 www.${DOMAIN}"
