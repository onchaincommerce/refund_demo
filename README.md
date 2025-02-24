# OnchainKit Refund Demo

A demo application showcasing refund functionality with Coinbase Commerce and OnchainKit.

## Features

- Coinbase Commerce integration
- USDC payment processing
- Customer refund requests
- Admin refund processing
- On-chain refund transactions

## Environment Variables

```bash
# Coinbase Commerce API Key
COINBASE_COMMERCE_API_KEY=your_api_key

# Base Network RPC URL
RPC_URL=your_base_rpc_url

# Merchant wallet for processing refunds
MERCHANT_PRIVATE_KEY=your_private_key
NEXT_PUBLIC_MERCHANT_ADDRESS=your_public_address
```

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/onchaincommerce/refund_demo.git
cd refund_demo
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with the required environment variables.

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) to view the application.

## Deployment

The application is configured for deployment on Vercel. After pushing to GitHub, you can:

1. Connect your GitHub repository to Vercel
2. Add the required environment variables in Vercel's dashboard
3. Deploy

## Webhook Setup

After deployment, add your Vercel domain to Coinbase Commerce webhook settings:

```
https://your-vercel-domain.com/api/webhook
```

## Learn More

To learn more about OnchainKit, see our [documentation](https://onchainkit.xyz/getting-started).

To learn more about Next.js, see the [Next.js documentation](https://nextjs.org/docs).
