# ============================================
# Backend Configuration Diagnostic Script (PowerShell)
# ============================================

$API_ID = "1dxxnmcn4b"
$REGION = "af-south-1"
$STAGE = "dev"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AWS API Gateway Configuration Diagnosis" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if AWS CLI is installed
try {
    $awsVersion = aws --version 2>&1
    Write-Host "✅ AWS CLI is installed: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI is not installed" -ForegroundColor Red
    Write-Host "Please install it: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📋 Fetching API Gateway details..." -ForegroundColor Yellow
Write-Host "API ID: $API_ID"
Write-Host "Region: $REGION"
Write-Host "Stage: $STAGE"
Write-Host ""

# Get API info
Write-Host "=== API Information ===" -ForegroundColor Cyan
$apiInfo = aws apigateway get-rest-api --rest-api-id $API_ID --region $REGION 2>&1
if ($LASTEXITCODE -eq 0) {
    $apiJson = $apiInfo | ConvertFrom-Json
    Write-Host "Name: $($apiJson.name)"
    Write-Host "Created: $($apiJson.createdDate)"
    Write-Host "Description: $($apiJson.description)"
} else {
    Write-Host "❌ Failed to get API info" -ForegroundColor Red
    Write-Host $apiInfo
}

Write-Host ""

# Get authorizers
Write-Host "=== Authorizers ===" -ForegroundColor Cyan
$authorizers = aws apigateway get-authorizers --rest-api-id $API_ID --region $REGION 2>&1
if ($LASTEXITCODE -eq 0) {
    $authJson = $authorizers | ConvertFrom-Json
    if ($authJson.items.Count -gt 0) {
        foreach ($auth in $authJson.items) {
            Write-Host "Authorizer ID: $($auth.id)" -ForegroundColor Green
            Write-Host "  Name: $($auth.name)"
            Write-Host "  Type: $($auth.type)"
            Write-Host "  Identity Source: $($auth.identitySource)"
            if ($auth.providerARNs) {
                Write-Host "  Provider ARNs: $($auth.providerARNs -join ', ')"
            }
            if ($auth.authorizerUri) {
                Write-Host "  Authorizer URI: $($auth.authorizerUri)"
            }
            Write-Host ""
        }
    } else {
        Write-Host "⚠️  No authorizers found" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Failed to get authorizers" -ForegroundColor Red
}

Write-Host ""

# Get all resources
Write-Host "=== API Resources ===" -ForegroundColor Cyan
$resources = aws apigateway get-resources --rest-api-id $API_ID --region $REGION 2>&1
if ($LASTEXITCODE -eq 0) {
    $resourcesJson = $resources | ConvertFrom-Json
    foreach ($resource in $resourcesJson.items) {
        Write-Host "$($resource.path) - ID: $($resource.id)"
    }
} else {
    Write-Host "❌ Failed to get resources" -ForegroundColor Red
}

Write-Host ""

# Function to get method configuration
function Get-MethodConfig {
    param (
        [string]$ResourceId,
        [string]$HttpMethod
    )
    
    $method = aws apigateway get-method `
        --rest-api-id $API_ID `
        --resource-id $ResourceId `
        --http-method $HttpMethod `
        --region $REGION 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        return $method | ConvertFrom-Json
    } else {
        return $null
    }
}

# Find /auth/profile resource
Write-Host "=== Checking /auth/profile Configuration ===" -ForegroundColor Cyan
$resourcesJson = $resources | ConvertFrom-Json
$profileResource = $resourcesJson.items | Where-Object { $_.path -eq "/auth/profile" }

if ($profileResource) {
    Write-Host "✅ Resource ID: $($profileResource.id)" -ForegroundColor Green
    Write-Host ""
    Write-Host "--- GET Method Configuration ---"
    
    $profileMethod = Get-MethodConfig -ResourceId $profileResource.id -HttpMethod "GET"
    
    if ($profileMethod) {
        Write-Host "Authorization Type: $($profileMethod.authorizationType)" -ForegroundColor $(if ($profileMethod.authorizationType -eq "COGNITO_USER_POOLS" -or $profileMethod.authorizationType -eq "CUSTOM") { "Green" } else { "Yellow" })
        Write-Host "Authorizer ID: $($profileMethod.authorizerId)"
        
        if ($profileMethod.authorizationScopes) {
            Write-Host "⚠️  OAuth Scopes: $($profileMethod.authorizationScopes -join ', ')" -ForegroundColor Yellow
            Write-Host "   WARNING: OAuth scopes are configured!" -ForegroundColor Red
            Write-Host "   This means API Gateway expects an ACCESS token, not ID token" -ForegroundColor Red
        } else {
            Write-Host "✅ OAuth Scopes: None (expects ID token)" -ForegroundColor Green
        }
        
        Write-Host "API Key Required: $($profileMethod.apiKeyRequired)"
        
        # Get authorizer details if present
        if ($profileMethod.authorizerId) {
            Write-Host ""
            Write-Host "--- Authorizer Details ---"
            $authDetails = aws apigateway get-authorizer `
                --rest-api-id $API_ID `
                --authorizer-id $profileMethod.authorizerId `
                --region $REGION 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                $authJson = $authDetails | ConvertFrom-Json
                Write-Host "Authorizer Name: $($authJson.name)"
                Write-Host "Authorizer Type: $($authJson.type)"
                if ($authJson.providerARNs) {
                    Write-Host "User Pool ARNs: $($authJson.providerARNs -join ', ')"
                }
                if ($authJson.authorizerUri) {
                    Write-Host "Lambda URI: $($authJson.authorizerUri)"
                }
                Write-Host "Cache TTL: $($authJson.authorizerResultTtlInSeconds) seconds"
            }
        }
    } else {
        Write-Host "❌ GET method not found on /auth/profile" -ForegroundColor Red
    }
} else {
    Write-Host "❌ /auth/profile resource not found!" -ForegroundColor Red
}

Write-Host ""

# Find /user/stats resource
Write-Host "=== Checking /user/stats Configuration ===" -ForegroundColor Cyan
$statsResource = $resourcesJson.items | Where-Object { $_.path -eq "/user/stats" }

if ($statsResource) {
    Write-Host "✅ Resource ID: $($statsResource.id)" -ForegroundColor Green
    Write-Host ""
    Write-Host "--- GET Method Configuration ---"
    
    $statsMethod = Get-MethodConfig -ResourceId $statsResource.id -HttpMethod "GET"
    
    if ($statsMethod) {
        Write-Host "Authorization Type: $($statsMethod.authorizationType)" -ForegroundColor $(if ($statsMethod.authorizationType -eq "COGNITO_USER_POOLS" -or $statsMethod.authorizationType -eq "CUSTOM") { "Green" } else { "Yellow" })
        Write-Host "Authorizer ID: $($statsMethod.authorizerId)"
        
        if ($statsMethod.authorizationScopes) {
            Write-Host "⚠️  OAuth Scopes: $($statsMethod.authorizationScopes -join ', ')" -ForegroundColor Yellow
        } else {
            Write-Host "✅ OAuth Scopes: None (expects ID token)" -ForegroundColor Green
        }
        
        Write-Host "API Key Required: $($statsMethod.apiKeyRequired)"
    } else {
        Write-Host "❌ GET method not found on /user/stats" -ForegroundColor Red
    }
} else {
    Write-Host "❌ /user/stats resource not found!" -ForegroundColor Red
}

Write-Host ""

# Check deployments
Write-Host "=== Recent Deployments ===" -ForegroundColor Cyan
$deployments = aws apigateway get-deployments --rest-api-id $API_ID --region $REGION 2>&1
if ($LASTEXITCODE -eq 0) {
    $deploymentsJson = $deployments | ConvertFrom-Json
    $recentDeployments = $deploymentsJson.items | Select-Object -First 3
    foreach ($deploy in $recentDeployments) {
        Write-Host "Deployment ID: $($deploy.id)"
        Write-Host "  Created: $($deploy.createdDate)"
        Write-Host "  Description: $($deploy.description)"
        Write-Host ""
    }
} else {
    Write-Host "❌ Failed to get deployments" -ForegroundColor Red
}

# Check stage configuration
Write-Host "=== Stage Configuration ===" -ForegroundColor Cyan
$stage = aws apigateway get-stage --rest-api-id $API_ID --stage-name $STAGE --region $REGION 2>&1
if ($LASTEXITCODE -eq 0) {
    $stageJson = $stage | ConvertFrom-Json
    Write-Host "Stage Name: $($stageJson.stageName)"
    Write-Host "Deployment ID: $($stageJson.deploymentId)"
    Write-Host "Cache Enabled: $($stageJson.cacheClusterEnabled)"
    Write-Host "Tracing Enabled: $($stageJson.tracingEnabled)"
    Write-Host "Last Updated: $($stageJson.lastUpdatedDate)"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Diagnosis Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Analysis
Write-Host "🔍 Analysis:" -ForegroundColor Yellow
Write-Host ""

# Compare configurations
if ($profileMethod -and $statsMethod) {
    if ($profileMethod.authorizationType -ne $statsMethod.authorizationType) {
        Write-Host "⚠️  WARNING: Different authorization types detected!" -ForegroundColor Red
        Write-Host "   /auth/profile: $($profileMethod.authorizationType)" -ForegroundColor Yellow
        Write-Host "   /user/stats: $($statsMethod.authorizationType)" -ForegroundColor Yellow
        Write-Host "   This explains why one endpoint works and the other doesn't!" -ForegroundColor Red
        Write-Host ""
    }
    
    if ($profileMethod.authorizerId -ne $statsMethod.authorizerId) {
        Write-Host "⚠️  WARNING: Different authorizers detected!" -ForegroundColor Red
        Write-Host "   /auth/profile: $($profileMethod.authorizerId)" -ForegroundColor Yellow
        Write-Host "   /user/stats: $($statsMethod.authorizerId)" -ForegroundColor Yellow
        Write-Host ""
    }
    
    $profileHasScopes = $profileMethod.authorizationScopes -ne $null
    $statsHasScopes = $statsMethod.authorizationScopes -ne $null
    
    if ($profileHasScopes -ne $statsHasScopes) {
        Write-Host "⚠️  WARNING: OAuth scope configuration differs!" -ForegroundColor Red
        Write-Host "   /auth/profile has scopes: $profileHasScopes" -ForegroundColor Yellow
        Write-Host "   /user/stats has scopes: $statsHasScopes" -ForegroundColor Yellow
        Write-Host "   They must match!" -ForegroundColor Red
        Write-Host ""
    }
    
    if ($profileHasScopes) {
        Write-Host "⚠️  CRITICAL: OAuth Scopes are configured on /auth/profile" -ForegroundColor Red
        Write-Host "   This means you MUST use ACCESS token, not ID token" -ForegroundColor Red
        Write-Host "   Your client is currently using ID token!" -ForegroundColor Red
        Write-Host ""
        Write-Host "   SOLUTION: Either" -ForegroundColor Yellow
        Write-Host "   1. Remove OAuth scopes from the API Gateway method (recommended)" -ForegroundColor Green
        Write-Host "   2. Switch your client to use access token instead of ID token" -ForegroundColor Green
        Write-Host ""
    }
}

Write-Host ""
Write-Host "✅ Next Steps:" -ForegroundColor Green
Write-Host ""
Write-Host "1. Review the configuration differences above"
Write-Host "2. Make both endpoints use the same configuration"
Write-Host "3. If OAuth scopes are set, remove them (unless you want to use access tokens)"
Write-Host "4. Redeploy the API after making changes"
Write-Host "5. Check CloudWatch logs for detailed error messages"
Write-Host ""

# CloudWatch logs command
Write-Host "📊 To check CloudWatch logs, run:" -ForegroundColor Yellow
Write-Host ""
Write-Host "aws logs tail /aws/apigateway/$API_ID/$STAGE --follow --region $REGION" -ForegroundColor Cyan
Write-Host ""
Write-Host "Or view logs in AWS Console:" -ForegroundColor Yellow
$consoleUrl = "https://console.aws.amazon.com/cloudwatch/home?region=$REGION#logsV2:log-groups/log-group//aws/apigateway/$API_ID/$STAGE"
Write-Host $consoleUrl -ForegroundColor Cyan
Write-Host ""