# DFactory API

## Endpoints

- `GET /api/health`
- `GET /api/ready`
- `GET /api/openapi.json`
- `GET /api/docs`
- `GET /api/runtime`
- `GET /api/templates`
- `GET /api/templates/:id`
- `GET /api/templates/:id/schema`
- `GET /api/templates/:id/features`
- `GET /api/templates/:id/source`
- `POST /api/templates/refresh`
- `POST /api/document/preflight`
- `POST /api/document/preview`
- `POST /api/document/generate`

## Document request contract

```json
{
  "templateId": "invoice",
  "payload": {
    "invoiceNumber": "INV-1001"
  },
  "mode": "html",
  "options": {
    "profile": "default",
    "features": {
      "pagination": {
        "mode": "css"
      }
    },
    "pdf": {
      "format": "A4"
    }
  }
}
```

`mode` supports:

- `html`: returns rendered HTML payload.
- `pdf`: returns `application/pdf` stream.

`POST /api/document/preflight` validates payload, applies template + feature pipeline, and returns diagnostics without returning a PDF blob.

## Security

If `auth.apiKeys` is configured, requests must include:

- Header: `x-dfactory-key: <api-key>`

An optional auth hook module can enforce additional rules.
