# [Backstage](https://backstage.io)

This is your newly scaffolded Backstage App, Good Luck!
```
Prerequisites

Kubernetes cluster
```

```sh
kubectl create ns backstage
kubectl apply -f https://raw.githubusercontent.com/jhivandb/choreo-backstage-sample/main/backstage.yaml
kubectl port-forward --namespace=backstage svc/backstage 7007:80
```
