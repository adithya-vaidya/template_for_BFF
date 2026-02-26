# BFF Template Package

This repository contains a reusable Backend-for-Frontend (BFF) template and a small AppSync-like DataSource plugin architecture.

Quick start

1. Install dependencies

```bash
npm install
```

2. Run example server

```bash
npm run start
```

3. Call the example APIs

- Health: `GET /health`
- List datasources: `GET /api/datasources`
- Call datasource: `POST /api/datasources/call`

Embedding as a package

Import the package API in your project:

```js
import { createApp, dataSourceManager } from 'template_for_bff';

const app = createApp();
app.listen(3000);
```

Note: When published to npm, change the package name and import path appropriately.
