# Deployment Guide

## Netlify Deployment

This application is configured for deployment on Netlify. Follow these steps:

### 1. Environment Variables

Set the following environment variables in your Netlify Site Settings:

**Site Settings → Environment Variables:**

- `DATABASE_URL` - Your PostgreSQL connection string (e.g., `postgresql://user:pass@host:5432/ontime`)
- `SESSION_SECRET` - A secure random string (minimum 32 characters)
- `ADMIN_EMAIL` - Initial admin email (e.g., `admin@example.com`)
- `ADMIN_PASSWORD` - Initial admin password (temporary, should be changed after first login)
- `NODE_ENV` - Set to `production`

### 2. Repository Connection

1. Connect your GitHub repository to Netlify
2. Ensure the build command is: `npm run build`
3. Publish directory: `.next`

### 3. Rotating Secrets

Since `.env` was removed from the repository for security:

✅ **DO:**
- Set all secrets in Netlify UI
- Use strong, unique values for `SESSION_SECRET` and `ADMIN_PASSWORD`
- Rotate secrets periodically
- Keep local `.env` file for development (not committed)

❌ **DON'T:**
- Commit `.env` to Git
- Use weak or default secrets
- Share secrets in chat or email

### 4. Database Setup

Before deploying:
1. Ensure your PostgreSQL database is running
2. Set correct `DATABASE_URL` in Netlify
3. Run migrations (if applicable)

### 5. Build Logs

If the build fails:
- Check Netlify build logs for errors
- Ensure all required environment variables are set
- Verify `npm run build` works locally: `npm run build`
- Check that Node version is ≥18

### 6. Testing Locally Before Deploy

```bash
# Create local .env file (never commit this)
cp .env.example .env

# Edit .env with your local values
nano .env

# Build locally
npm run build

# Test the build
npm run start
```

### 7. Post-Deployment

After successful deployment:
1. Test the login page at your Netlify domain
2. Use admin credentials from environment variables
3. Change admin password from admin panel
4. Verify all features work
5. Monitor Netlify Analytics for errors
