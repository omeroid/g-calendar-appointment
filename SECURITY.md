# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability within this project, please follow these steps:

1. **DO NOT** create a public issue
2. Send a description of the vulnerability to [your-email@example.com]
3. Include steps to reproduce the issue
4. Allow up to 48 hours for an initial response

## Security Best Practices

When deploying this application:

### 1. OAuth Protection
- Never commit client IDs to the repository
- Use environment variables for all sensitive data
- Configure OAuth in Google Cloud Console:
  - Only add production domains to authorized origins
  - Use minimal required scopes

### 2. OAuth Configuration
- Only add production domains to authorized origins
- Use minimal required scopes
- Regularly review and rotate credentials

### 3. Data Protection
- All data is processed client-side
- No user data is stored on servers
- Template data is stored only in browser localStorage
- Use HTTPS in production

### 4. Dependencies
- Regularly run `yarn audit`
- Keep dependencies updated
- Review security advisories

## Known Security Considerations

1. **Token Storage**: Access tokens are stored in localStorage. Consider the XSS risk.
2. **Client-Side Processing**: All calendar operations happen client-side
3. **Template Storage**: Meeting templates are stored in browser localStorage
4. **No API Keys**: This application uses OAuth 2.0 authentication only, no API keys are required

## Recommended Headers

Add these security headers to your deployment:

```
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
```

## Contact

For security concerns, please contact: [your-email@example.com]