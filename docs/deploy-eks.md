# Deploying DFactory to EKS

## Prerequisites

1. EKS cluster with AWS Load Balancer Controller.
2. IAM role for service account configured if pulling private images.
3. Container image in ECR/GHCR.

## Steps

1. Build and push image:
   - `docker build -t <registry>/dfactory:<tag> .`
   - `docker push <registry>/dfactory:<tag>`
2. Update Helm values in `deploy/helm/dfactory/values.yaml`.
3. Deploy:
   - `helm upgrade --install dfactory ./deploy/helm/dfactory -n dfactory --create-namespace`
4. Configure Route53 record to ingress endpoint.
5. Validate readiness and liveness endpoints.

## EKS notes

- Add ALB ingress annotations as needed for internal/public routing.
- Store API keys in AWS Secrets Manager and sync with External Secrets.
- Keep autoscaling enabled for CPU-intensive rendering peaks.
