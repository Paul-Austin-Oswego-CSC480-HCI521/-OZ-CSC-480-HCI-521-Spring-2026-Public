# Contributing to the Project

## Setting Up the Project

1. Clone the repository and navigate into it:
   ```bash
   git clone https://github.com/Paul-Austin-Oswego-CSC480-HCI521/-OZ-CSC-480-HCI-521-Spring-2026-Public
   cd ./-OZ-CSC-480-HCI-521-Spring-2026-Public
   ```

2. Install dependencies for both frontend and backend:
   ```bash
   make setup
   ```

3. Run the project:
   ```bash
   make dev-frontend   # frontend only (localhost:3000)
   make dev-backend    # backend only (localhost:9080)
   make dev            # both
   ```

> For more details about these available commands, refer to the `Makefile`.

---

## Checking Out Version Releases

During weekly sprints, the full stack team will tag a release when ready.

```bash
make checkout-latest        # latest release
make checkout version=v0.0.1  # specific version
```

After testing, return to main:
```bash
git checkout main
```

> After testing, discard any local changes and return to main:
> ```bash
> git restore .
> git checkout main
> ```

Then follow the [Setting Up the Project](#setting-up-the-project) steps to run locally.

---

## Writing/Running Tests

From the `backend/finish` directory:
```bash
./mvnw test      # unit tests only
./mvnw verify    # unit + integration tests
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

3. Run `make setup` as needed if dependencies have changed.

---

## Notes for Developers

- The `Makefile` is a convenience tool. Feel free to run the commands inside it manually or add new targets that benefit the team.
- GitHub Actions workflows may need to be updated as the folder structure or system-level configurations change.