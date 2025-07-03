# Deployment Security Checklist

## Before Going Public

### ✅ API Keys and Secrets
- [ ] Remove all API keys from code
- [ ] Create new API credentials for production
- [ ] Set up environment variables in deployment platform
- [ ] Add HTTP referrer restrictions in Google Cloud Console
- [ ] Limit API key to necessary APIs only

### ✅ Google Cloud Console Setup
- [ ] Enable only required APIs:
  - [ ] Google Calendar API
  - [ ] Google People API
  - [ ] Google Identity Toolkit API
- [ ] Configure OAuth consent screen
- [ ] Add only production domains to authorized origins
- [ ] Set appropriate scopes (minimal required)

### ✅ Code Security
- [ ] Remove all console.log statements (automated via build)
- [ ] Verify no sensitive data in error messages
- [ ] Check for hardcoded URLs or endpoints
- [ ] Ensure proper input validation

### ✅ Build Configuration
- [ ] Production build removes console statements
- [ ] Environment variables are properly configured
- [ ] Base URL is correctly set for deployment

### ✅ Repository Setup
- [ ] .env file is in .gitignore
- [ ] No sensitive data in commit history
- [ ] SECURITY.md is present
- [ ] README.md includes security notes

### ✅ Deployment Platform
- [ ] HTTPS is enforced
- [ ] Security headers are configured
- [ ] Environment variables are securely stored
- [ ] Domain is properly configured

## Post-Deployment

### ✅ Monitoring
- [ ] Set up Google Cloud Console alerts
- [ ] Monitor API usage and quotas
- [ ] Check for unusual activity
- [ ] Review access logs regularly

### ✅ Maintenance
- [ ] Schedule regular dependency updates
- [ ] Run `yarn audit` before each deployment
- [ ] Review and rotate API keys periodically
- [ ] Update security documentation as needed

## Emergency Response

If a security issue is discovered:

1. Immediately revoke compromised credentials
2. Generate new credentials
3. Update deployment with new credentials
4. Review logs for any unauthorized access
5. Notify users if necessary
6. Document the incident and response