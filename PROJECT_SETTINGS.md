# Project Settings Documentation

**Project**: LangGraph Agent Builder (AIM - Agent Intelligence Manager)  
**Last Updated**: November 22, 2025  
**Purpose**: Document all environment variables and configuration settings to prevent loss during checkpoints/rollbacks

---

## ⚠️ Important: Custom Settings

### User-Configurable Settings (Set via Management UI)

These settings are **NOT stored in git** and must be manually configured in the Management UI after any project restoration:

#### **VITE_APP_TITLE** (Website Name)
- **Current Value**: `LangGraph Agent Builder` (default)
- **Preferred Value**: `AIM - Agent Intelligence Manager` (or user's choice)
- **How to Change**: Management UI → Settings → General → Website Name
- **Note**: This appears in browser tabs, page headers, and login dialogs

#### **VITE_APP_LOGO** (Favicon)
- **Current Value**: Default Manus logo
- **Preferred Value**: (Document custom logo path if uploaded)
- **How to Change**: Management UI → Settings → General → Favicon Upload
- **Note**: For in-app logo, edit `client/src/const.ts` → `APP_LOGO` constant

#### **Custom Domain** (if configured)
- **Current Value**: `xxx.manus.space` (auto-generated)
- **Custom Domain**: (Document if custom domain is bound)
- **How to Change**: Management UI → Settings → Domains

#### **Visibility Settings**
- **Current Value**: (Public/Private - check Management UI → Settings → General)
- **How to Change**: Management UI → Settings → General → Visibility

---

## 🔒 System-Provided Environment Variables

These are **automatically injected** by the Manus platform and should NOT be manually modified:

### Authentication & Security
- `JWT_SECRET` - Session cookie signing secret (auto-generated)
- `OAUTH_SERVER_URL` - Manus OAuth backend base URL
- `VITE_OAUTH_PORTAL_URL` - Manus login portal URL (frontend)
- `OWNER_OPEN_ID` - Project owner's OpenID
- `OWNER_NAME` - Project owner's name
- `VITE_APP_ID` - Manus OAuth application ID

### Database
- `DATABASE_URL` - MySQL/TiDB connection string (auto-configured)

### Built-in APIs
- `BUILT_IN_FORGE_API_URL` - Manus built-in APIs endpoint (server-side)
- `BUILT_IN_FORGE_API_KEY` - Bearer token for built-in APIs (server-side)
- `VITE_FRONTEND_FORGE_API_URL` - Manus built-in APIs endpoint (frontend)
- `VITE_FRONTEND_FORGE_API_KEY` - Bearer token for frontend API access

### Analytics
- `VITE_ANALYTICS_ENDPOINT` - Analytics service endpoint
- `VITE_ANALYTICS_WEBSITE_ID` - Website tracking ID

### LangSmith (if configured)
- `LANGSMITH_API_KEY` - LangSmith API key for tracing
- `LANGSMITH_ENDPOINT` - LangSmith API endpoint
- `LANGSMITH_ORG_ID` - LangSmith organization ID
- `LANGSMITH_PROJECT` - LangSmith project name

---

## 🔑 User-Added Secrets (via Management UI → Settings → Secrets)

Document any custom API keys or secrets you've added:

### Example: External API Keys
- `ANTHROPIC_API_KEY` - (if added) Anthropic Claude API key
- `PERPLEXITY_API_KEY` - (if added) Perplexity API key
- `OPENAI_API_KEY` - (if added) OpenAI API key
- (Add others as needed)

**⚠️ Security Note**: NEVER commit actual secret values to git. Only document the key names here.

---

## 📝 Code-Level Configuration

These are stored in the codebase and ARE included in git:

### App Branding (client/src/const.ts)
```typescript
export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "LangGraph Agent Builder";
export const APP_LOGO = "/logo.svg"; // Change this for in-app logo
```

### Theme Settings (client/src/App.tsx)
```typescript
<ThemeProvider defaultTheme="light"> // or "dark"
```

---

## 🔄 Restoration Checklist

After any project restoration, checkpoint rollback, or sandbox reset:

1. ✅ Check Management UI → Settings → General
   - [ ] Verify/update Website Name (VITE_APP_TITLE)
   - [ ] Verify/update Favicon (if custom)
   - [ ] Verify Visibility settings

2. ✅ Check Management UI → Settings → Secrets
   - [ ] Verify all custom API keys are present
   - [ ] Re-add any missing secrets

3. ✅ Check Management UI → Settings → Domains
   - [ ] Verify custom domain binding (if applicable)

4. ✅ Check Management UI → Dashboard
   - [ ] Verify analytics are working
   - [ ] Check site visibility status

---

## 📚 Additional Documentation

- **README.md** - Project overview and development guide
- **todo.md** - Current tasks and feature tracking
- **server/README.md** - Backend architecture and tRPC procedures
- **client/README.md** - Frontend components and patterns

---

## 🆘 Support

If settings are lost or need to be restored:
1. Check this document for the correct values
2. Update via Management UI (for environment variables)
3. Update code files (for app constants)
4. Restart dev server if needed
