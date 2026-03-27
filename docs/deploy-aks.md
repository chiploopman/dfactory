# Deploying DFactory to AKS

## Prerequisites

1. Azure subscription with AKS cluster.
2. Ingress controller installed (NGINX or AGIC).
3. Container image pushed to ACR/GHCR.

## Steps

1. Build and push image:
   - `docker build -t <registry>/dfactory:<tag> .`
   - `docker push <registry>/dfactory:<tag>`
2. Update `deploy/helm/dfactory/values.yaml` with image repository/tag and host.
3. Deploy with Helm:
   - `helm upgrade --install dfactory ./deploy/helm/dfactory -n dfactory --create-namespace`
4. Configure DNS to ingress hostname.
5. Validate probes:
   - `/api/health`
   - `/api/ready`

## AKS notes

- Prefer managed identity for pulling from ACR.
- Keep API keys in Azure Key Vault synced to Kubernetes Secret.
- Enable HPA with cluster autoscaler for burst PDF workloads.
