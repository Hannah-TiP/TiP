This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### 1. Configure Environment Variables

Create or update `.env.local` file in the project root with the following:

```bash
# Google Maps API Key (required for interactive map on Dream Hotels page)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here

# API Configuration
API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_API_BASE_URL=/api

# S3 Image Configuration
NEXT_PUBLIC_S3_ENDPOINT=https://tip-s3-bucket.s3.us-west-1.amazonaws.com
```

**To get a Google Maps API Key:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Maps JavaScript API**
4. Go to **Credentials** and create an API key
5. (Optional) Restrict the API key to your domain for security
6. Copy the API key and add it to `.env.local`

### 2. Run the Development Server

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
