# EPOS GUI

Essential commands and runtime config for local development and Docker deployment.

## Development

| Task                                 | Command           | Notes                                         |
| ------------------------------------ | ----------------- | --------------------------------------------- |
| Install dependencies                 | `npm ci`          | Run once after checkout or dependency updates |
| Start open source development server | `npm run dev-oss` | Local URL: `http://localhost:4200/testpath`   |
| Start internal development server    | `npm run dev`     | Local URL: `http://localhost:4200/testpath`   |
| Open Cypress runner                  | `npm run cypress` | Interactive Cypress launcher                  |

## Quality checks

| Task                            | Command                                                | Notes                              |
| ------------------------------- | ------------------------------------------------------ | ---------------------------------- |
| Run lint                        | `npm run lint`                                         | Runs Angular ESLint rules          |
| Run headless e2e tests          | `npm test`                                             | Runs Cypress in Chrome             |
| Run one Cypress spec (headless) | `npm run test -- --spec "cypress/e2e/your_spec.cy.ts"` | Fast feedback for targeted changes |

## Build

| Task                                        | Command                               | Notes                                                   |
| ------------------------------------------- | ------------------------------------- | ------------------------------------------------------- |
| Create open source build                    | `npm run build-oss`                   | CI uses this build flavor                               |
| Create internal production build            | `npm run build`                       | Internal configuration                                  |
| CI-like build (includes metadata injection) | `./pre-build.sh && npm run build-oss` | Modifies `src/environments/environmentBase.ts` in place |

Build output is written to `dist/`.

## Docker configuration

The container image supports runtime configuration via environment variables.

| Variable      | Default                   | Description                                                                           |
| ------------- | ------------------------- | ------------------------------------------------------------------------------------- |
| `BASE_URL`    | `/`                       | Base path where the app is served. Must start and end with `/` (for example `/gui/`). |
| `API_HOST`    | `http://gateway:5000/api` | Upstream API URL used by nginx for `/api` requests.                                   |
| `SERVER_NAME` | `_`                       | nginx `server_name` value.                                                            |

Example:

```bash
docker run --rm -p 8080:80 \
  -e BASE_URL=/gui/ \
  -e API_HOST=https://api.example.org/ \
  -e SERVER_NAME=_ \
  epos-gui:latest
```
