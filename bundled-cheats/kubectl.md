---
title: Kubernetes (kubectl)
tags: [kubernetes, kubectl, k8s, devops]
---

## Cluster Info

```bash
kubectl cluster-info
kubectl version --client
kubectl get nodes -o wide
kubectl config current-context
kubectl config get-contexts
kubectl config use-context <name>
```

## Pods

```bash
kubectl get pods
kubectl get pods -n <namespace> -o wide
kubectl describe pod <name>
kubectl delete pod <name>
kubectl run debug --image=busybox --rm -it --restart=Never -- sh
kubectl exec -it <pod> -- bash
kubectl cp <pod>:/path ./local-path
```

## Deployments

```bash
kubectl get deployments
kubectl rollout status deployment/<name>
kubectl rollout history deployment/<name>
kubectl rollout undo deployment/<name>
kubectl scale deployment/<name> --replicas=3
kubectl set image deployment/<name> <container>=<image>:<tag>
```

## Services

```bash
kubectl get svc
kubectl expose deployment <name> --port=80 --target-port=8080
kubectl port-forward svc/<name> 8080:80
kubectl get endpoints
```

## Config & Secrets

```bash
kubectl get configmaps
kubectl get secrets
kubectl create configmap mycfg --from-literal=key=value
kubectl create secret generic mysec --from-literal=password=...
kubectl describe secret <name>
```

## Logs & Debug

```bash
kubectl logs <pod>
kubectl logs -f deployment/<name>
kubectl logs <pod> -c <container>
kubectl logs <pod> --previous       # crashed container
kubectl debug <pod> -it --image=busybox
kubectl get events --sort-by='.lastTimestamp'
```

## Namespaces

```bash
kubectl get namespaces
kubectl create namespace <name>
kubectl get all -n <namespace>
kubectl config set-context --current --namespace=<ns>
```

## Apply & Delete

```bash
kubectl apply -f manifest.yaml
kubectl apply -k overlays/prod/     # kustomize
kubectl delete -f manifest.yaml
kubectl delete pod <name> --grace-period=0 --force   # last resort
```
