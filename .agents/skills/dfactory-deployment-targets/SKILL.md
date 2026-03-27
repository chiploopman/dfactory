# Skill: dfactory-deployment-targets

## Purpose
Maintain production-ready deployment assets across Docker and Kubernetes targets.

## Requirements
1. Docker image must run non-root and expose health/readiness routes.
2. K8s manifests must include Deployment, Service, Ingress, Secret, ConfigMap, and HPA.
3. Helm chart values should expose image, env, service, ingress, and autoscaling controls.
4. Document AKS and EKS-specific operational notes.

## Validation
1. Keep probe paths aligned with `/api/health` and `/api/ready`.
2. Ensure API key secret handling is explicit.
