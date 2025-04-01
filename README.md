
```sh

# With Quickstart Guide Devcontainer

docker run --rm -it --name choreo-quick-idp \
-v /var/run/docker.sock:/var/run/docker.sock \
-v choreo-state:/state \
-v tf-state:/app/terraform \
--network bridge \
-p 8443:8443 \
-p 8000:8000 \
ghcr.io/choreo-idp/quick-start:v0.1.0

# Create TCP forwarder inside dev container
socat TCP-LISTEN:8000,fork TCP:localhost:7007 &

kubectl create ns backstage
kubectl apply -f https://raw.githubusercontent.com/jhivandb/choreo-backstage-sample/main/backstage.yaml
kubectl port-forward --namespace=backstage svc/backstage 7007:80

# Backstage will be exposed on port 8000

```


```sh

# With kind installed locally

kubectl create ns backstage
kubectl apply -f https://raw.githubusercontent.com/jhivandb/choreo-backstage-sample/main/backstage.yaml
kubectl port-forward --namespace=backstage svc/backstage 7007:80

# Backstage will be exposed on port 7007

```
