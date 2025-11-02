# CMS Frontend with Code Splitting

A React SSR application with automatic code splitting and SEO optimization, deployed on AWS.

## Prerequisites

- **Node.js** (v18 or higher)
- **pnpm** installed globally (`npm install -g pnpm`)
- **AWS CLI** configured with your credentials

### AWS Configuration

Make sure you have AWS CLI configured with appropriate permissions:

```bash
aws configure
```

You'll need permissions for:
- S3 (create buckets, upload objects)
- Lambda (create functions)
- CloudFront (create distributions)
- IAM (create roles and policies)

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Deploy to AWS

```bash
# Deploy infrastructure (Lambda, S3, CloudFront)
pnpm sst:deploy

# Upload assets to S3 (replace with your bucket name from deploy output)
pnpm upload-assets [your-bucket-name]
```

Example:
```bash
pnpm sst:deploy
# Output shows: BucketName: cms-front-production-cmsbucketbucket-xyz123

pnpm upload-assets cms-front-production-cmsbucketbucket-xyz123
```

### 3. Local Development

```bash
# Run development server
pnpm dev
```

Visit `http://localhost:5173` to see the application.

## Features

- ✅ **Server-Side Rendering (SSR)** - Perfect SEO with real content
- ✅ **Automatic Code Splitting** - Only loads necessary chunks per page
- ✅ **Dynamic Module Discovery** - No manual module registration needed
- ✅ **AWS Deployment** - Lambda + S3 + CloudFront architecture
- ✅ **TypeScript** - Full type safety

## Architecture

- **Lambda Function**: Handles SSR and serves dynamic content
- **S3 Bucket**: Stores static assets and JavaScript chunks
- **CloudFront**: Global CDN for fast asset delivery
- **Vite**: Build tool with automatic code splitting

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm sst:deploy` - Deploy infrastructure to AWS
- `pnpm upload-assets [bucket-name]` - Upload built assets to S3
- `pnpm sst:remove` - Remove all AWS resources

## How It Works

1. **Development**: Run locally with hot reload and instant module loading
2. **Production**: 
   - Server pre-renders content for SEO
   - Client hydrates with lazy-loaded chunks
   - Only downloads modules needed for each page
   - Automatic chunk generation based on dynamic imports

## Adding New Modules

Simply create a new `.tsx` file in `apps/renderer/modules/` with a default export:

```tsx
// apps/renderer/modules/NewModule.tsx
export default function NewModule({ title }: { title: string }) {
  return <div>{title}</div>;
}
```

The module will be automatically discovered and code-split without any configuration!
