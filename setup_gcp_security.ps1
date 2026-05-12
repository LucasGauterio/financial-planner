# =========================================================================================
# Google Cloud Platform Security Orchestration Script
# Target Domain: financialplanner.lgauterio.com.br
# Regional Target: Cloud Run service 'financial-planner' in 'southamerica-east1'
# Features: Global Load Balancer (ALB), Cloud CDN (Caching), Cloud Armor (DDoS / Rate Limit)
# =========================================================================================

$ErrorActionPreference = "Stop"

# Configuration Variables
$PROJECT_ID = "financialplanner-495622"
$REGION = "southamerica-east1"
$SERVICE_NAME = "financial-planner"
$DOMAIN_NAME = "financialplanner.lgauterio.com.br"
$IP_NAME = "financial-planner-global-ip"
$NEG_NAME = "financial-planner-neg-sae"
$BACKEND_NAME = "financial-planner-backend-global"
$URL_MAP_NAME = "financial-planner-lb-map"
$SSL_CERT_NAME = "financial-planner-ssl-cert"
$HTTPS_PROXY_NAME = "financial-planner-https-proxy"
$FORWARDING_RULE_NAME = "financial-planner-https-rule"
$ARMOR_POLICY_NAME = "financial-planner-armor-policy"

Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host "🚀 Starting GCP Security & Infrastructure Provisioning" -ForegroundColor Cyan
Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host "Target Domain: $DOMAIN_NAME"
Write-Host "Target Service: $SERVICE_NAME ($REGION)"
Write-Host "Project ID: $PROJECT_ID"
Write-Host "-------------------------------------------------------------------------"

# Set Active GCP Project
Write-Host "📍 Setting active gcloud project to $PROJECT_ID..." -ForegroundColor Yellow
gcloud config set project $PROJECT_ID

# 1. Reserve Global External Static IP Address
Write-Host "🌐 Step 1: Reserving Global External Static IP Address..." -ForegroundColor Yellow
try {
    gcloud compute addresses create $IP_NAME --global
    Write-Host "✅ Static IP reserved successfully." -ForegroundColor Green
} catch {
    Write-Host "ℹ️ Static IP already exists or reservation skipped." -ForegroundColor Gray
}

$STATIC_IP = gcloud compute addresses describe $IP_NAME --global --format="get(address)"
Write-Host "📢 Your Reserved Static IP is: $STATIC_IP" -ForegroundColor Cyan
Write-Host "🚨 ACTION REQUIRED: Go to your DNS provider and point an 'A' record for '$DOMAIN_NAME' to '$STATIC_IP'." -ForegroundColor Red

# 2. Create Serverless Network Endpoint Group (NEG)
Write-Host "⚡ Step 2: Creating Serverless Network Endpoint Group (NEG)..." -ForegroundColor Yellow
try {
    gcloud compute network-endpoint-groups create $NEG_NAME `
        --region=$REGION `
        --network-endpoint-type=serverless `
        --cloud-run-service=$SERVICE_NAME
    Write-Host "✅ Serverless NEG created." -ForegroundColor Green
} catch {
    Write-Host "ℹ️ Serverless NEG already exists." -ForegroundColor Gray
}

# 3. Create Backend Service with Cloud CDN Enabled
Write-Host "📦 Step 3: Creating Global Backend Service with Cloud CDN..." -ForegroundColor Yellow
try {
    gcloud compute backend-services create $BACKEND_NAME `
        --global `
        --enable-cdn
    Write-Host "✅ Global Backend Service created." -ForegroundColor Green
} catch {
    Write-Host "ℹ️ Global Backend Service already exists." -ForegroundColor Gray
}

# 4. Attach NEG to Backend Service
Write-Host "🔗 Step 4: Binding Serverless NEG to the Backend Service..." -ForegroundColor Yellow
try {
    gcloud compute backend-services add-backend $BACKEND_NAME `
        --global `
        --network-endpoint-group=$NEG_NAME `
        --network-endpoint-group-region=$REGION
    Write-Host "✅ Serverless NEG successfully bound." -ForegroundColor Green
} catch {
    Write-Host "ℹ️ Serverless NEG was already attached." -ForegroundColor Gray
}

# 5. Create URL Map Routing Rule
Write-Host "🗺️ Step 5: Provisioning URL Map Traffic Router..." -ForegroundColor Yellow
try {
    gcloud compute url-maps create $URL_MAP_NAME `
        --default-service=$BACKEND_NAME
    Write-Host "✅ URL Map router created." -ForegroundColor Green
} catch {
    Write-Host "ℹ️ URL Map router already exists." -ForegroundColor Gray
}

# 6. Provision Google-Managed SSL Certificate
Write-Host "🔒 Step 6: Provisioning Google-Managed SSL Certificate for $DOMAIN_NAME..." -ForegroundColor Yellow
try {
    gcloud compute ssl-certificates create $SSL_CERT_NAME `
        --domains=$DOMAIN_NAME
    Write-Host "✅ Google-Managed SSL certificate resource initialized." -ForegroundColor Green
} catch {
    Write-Host "ℹ️ SSL Certificate resource already exists." -ForegroundColor Gray
}

# 7. Create Target HTTPS Proxy
Write-Host "🛡️ Step 7: Creating Target HTTPS Proxy..." -ForegroundColor Yellow
try {
    gcloud compute target-https-proxies create $HTTPS_PROXY_NAME `
        --url-map=$URL_MAP_NAME `
        --ssl-certificates=$SSL_CERT_NAME
    Write-Host "✅ Target HTTPS Proxy created." -ForegroundColor Green
} catch {
    Write-Host "ℹ️ Target HTTPS Proxy already exists." -ForegroundColor Gray
}

# 8. Create Global HTTPS Forwarding Rule (Port 443)
Write-Host "📡 Step 8: Binding Static IP to HTTPS Proxy on Port 443..." -ForegroundColor Yellow
try {
    gcloud compute forwarding-rules create $FORWARDING_RULE_NAME `
        --global `
        --address=$IP_NAME `
        --target-https-proxy=$HTTPS_PROXY_NAME `
        --ports=443
    Write-Host "✅ Global Port 443 Forwarding Rule activated." -ForegroundColor Green
} catch {
    Write-Host "ℹ️ Forwarding Rule already exists." -ForegroundColor Gray
}

# 9. Create Cloud Armor Security Policy
Write-Host "🛡️ Step 9: Crafting Cloud Armor DDoS & Security Shield..." -ForegroundColor Yellow
try {
    gcloud compute security-policies create $ARMOR_POLICY_NAME `
        --description="DDoS protection policy for financialplanner.lgauterio.com.br"
    Write-Host "✅ Cloud Armor Policy container initialized." -ForegroundColor Green
} catch {
    Write-Host "ℹ️ Cloud Armor Policy container already exists." -ForegroundColor Gray
}

# 10. Append IP Rate Limiting Rule (Max 100 requests per minute per IP)
Write-Host "⏳ Step 10: Injecting IP Rate-Limiting Rule (Max 100 req/min)..." -ForegroundColor Yellow
try {
    gcloud compute security-policies rules create 1000 `
        --security-policy=$ARMOR_POLICY_NAME `
        --expression="true" `
        --action=rate-based-ban `
        --rate-limit-threshold-count=100 `
        --rate-limit-threshold-interval-sec=60 `
        --conform-action=allow `
        --exceed-action=deny-429 `
        --enforce-on-key=IP
    Write-Host "✅ Rate-limiting filter injected into policy." -ForegroundColor Green
} catch {
    Write-Host "ℹ️ Rate-limiting filter rule already exists." -ForegroundColor Gray
}

# 11. Bind Cloud Armor to Backend Service
Write-Host "🛡️ Step 11: Activating Cloud Armor Shield on Load Balancer..." -ForegroundColor Yellow
gcloud compute backend-services update $BACKEND_NAME `
    --global `
    --security-policy=$ARMOR_POLICY_NAME
Write-Host "✅ Cloud Armor activated on the backend." -ForegroundColor Green

# 12. Restrict direct Cloud Run visits (ingress lock)
Write-Host "🔒 Step 12: Restricting direct container ingress (forcing LB routing)..." -ForegroundColor Yellow
gcloud run services update $SERVICE_NAME `
    --region=$REGION `
    --ingress=internal-and-cloud-load-balancing
Write-Host "✅ Direct container access disabled. All public visits must traverse the Load Balancer." -ForegroundColor Green

Write-Host "=========================================================================" -ForegroundColor Green
Write-Host "🎉 GCP SECURITY PROVISIONING COMPLETE!" -ForegroundColor Green
Write-Host "=========================================================================" -ForegroundColor Green
Write-Host "🌐 Your Site IP: $STATIC_IP" -ForegroundColor Cyan
Write-Host "🔒 SSL State: Google-Managed SSL for $DOMAIN_NAME is provisioning." -ForegroundColor Yellow
Write-Host "📝 DNS Configuration Reminder:" -ForegroundColor Yellow
Write-Host "   Type: A"
Write-Host "   Name: financialplanner"
Write-Host "   Value: $STATIC_IP"
Write-Host "-------------------------------------------------------------------------"
Write-Host "Note: It can take 15 to 45 minutes for the Google SSL certificate to turn green after DNS propagation." -ForegroundColor Gray
