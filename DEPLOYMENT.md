# Deployment

- **Live app:** https://ornate-horse-41c50e.netlify.app/
- **API health:** https://ornate-horse-41c50e.netlify.app/api/health

The frontend is deployed on Netlify. The Express API runs on Render and is
available to the frontend through the `/api/*` proxy configured in
[`netlify.toml`](./netlify.toml). Netlify automatically deploys updates pushed
to the `main` branch.
