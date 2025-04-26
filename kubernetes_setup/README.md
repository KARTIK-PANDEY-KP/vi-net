# Multi-User Flask Bot with noVNC Desktop Environment

This project implements a multi-user Flask application with integrated noVNC desktop environments running in Kubernetes. Each user gets their own isolated Flask application instance and noVNC desktop environment.

## Architecture

- 3 separate Flask application instances (user1, user2, user3)
- Each instance runs in its own pod with:
  - Flask application serving on port 5000
  - noVNC desktop environment
- GCP Load Balancer (via Ingress) for routing traffic
- NodePort services for backend connectivity

## Components

### 1. Deployment Configuration (`flask-bot-deployment.yaml`)
- Contains three deployments (user1, user2, user3)
- Each deployment includes:
  - Flask container with user-specific environment variables
  - Volume mounts for TLS certificates
  - Service account for GCP container registry access

### 2. Service Configuration
- Three NodePort services:
  - `flask-bot-user1-service`
  - `flask-bot-user2-service`
  - `flask-bot-user3-service`
- Each service exposes:
  - Port 80 → Container port 5000 (Flask app)

### 3. Ingress Configuration (`ingress.yaml`)
- GCE Ingress controller
- Path-based routing:
  - `/` → User 1's service
  - `/user2` → User 2's service
  - `/user3` → User 3's service

## Implementation Challenges & Solutions

### 1. Service Type Configuration
**Challenge**: Initial ClusterIP services weren't compatible with GCE Ingress
**Solution**: Changed service type to NodePort as GCE Ingress requires either NodePort or LoadBalancer services

### 2. Port Configuration
**Challenge**: Mismatched port configurations between services and pods
**Solution**: 
- Standardized port configuration:
  - Container port: 5000 (Flask)
  - Service port: 80
  - Added explicit protocol (TCP)

### 3. Ingress Configuration
**Challenge**: Multiple issues with Ingress setup:
- Invalid backend service configurations
- Static IP issues
- Path routing problems

**Solutions**:
1. Removed static IP configuration
2. Simplified path routing
3. Used default backend for root path
4. Properly configured service backend ports

### 4. TLS/SSL Configuration
**Challenge**: Needed secure communication
**Solution**: Implemented TLS with:
- Secret: `novnc-tls`
- Mounted certificates in pods
- Configured Ingress for TLS termination

## Access URLs

For each user environment:

### User 1
- Flask App: `http://<ingress-ip>/`
- noVNC Desktop: `http://<ingress-ip>/vnc.html`

### User 2
- Flask App: `http://<ingress-ip>/user2/`
- noVNC Desktop: `http://<ingress-ip>/user2/vnc.html`

### User 3
- Flask App: `http://<ingress-ip>/user3/`
- noVNC Desktop: `http://<ingress-ip>/user3/vnc.html`

## Setup Instructions

1. Apply the deployment configuration:
```bash
kubectl apply -f flask-bot-deployment.yaml
```

2. Apply the Ingress configuration:
```bash
kubectl apply -f ingress.yaml
```

3. Wait for the Ingress to get an IP address (5-10 minutes):
```bash
kubectl get ingress novnc-ingress
```

## Troubleshooting

### 1. Service Issues
Check service status:
```bash
kubectl get services
```

### 2. Pod Issues
Check pod status:
```bash
kubectl get pods
kubectl describe pod <pod-name>
```

### 3. Ingress Issues
Check Ingress status:
```bash
kubectl describe ingress novnc-ingress
```

Common Ingress issues:
- Backend service not ready
- Port configuration mismatches
- TLS certificate issues

## Dependencies

- Kubernetes cluster (GKE)
- kubectl configured for cluster access
- Docker images pushed to GCR
- TLS certificates (in `novnc-tls` secret)

## Environment Variables

Each Flask bot instance uses:
- `USER_ID`: Unique identifier for each instance (user1, user2, user3)

## Security Considerations

1. TLS encryption for all traffic
2. Isolated pod environments
3. Service account authentication for GCR access
4. Proper network policies and security contexts

## Known Limitations

1. Initial Ingress provisioning time (5-10 minutes)
2. Path-based routing limitations
3. Need for manual TLS certificate management 

## 🖥️ Kubernetes Deployment and VNC Access

### 1. Kubernetes Setup

The application is deployed on Google Kubernetes Engine (GKE) with the following components:
- Flask application serving the main API
- noVNC server for remote desktop access
- X11VNC for VNC server functionality
- Nginx for reverse proxying

### 2. Accessing the Services

#### VNC Interface
The VNC interface provides remote desktop access to the application. To access it:

1. Port forward to the service:
```bash
kubectl port-forward service/flask-bot-user1-service 8085:80
```

2. Open in your web browser:
```
http://localhost:8085
```

#### Flask API Endpoints
The Flask application provides two main endpoints:

1. Port forward to the Flask service:
```bash
kubectl port-forward service/flask-bot-user1-service 8086:5000
```

2. Available endpoints:
- Root endpoint: `http://localhost:8086/`
  - Returns: `{"message": "Hello from Flask bot of user user1!"}`
- Health check: `http://localhost:8086/health`
  - Returns: `{"status": "healthy"}`

### 3. Service Configuration

The services are configured with:
- Flask running on port 5000
- noVNC running on port 6081
- Nginx proxying requests to the appropriate service
- TLS/SSL enabled for secure connections

### 4. Troubleshooting

If you encounter connection issues:
1. Check if the pods are running:
```bash
kubectl get pods
```

2. Check pod logs:
```bash
kubectl logs <pod-name>
```

3. Check service configuration:
```bash
kubectl describe service flask-bot-user1-service
```

4. Verify port forwarding:
```bash
kubectl port-forward pod/<pod-name> <local-port>:<container-port>
```

### 5. Replicating the Setup

To replicate this setup:

1. Build and push the Docker image:
```bash
docker build -t gcr.io/<project-id>/flask-bot:latest .
docker push gcr.io/<project-id>/flask-bot:latest
```

2. Apply the Kubernetes manifests:
```bash
kubectl apply -f k8s/
```

3. Verify the deployment:
```bash
kubectl get pods,svc
```

4. Access the services as described above.

## 🛑 Stopping and Restarting Services

### 1. Stopping Services to Reduce Costs

To stop all services and reduce billing:

1. Scale down all deployments to 0 replicas:
```bash
kubectl scale deployment flask-bot-user1 --replicas=0
kubectl scale deployment flask-bot-user2 --replicas=0
kubectl scale deployment flask-bot-user3 --replicas=0
```

2. Stop the GKE cluster nodes (this significantly reduces costs):
```bash
gcloud container clusters resize flask-bot-cluster --num-nodes=0 --zone=us-central1-a
```

This will:
- Stop all running pods
- Stop the GKE cluster nodes
- Preserve all configurations
- Only incur minimal storage costs

### 2. Restarting Services

When you want to restart everything:

1. Resize the GKE cluster back to 1 node:
```bash
gcloud container clusters resize flask-bot-cluster --num-nodes=1 --zone=us-central1-a
```

2. Wait for the cluster to be ready (check status with):
```bash
gcloud container clusters describe flask-bot-cluster --zone=us-central1-a
```

3. Scale the deployments back up:
```bash
kubectl scale deployment flask-bot-user1 --replicas=1
kubectl scale deployment flask-bot-user2 --replicas=1
kubectl scale deployment flask-bot-user3 --replicas=1
```

4. Verify everything is running:
```bash
kubectl get pods
kubectl get services
```

5. Access the services as described in the [Accessing the Services](#2-accessing-the-services) section.
