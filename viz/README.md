# After Dark Viz

Next.js frontend for the CASA0028 After Dark journey comparison prototype.

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Structure

```
├── public/
│   ├── images/
│   │   ├── backgrounds/
│   │   ├── icons/
│   │   └── personas/
│   └── static-data/
├── assets/source/
│   ├── backgrounds/
│   └── personas/
├── src/app/
├── src/components/
└── src/lib/
```

## Checks

```bash
npm run lint
npm run build
```

Static data is read from `public/static-data`. Web-ready images are grouped under `public/images`; editable/source image files live in `assets/source`.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
