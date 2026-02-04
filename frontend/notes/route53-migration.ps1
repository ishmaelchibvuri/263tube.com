# PowerShell script for AWS Route53 DNS Migration - debtpayoff.co.za
# This script migrates DNS records from Afrihost to AWS Route53

# IMPORTANT: Replace with your actual Route53 hosted zone ID
# You can get it by running: aws route53 list-hosted-zones
$HOSTED_ZONE_ID = "YOUR_HOSTED_ZONE_ID"
$DOMAIN = "debtpayoff.co.za"

Write-Host "=== Migrating DNS records for $DOMAIN to Route53 ===" -ForegroundColor Green
Write-Host "Hosted Zone ID: $HOSTED_ZONE_ID"
Write-Host ""

# Function to create a change batch and apply it
function Apply-Change {
    param($ChangeBatch, $Description)

    Write-Host "Creating $Description..." -ForegroundColor Yellow
    $tempFile = [System.IO.Path]::GetTempFileName()
    $ChangeBatch | ConvertTo-Json -Depth 10 | Out-File -FilePath $tempFile -Encoding utf8

    aws route53 change-resource-record-sets --hosted-zone-id $HOSTED_ZONE_ID --change-batch "file://$tempFile"
    Remove-Item $tempFile
    Write-Host "$Description created successfully!" -ForegroundColor Green
    Write-Host ""
}

# 1. Create A record for root domain (@)
$rootARecord = @{
    Changes = @(
        @{
            Action = "UPSERT"
            ResourceRecordSet = @{
                Name = $DOMAIN
                Type = "A"
                TTL = 7200
                ResourceRecords = @(
                    @{ Value = "102.222.124.101" }
                )
            }
        }
    )
}
Apply-Change -ChangeBatch $rootARecord -Description "Root domain A record"

# 2. Create A records for subdomains
$subdomainRecords = @{
    Changes = @(
        @{
            Action = "UPSERT"
            ResourceRecordSet = @{
                Name = "www.$DOMAIN"
                Type = "A"
                TTL = 7200
                ResourceRecords = @(@{ Value = "102.222.124.101" })
            }
        },
        @{
            Action = "UPSERT"
            ResourceRecordSet = @{
                Name = "ftp.$DOMAIN"
                Type = "A"
                TTL = 7200
                ResourceRecords = @(@{ Value = "102.222.124.101" })
            }
        },
        @{
            Action = "UPSERT"
            ResourceRecordSet = @{
                Name = "cpanel.$DOMAIN"
                Type = "A"
                TTL = 7200
                ResourceRecords = @(@{ Value = "102.222.124.101" })
            }
        },
        @{
            Action = "UPSERT"
            ResourceRecordSet = @{
                Name = "webmail.$DOMAIN"
                Type = "A"
                TTL = 7200
                ResourceRecords = @(@{ Value = "102.222.124.101" })
            }
        },
        @{
            Action = "UPSERT"
            ResourceRecordSet = @{
                Name = "mail.$DOMAIN"
                Type = "A"
                TTL = 7200
                ResourceRecords = @(@{ Value = "102.222.124.101" })
            }
        }
    )
}
Apply-Change -ChangeBatch $subdomainRecords -Description "Subdomain A records"

# 3. Create wildcard A record
$wildcardRecord = @{
    Changes = @(
        @{
            Action = "UPSERT"
            ResourceRecordSet = @{
                Name = "*.$DOMAIN"
                Type = "A"
                TTL = 7200
                ResourceRecords = @(@{ Value = "102.222.124.101" })
            }
        }
    )
}
Apply-Change -ChangeBatch $wildcardRecord -Description "Wildcard A record"

# 4. Create MX record
$mxRecord = @{
    Changes = @(
        @{
            Action = "UPSERT"
            ResourceRecordSet = @{
                Name = $DOMAIN
                Type = "MX"
                TTL = 7200
                ResourceRecords = @(@{ Value = "10 mail.$DOMAIN" })
            }
        }
    )
}
Apply-Change -ChangeBatch $mxRecord -Description "MX record"

# 5. Create TXT records (SPF, DMARC, mailconf)
$txtRecords = @{
    Changes = @(
        @{
            Action = "UPSERT"
            ResourceRecordSet = @{
                Name = $DOMAIN
                Type = "TXT"
                TTL = 7200
                ResourceRecords = @(
                    @{ Value = "`"mailconf=https://envoy.aserv.co.za/mail/config-v1.1.xml`"" },
                    @{ Value = "`"v=spf1 include:spf.aserv.co.za +a +mx -all`"" }
                )
            }
        },
        @{
            Action = "UPSERT"
            ResourceRecordSet = @{
                Name = "_dmarc.$DOMAIN"
                Type = "TXT"
                TTL = 7200
                ResourceRecords = @(@{ Value = "`"v=DMARC1; p=none; fo=0; adkim=s; aspf=s`"" })
            }
        }
    )
}
Apply-Change -ChangeBatch $txtRecords -Description "TXT records (SPF, DMARC)"

# 6. Create CNAME records
$cnameRecords = @{
    Changes = @(
        @{
            Action = "UPSERT"
            ResourceRecordSet = @{
                Name = "autoconfig.$DOMAIN"
                Type = "CNAME"
                TTL = 7200
                ResourceRecords = @(@{ Value = "envoy.aserv.co.za" })
            }
        },
        @{
            Action = "UPSERT"
            ResourceRecordSet = @{
                Name = "autodiscover.$DOMAIN"
                Type = "CNAME"
                TTL = 7200
                ResourceRecords = @(@{ Value = "envoy.aserv.co.za" })
            }
        }
    )
}
Apply-Change -ChangeBatch $cnameRecords -Description "CNAME records"

# 7. Create SRV records
$srvRecords = @{
    Changes = @(
        @{
            Action = "UPSERT"
            ResourceRecordSet = @{
                Name = "_imaps._tcp.$DOMAIN"
                Type = "SRV"
                TTL = 7200
                ResourceRecords = @(@{ Value = "1 1 993 envoy.aserv.co.za" })
            }
        },
        @{
            Action = "UPSERT"
            ResourceRecordSet = @{
                Name = "_autodiscover._tcp.$DOMAIN"
                Type = "SRV"
                TTL = 7200
                ResourceRecords = @(@{ Value = "0 1 443 envoy.aserv.co.za" })
            }
        },
        @{
            Action = "UPSERT"
            ResourceRecordSet = @{
                Name = "_submission._tcp.$DOMAIN"
                Type = "SRV"
                TTL = 7200
                ResourceRecords = @(@{ Value = "1 1 25 envoy.aserv.co.za" })
            }
        }
    )
}
Apply-Change -ChangeBatch $srvRecords -Description "SRV records"

Write-Host "=== Migration Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Verify all records in Route53 console or by running:"
Write-Host "   aws route53 list-resource-record-sets --hosted-zone-id $HOSTED_ZONE_ID"
Write-Host ""
Write-Host "2. Note your Route53 nameservers:"
Write-Host "   aws route53 get-hosted-zone --id $HOSTED_ZONE_ID"
Write-Host ""
Write-Host "3. Update your domain registrar to use the AWS Route53 nameservers"
Write-Host "   (typically 4 nameservers like ns-xxx.awsdns-xx.com)"
Write-Host ""
Write-Host "4. Wait for DNS propagation (can take up to 48 hours, usually much faster)"
Write-Host ""
Write-Host "5. Test DNS resolution using online tools or nslookup"
