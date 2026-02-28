# Contributing to the Project

## Prerequisites

Make sure you have the following installed before getting started:

- [Git](https://git-scm.com/)
- [Node.js / npm](https://nodejs.org/)
- [Java 21+](https://adoptium.net/)
- [Docker](https://www.docker.com/products/docker-desktop)
- Maven (or use the included `mvnw` wrapper — no install needed)

## Setting Up the Project

1. Clone the repository and navigate into it:

   ```bash
   git clone https://github.com/Paul-Austin-Oswego-CSC480-HCI521/-OZ-CSC-480-HCI-521-Spring-2026-Public
   cd ./-OZ-CSC-480-HCI-521-Spring-2026-Public
   ```

2. Install dependencies and run the project:
   > **Note:** Before running any `make` commands, it is recommended to read through the `Makefile` at the root of the project so you understand what each command does.

**Mac/Linux**

```bash
   make setup
```

Then start the project:

Open three separate terminals:

```bash
   make dev-mongodb    # Spinning up mongodb database container
   make dev-frontend   # Terminal 1 — Frontend (3000)
   make dev-backend    # Terminal 2 — Backend (9080)
```

or

```bash
   make dev   # frontend + backend + database in one go
```

**Windows**

Setup Mongodb Container

```bash
   docker rm -f csc480-mongodb-container
   cd backend && docker build -t csc480-mongodb -f assets/Dockerfile .
   docker run --name csc480-mongodb-container -p 27017:27017 -d csc480-mongodb
   timeout /t 5
   docker cp csc480-mongodb-container:/home/mongodb/certs/truststore.p12 ./backend/finish/src/main/liberty/config/resources/security
   docker cp csc480-mongodb-container:/home/mongodb/certs/truststore.p12 ./backend/worklog/src/main/liberty/config/resources/security
   docker start csc480-mongodb-container
```

Open two separate terminals:

Terminal 1 — Frontend:

```bash
   cd ./frontend
   npm install
   npm run dev
```

Terminal 2 — Backend:

```bash
   cd ./backend/finish
   .\mvnw.cmd liberty:dev
```

> For more details about these available commands, refer to the `Makefile`.

---

## Checking Out Version Releases

During weekly sprints, the full stack team will tag a release when ready.

For retrieving the latest release version

```bash
git fetch --tags && git checkout $(git describe --tags --abbrev=0)
```

For retrieving a specific version

```bash
git fetch --tags && git checkout <version_number>  # Example git checkout v0.0.1
```

After testing, return to main:

> After testing, discard any local changes and return to main:
>
> ```bash
> git restore .
> git checkout main
> ```

Then follow the [Setting Up the Project](#setting-up-the-project) steps to run locally.

---

## Writing/Running Tests

From the `backend/finish` directory:

**Mac/Linux**

```bash
cd ./backend/finish
./mvnw test      # unit tests only
./mvnw verify    # unit + integration tests
```

**Windows**

```bash
cd ./backend/finish
.\mvnw.cmd test      # unit tests only
.\mvnw.cmd verify    # unit + integration tests
```

**Unit tests** are named `*Test.java`.  
**Integration tests** are named `*IT.java`.

---
## Backend

Check out the OpenAPI UI to explore and test the backend endpoints:
http://localhost:9080/openapi/ui/

---

## Issues and Pull Requests

We have templates for creating issues and pull requests — please use them.

When opening a pull request, include a concise description of the feature or fix being added for reviewers.

**To run a pull request locally:**

1. Ensure you are on main and up to date:

   ```bash
   git checkout main
   git pull
   ```

2. Fetch and checkout the PR branch:

   ```bash
   git fetch origin
   git checkout <branch-name>
   ```

   > The branch name can be found on the GitHub PR page.

3. Run `make setup` as needed if dependencies have changed.

---

## Troubleshooting Tips
   > Feel free to update this if you have troubleshooting tips

1. **Port 9080(or)3000 already in use / updates are not reflected**
   
   A previous Liberty process may still be running in the background. Kill it:
```bash
   kill -9 $(lsof -t -i :9080)
   kill -9 $(lsof -t -i :3000)
```


## Notes for Developers

- The `Makefile` is a convenience tool. Feel free to run the commands inside it manually or add new targets that benefit the team.
- GitHub Actions workflows may need to be updated as the folder structure or system-level configurations change.
- Please let the team know if you have any issues setting up
