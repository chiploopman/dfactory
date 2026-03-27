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
- `GET /api/templates/:id/source`
- `POST /api/templates/refresh`
- `POST /api/document/preview`
- `POST /api/document/generate`

## Document request contract

```json
{
  "templateId": "invoice",
  "payload": {
    "invoiceNumber": "INV-1001"
  },
  "mode": "html"
}
```

`mode` supports:

- `html`: returns rendered HTML payload.
- `pdf`: returns `application/pdf` stream.

## Security

If `auth.apiKeys` is configured, requests must include:

- Header: `x-dfactory-key: <api-key>`

An optional auth hook module can enforce additional rules.
