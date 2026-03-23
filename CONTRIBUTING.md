# Contributing to the Project

## Cloning the project

Clone the repository and navigate into it:

   ```bash
   git clone https://github.com/Paul-Austin-Oswego-CSC480-HCI521/-OZ-CSC-480-HCI-521-Spring-2026-Public
   cd ./-OZ-CSC-480-HCI-521-Spring-2026-Public
   ```
   **Mac/Linux**

   ```bash
      make check-deps # Check if you have all dependencies installed.
   ```

## Prerequisites

Make sure you have the following installed before getting started:

- [Git](https://git-scm.com/)
- [Node.js / npm](https://nodejs.org/)
- [Java 21+](https://adoptium.net/)
- [Docker](https://www.docker.com/products/docker-desktop)
- Maven (or use the included `mvnw` wrapper — no install needed)

> Windows Command Prompt and PowerShell use different commands that this project does not support. See [Windows](#windows) for instructions.


## Installation

Check environment variables in `config/env-dev.json`

Install dependencies and run the project:

**Mac/Linux**

```bash
   make clean # Remove existing system residue that might conflict with this project
   make setup # Setup environment variables and install required dependencies for frontend, backend and mongodb
```

Then start the project:

Open three separate terminals:

```bash
   make dev-mongodb    # Spinning up mongodb database container
   make dev-frontend   # Terminal 1 — Frontend
   make dev-backend    # Terminal 2 — Backend
```
 > You can run `make dev` for running all project in one go. Not recommended for development

## Endpoints

Frontend
- [http://localhost:3000](http://localhost:3000)

Backend
- notification backend [http://localhost:9080](http://localhost:9080)
- worklog backend - [http://localhost:9081](http://localhost:9081)
- task backend - [http://localhost:9082](http://localhost:9082)

Backend documentation 
- notification backend doc - [http://localhost:9080/openapi/ui](http://localhost:9080/openapi/ui)
- worklog backend doc - [http://localhost:9081/openapi/ui](http://localhost:9081/openapi/ui)
- task backend doc - [http://localhost:9082/openapi/ui](http://localhost:9082/openapi/ui)

---

## Running Docker Compose Locally (Replication of Production Setup)

Ensure `config/env-docker-compose.json` exists

To run docker compose
``` bash
   make run-docker-compose
```
> Note: check `docker ps` for port numbers as this is different from development

To stop docker compose
``` bash
   make stop-docker-compose
```

---
## Running Version Releases

During weekly sprints, the full stack team will tag a release when ready.

1. Download the desired releases by going to [Link](https://github.com/Paul-Austin-Oswego-CSC480-HCI521/-OZ-CSC-480-HCI-521-Spring-2026-Public/releases)

2. Open the folder in your code editor

Then follow the [Installation](#installation).

---

## Writing/Running Tests

From the `backend/<microservice>` directory:

**Mac/Linux**

```bash
cd ./backend/<microservice>
./mvnw test      # unit tests only
./mvnw verify    # unit + integration tests
```

**Windows**

```bash
cd ./backend/<microservice>
.\mvnw.cmd test      # unit tests only
.\mvnw.cmd verify    # unit + integration tests
```

**Unit tests** are named `*Test.java`.  
**Integration tests** are named `*IT.java`.


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

3. Run `make clean && make setup` as needed if dependencies have changed.

---

## Troubleshooting Tips
   > Feel free to update this if you have troubleshooting tips

1. **Port 9080 (or) 3000 already in use / updates are not reflected**
   
   A previous Liberty process may still be running in the background. Kill it:
```bash
   # For linux/mac
   kill -9 $(lsof -t -i :9080)
   kill -9 $(lsof -t -i :9081)
   kill -9 $(lsof -t -i :9082)
   kill -9 $(lsof -t -i :3000)
   # For windows
   for /f "tokens=5" %a in ('netstat -ano ^| findstr :9080') do taskkill /F /PID %a
   for /f "tokens=5" %a in ('netstat -ano ^| findstr :9081') do taskkill /F /PID %a
   for /f "tokens=5" %a in ('netstat -ano ^| findstr :9082') do taskkill /F /PID %a
   for /f "tokens=5" %a in ('netstat -ano ^| findstr :3000') do taskkill /F /PID %a
```

## Windows

`make` is not available by default on Windows. Choose one of the following options to enable it:


**Option 1: Use Git Bash**

Git for Windows ships with `make`. Open **Git Bash** and run `make` commands from there instead of Command Prompt or PowerShell.

**Option 2: Install via Chocolatey**

```powershell
choco install make
```
**Option 3: Use WSL (Windows Subsystem for Linux)**

```powershell
wsl --install
```

Then open a WSL terminal and follow the Mac/Linux instructions.

You can now setup the project [Cloning the project](#cloning-the-project)

## Notes for Developers

- The `Makefile` is a convenience tool. Feel free to run the commands inside it manually or add new targets that benefit the team.
- GitHub Actions workflows may need to be updated as the folder structure or system-level configurations change.
- Please let the team know if you have any issues setting up
