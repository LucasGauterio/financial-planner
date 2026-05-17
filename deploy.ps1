# GCP Cloud Run Deployment Script for FinancialPlanner
# Powered by Antigravity

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "              🚀 FINANCIAL PLANNER GCP DEPLOYMENT PIPELINE            " -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

try {
    # ---------------------------------------------------------
    # STEP 1: Generate & Push Docker Image via Cloud Build
    # ---------------------------------------------------------
    Write-Host "[*] Step 1: Submitting build to Google Cloud Build..." -ForegroundColor White
    Write-Host "    Building image gcr.io/financialplanner-495622/financial-planner:latest..." -ForegroundColor Gray
    
    gcloud builds submit --tag gcr.io/financialplanner-495622/financial-planner:latest .
    
    Write-Host "[OK] Step 1 Complete: Docker image built and pushed successfully." -ForegroundColor Green
    Write-Host ""

    # ---------------------------------------------------------
    # STEP 2: Validate Image Vulnerabilities
    # ---------------------------------------------------------
    Write-Host "[*] Step 2: Validating image vulnerabilities..." -ForegroundColor White
    
    # Temporarily allow errors for the check to handle permissions/API limits gracefully
    $oldPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    
    $vulnerabilityResult = gcloud beta container images describe gcr.io/financialplanner-495622/financial-planner:latest --show-package-vulnerability 2>&1
    $exitCode = $LASTEXITCODE
    
    $ErrorActionPreference = $oldPreference

    if ($exitCode -ne 0) {
        if ($vulnerabilityResult -match "Permission 'containeranalysis.occurrences.list' denied") {
            Write-Host "    ⚠️  Vulnerability check skipped: Active GCP account lacks 'containeranalysis.occurrences.list' IAM permissions." -ForegroundColor Yellow
            Write-Host "       (To enable this check, grant your account the 'Container Analysis Occurrences Viewer' role)." -ForegroundColor Gray
        } else {
            Write-Host "    ⚠️  Vulnerability scan returned an error: $vulnerabilityResult" -ForegroundColor Yellow
        }
    } else {
        Write-Host "    [OK] Vulnerability scan results retrieved successfully:" -ForegroundColor Green
        Write-Host "    $vulnerabilityResult" -ForegroundColor Gray
    }
    Write-Host ""

    # ---------------------------------------------------------
    # STEP 3: Deploy to Google Cloud Run
    # ---------------------------------------------------------
    Write-Host "[*] Step 3: Deploying container to Google Cloud Run..." -ForegroundColor White
    
    gcloud run deploy financial-planner `
      --image gcr.io/financialplanner-495622/financial-planner:latest `
      --platform managed `
      --region us-east1 `
      --allow-unauthenticated `
      --port 8080 `
      --min-instances 0 `
      --max-instances 2
      
    Write-Host ""
    Write-Host "=====================================================================" -ForegroundColor Green
    Write-Host "  🎉 SUCCESS: FinancialPlanner has been deployed successfully to GCP!  " -ForegroundColor Green
    Write-Host "  URL: https://financialplanner.lgauterio.com.br" -ForegroundColor Green
    Write-Host "=====================================================================" -ForegroundColor Green
    Write-Host ""

} catch {
    Write-Host ""
    Write-Host "❌ DEPLOYMENT FAILED: $_" -ForegroundColor Red
    Write-Host ""
    exit 1
}
