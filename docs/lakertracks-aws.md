# LakerTracks — AWS Deployment Reference

## Access

```bash
ssh ubuntu@<server-ip>
```

> If SSH is rejected, your IP changed. Ask the infra lead to run `terraform apply` with your ip address.

---

## App Management

```bash
# Check status
docker compose -f docker-compose.aws.yml ps

# View logs
docker compose -f docker-compose.aws.yml logs -f

# Restart everything
docker compose -f docker-compose.aws.yml down
docker compose -f docker-compose.aws.yml up -d

# Rebuild one service after code change
docker compose -f docker-compose.aws.yml up -d --build frontend
docker compose -f docker-compose.aws.yml up -d --build backend-worklog
docker compose -f docker-compose.aws.yml up -d --build backend-auth

# Pull latest and redeploy
git pull
docker compose -f docker-compose.aws.yml down
docker compose -f docker-compose.aws.yml up -d --build
```

---

## URLs on AWS

| Service | URL |
|---|---|
| Frontend | `https://lakertracks.duckdns.org` |
| Worklog MicroService | `https://lakertracks.duckdns.org/wl/worklog/api` |
| Auth Microservice | `https://lakertracks.duckdns.org/a/auth/api` |

---

## File Structure

```
~/repo/
├── docker-compose.aws.yml
├── Caddyfile
└── .secrets/          # never commit this
    ├── frontend.env
    └── mongodb.env
```

> Refer to [Secrets](https://drive.google.com/drive/folders/18o940HLTQVe0yTq6HfDeKFZzcWMFWRJ9?usp=sharing) folder for credentials

---

## Common Issues

**SSH not working** — IP changed, ask infra lead to update security group.

**Site down** — check logs:
```bash
docker compose -f docker-compose.aws.yml logs -f
```

**Out of memory during build** — build sequentially:
```bash
docker compose -f docker-compose.aws.yml up -d --build --no-deps backend-auth
docker compose -f docker-compose.aws.yml up -d --build --no-deps backend-worklog
docker compose -f docker-compose.aws.yml up -d --build --no-deps frontend
```

**Mixed content error** — frontend env vars must use `https://`, not `http://`.

**Caddy SSL issue** — check `lakertracks.duckdns.org` still points to the correct server IP at duckdns.org.

---

## MongoDB Access

Mongodb is strictly prohibited from external connection

```bash
# Shell access from server
docker exec -it csc480-mongodb-aws-container mongosh
```

---

## Adding a New Microservice

1. Ensure that CORSFilter include the public url
2. update the microconfig proplies to use mongodb
3. Add service to `docker-compose.aws.yml`
4. Add `handle` block in `Caddyfile`
5. Tell infra lead to open new port in AWS security group if needed
6. rebuild from scratch to ensure updates