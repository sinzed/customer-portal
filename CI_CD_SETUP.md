# CI/CD Setup Guide

This project uses GitHub Actions for CI/CD. Images are built in GitHub Actions and pushed to GitHub Container Registry (GHCR). The production server only pulls and deploys images.

## Architecture

```
┌─────────────────┐
│  GitHub Actions │
│                 │
│  1. Build       │
│  2. Test        │
│  3. Tag         │
│  4. Push to     │
│     GHCR        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  GHCR Registry  │
│  (Image Store)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Production      │
│ Server          │
│                 │
│  1. Pull image  │
│  2. Deploy      │
│     stack       │
└─────────────────┘
```

## GitHub Actions Workflow

The workflow (`.github/workflows/deploy.yml`) does:

1. **Build Job** (`build-and-push`):
   - Builds backend Docker image
   - Builds frontend Docker image (with production API URL)
   - Tags images with:
     - `latest` (for main/master branch)
     - Branch name
     - Commit SHA
     - Semantic version (if tags are used)
   - Pushes to GitHub Container Registry (GHCR)

2. **Deploy Job** (`deploy`):
   - Only runs on `main` or `master` branch
   - Pulls latest images from registry
   - Deploys Docker Swarm stack
   - Shows service status

## Setup Instructions

### 1. Configure GitHub Secrets

Go to your repository → Settings → Secrets and variables → Actions

Add these secrets:

- `PROD_SERVER_HOST`: `89.167.0.194` (or `server.powerme.space`)
- `PROD_SERVER_USER`: `root`
- `PROD_SERVER_SSH_KEY`: Your SSH private key for server access

**Note**: `GITHUB_TOKEN` is automatically provided by GitHub Actions, no need to add it.

### 2. Update Repository Path

Update `docker-compose.prod.yml` with your actual GitHub repository:

```yaml
image: ghcr.io/your-org/customer-portal/backend:latest
```

Replace `your-org/customer-portal` with your actual repository path (e.g., `octopus-energy/customer-portal`).

Or set it via environment variable:
```bash
export GITHUB_REPOSITORY=your-org/customer-portal
```

### 3. Configure Server

On the production server, set up GitHub Container Registry authentication:

```bash
# Login to GHCR (one-time)
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin

# Or use a Personal Access Token (PAT)
echo $PAT_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin
```

**Create GitHub Personal Access Token**:
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `read:packages` scope
3. Use this token for server authentication

### 4. Set Environment Variables on Server

```bash
# On production server
export GITHUB_REPOSITORY=your-org/customer-portal
export GITHUB_USERNAME=your-username
export GITHUB_TOKEN=your-pat-token
```

Or add to `/etc/environment` or `~/.bashrc` for persistence.

### 5. Initial Deployment

#### Option A: Via GitHub Actions (Automatic)

1. Push to `main` branch:
   ```bash
   git push origin main
   ```

2. GitHub Actions will:
   - Build images
   - Push to GHCR
   - Deploy to production

#### Option B: Manual Deployment

```bash
# Copy files to server
rsync -avz --exclude 'node_modules' --exclude '.git' \
  ./ root@server.powerme.space:/opt/customer-portal/

# On server
ssh root@server.powerme.space
cd /opt/customer-portal
export GITHUB_REPOSITORY=your-org/customer-portal
./quick-deploy.sh
```

## Image Tags

Images are tagged with multiple tags for flexibility:

- `latest` - Always points to latest main/master branch build
- `main-<sha>` - Specific commit on main branch
- `v1.2.3` - Semantic version (if you tag releases)
- `v1.2` - Major.minor version

## Workflow Triggers

The workflow runs on:
- Push to `main` or `master` branch
- Manual trigger (workflow_dispatch)

## Deployment Process

1. **Developer pushes code**:
   ```bash
   git push origin main
   ```

2. **GitHub Actions builds**:
   - Builds Docker images
   - Runs tests (if added)
   - Tags images
   - Pushes to GHCR

3. **GitHub Actions deploys** (only on main/master):
   - SSH to production server
   - Pulls latest images
   - Updates Docker Swarm stack
   - Shows status

## Manual Deployment

If you need to deploy manually:

```bash
# On production server
cd /opt/customer-portal
export GITHUB_REPOSITORY=your-org/customer-portal

# Pull latest images
docker pull ghcr.io/your-org/customer-portal/backend:latest
docker pull ghcr.io/your-org/customer-portal/frontend:latest

# Deploy stack
docker stack deploy -c docker-compose.prod.yml customer-portal
```

## Rollback

To rollback to a previous version:

```bash
# Find previous image tag
docker images | grep backend

# Update docker-compose.prod.yml with specific tag
# Or pull specific tag
docker pull ghcr.io/your-org/customer-portal/backend:main-abc123

# Update stack
docker stack deploy -c docker-compose.prod.yml customer-portal
```

## Monitoring

### View GitHub Actions Runs

Go to: Repository → Actions tab

### View Deployment Logs

On server:
```bash
docker service logs customer-portal_backend
docker service logs customer-portal_frontend
```

### Check Image Pulls

```bash
docker images | grep customer-portal
```

## Troubleshooting

### Images Not Found

1. Check repository path in `docker-compose.prod.yml`
2. Verify images exist in GHCR: `https://github.com/your-org/customer-portal/pkgs/container/backend`
3. Check authentication: `docker login ghcr.io`

### Deployment Fails

1. Check GitHub Actions logs
2. Verify SSH key is correct
3. Check server logs: `docker service logs customer-portal_backend`

### Authentication Issues

```bash
# Re-authenticate
docker logout ghcr.io
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin
```

## Security Best Practices

1. **SSH Keys**: Use dedicated deployment key, not personal SSH key
2. **GitHub Token**: Use fine-grained PAT with minimal permissions
3. **Secrets**: Never commit secrets to repository
4. **Image Scanning**: Enable Dependabot for security updates
5. **Access Control**: Restrict GHCR package access

## Adding Tests

To add tests to the CI pipeline, add a test job:

```yaml
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Run backend tests
      run: |
        cd backend
        pip install -r requirements.txt
        pytest
```

## Customization

### Use Different Registry

Update `.github/workflows/deploy.yml`:
```yaml
env:
  REGISTRY: docker.io  # Docker Hub
  # or
  REGISTRY: registry.example.com  # Private registry
```

### Deploy to Staging

Add staging deployment job:
```yaml
deploy-staging:
  if: github.ref == 'refs/heads/develop'
  # ... staging deployment steps
```

## Next Steps

1. ✅ Set up GitHub secrets
2. ✅ Configure server authentication
3. ✅ Update repository path
4. ✅ Push to main branch
5. ✅ Monitor deployment

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)
