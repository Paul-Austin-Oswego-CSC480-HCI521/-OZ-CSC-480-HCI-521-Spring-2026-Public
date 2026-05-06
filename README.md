# -OZ-CSC-480-HCI-521-Spring-2026-Public

# Laker Logs

<div align="center">
  <img width="198" height="193" alt="image (10)" src="https://github.com/user-attachments/assets/aa48d3c4-3bbc-47b5-97fe-0d4455c303bc" />
</div>
<br/>

<div align="center">
  <strong>🌐 Live at: <a href="https://lakerlogs.duckdns.org">lakerlogs.duckdns.org</a></strong>
</div>
<br/>

**Laker Logs** is a web-based weekly work log system built exclusively for the **Software Design course (CSC480 / HCI 521)** at the **State University of New York (SUNY) at Oswego**. It standardizes how students document and submit their weekly progress, and gives instructors a clear, organized way to review those submissions.

---

## Table of Contents

- [-OZ-CSC-480-HCI-521-Spring-2026-Public](#-oz-csc-480-hci-521-spring-2026-public)
- [Laker Logs](#laker-logs)
  - [Table of Contents](#table-of-contents)
  - [What is Laker Logs?](#what-is-laker-logs)
  - [Who is it for?](#who-is-it-for)
  - [How to Access?](#how-to-access)
  - [Getting Started](#getting-started)
    - [Step 1 — Log In with Your Oswego Email](#step-1--log-in-with-your-oswego-email)
  - [For Students](#for-students)
    - [Your Dashboard](#your-dashboard)
    - [Creating a Weekly Work Log](#creating-a-weekly-work-log)
    - [Submitting Your Work Log](#submitting-your-work-log)
    - [Viewing Past Work Logs](#viewing-past-work-logs)
  - [For Instructors](#for-instructors)
    - [Your Dashboard](#your-dashboard-1)
    - [Setting Up a Class](#setting-up-a-class)
    - [Reviewing Student Work Logs](#reviewing-student-work-logs)
    - [Managing Student Accounts](#managing-student-accounts)
    - [Managing/Archiving Class](#managingarchiving-class)
  - [Notifications \& Reminders](#notifications--reminders)
  - [Data \& Privacy](#data--privacy)
  - [Supported Browsers](#supported-browsers)
  - [Known Limitations](#known-limitations)
  - [Glossary](#glossary)
  - [Architecture](#architecture)
    - [System Overview](#system-overview)
    - [Tech Stack](#tech-stack)
    - [Deployment](#deployment)
  - [Contributing](#contributing)
  - [License](#license)

---

## What is Laker Logs?

Before Laker Logs, students in the Software Design course submitted weekly work logs in inconsistent formats making it difficult for instructors to fairly review and evaluate them.

**Laker Logs fixes that.** It gives every student the same structured template to fill out each week, tracks deadlines automatically, displays recent actions, deadlines, and keeps a full history of all submissions. Instructors get an organized dashboard where they can filter, review, and evaluate every student's logs with ease.

---

## Who is it for?

Laker Logs has two types of users:

| User Type      | Role                                                      |
| -------------- | --------------------------------------------------------- |
| **Student**    | Fills out and submits weekly work logs                    |
| **Instructor** | Creates classes, manages rosters, and reviews submissions |

> Laker Logs is **only** for students and instructors enrolled in CSC480 / HCI 521 at SUNY Oswego. It is not available for other courses or institutions.

---

## How to Access?

Laker Logs is a **web application** — no installation needed! Simply open it in your web browser on a desktop or laptop computer.

**Supported browsers:**

- Google Chrome
- Mozilla Firefox
- Apple Safari

> Laker Logs is designed for desktop and laptop use. Mobile devices are not officially supported.

---

## Getting Started

### Step 1 — Log In with Your Oswego Email

Laker Logs uses your **SUNY Oswego institutional email** to log you in. No separate password is needed.

1. Open Laker Logs in your browser.
2. Click **Sign In**.
3. Enter your Oswego email credentials.
4. You'll be automatically directed to your dashboard based on your role (Student or Instructor).

> Your role (Student or Instructor) is detected automatically from your credentials.

---

## For Students

### Your Dashboard

Once logged in, your home page shows:

- Your **current weekly work log status** (Start, continue, review work log)
- Any **upcoming deadlines**
- Any **recent actions or reminders**

> You will only appear on the dashboard once an Instructor has added you to a class roster.

---

### Creating a Weekly Work Log

On the weekly work log page, you can track the status of your work logs. Each week's widget includes:

- **Week Number**
- **Due Date**
- **Submission Status**

Clicking on the widget will take you to the work log of the corresponding week. Each **Work log** includes:

| Field             | What to fill in                                    |
| ----------------- | -------------------------------------------------- |
| Task Name         | What the task is called _(required)_               |
| Main Goal         | What you were trying to accomplish _(required)_    |
| Deadline          | When the task is due _(required)_                  |
| Completion Status | Not Started / In Progress / Complete _(required)_  |
| Reflection        | A written reflection on your progress _(required)_ |
| Collaborators     | Who did you work with                              |
| Work division     | How did you work with collaborators                |

> At least **one task** is required per work log, and every task must include all the required fields filled before submission.

---

### Submitting Your Work Log

1. Fill out all required fields in your work log.
2. Click **Submit**.
3. Review Submission.
4. Create new submission if needed.
5. Your submission will be timestamped automatically.
6. If submitted **after the deadline**, it will be marked as **Late** — but late submissions are still accepted.

> Every time you submit, a new **version** is saved. You will never lose a previous submission.

---

### Viewing Past Work Logs

You can access all of your previously submitted work logs at any time for your own reference and records (until the student access end date).

---

## For Instructors

### Your Dashboard

Your home page shows a **summary of the current week's submission statuses** for all students in your class, so you can quickly see who has submitted, who hasn't, who submitted late and review work logs.

---

### Setting Up a Class

1. Create a new class for the semester.
2. Pre-load your student roster (invite students and co-instructors by email).
3. Students will gain access to Laker Logs once they are added to your roster.

> Instructors will not be given option for inviting instructors/students if there is no active class.

---

### Reviewing Student Work Logs

Instructors can view, filter, and sort all student submissions by:

- **Student name**
- **Team**
- **Week / Reporting period**
- **Submission status** (Submitted, Late, Missing)
- **Review status**

Instructors can also:

- View **all versions** of a student's work log (including resubmissions)
- Mark a work log as **reviewed**

---

### Managing Student Accounts

If a student joins late or leaves the course, instructors can:

- **Add** new student
- **Archive** a student account

---

### Managing/Archiving Class

- There cannot be multiple active classes at once. **Class Settings** has options to change current class settings.
- The current active class should be archived before creating a new class.
- Instructors can archive the class through the **Archive Class** option under **Class Settings**.
- Archiving a class removes co-instructor and student access to that class.

---

## Notifications & Reminders

Laker Logs automatically notifies students to keep them on track with reminders such as:

- **Upcoming deadlines** — reminders before your work log is due
- **Missing work log** — if a work log is overdue
- **Submission confirmations** — after a successful submission
- **Late work log submission** — if a work log is submitted after the due date

Notifications appear on your **home page dashboard** and can be dismissed once reviewed.

---

## Data & Privacy

Laker Logs takes your privacy seriously and complies with the following regulations:

- **FERPA** — Your data is private. Students can only view their own work logs. Instructors can only view data for their own courses.
- **NY Education Law § 2-d** — Your personal information (name, Oswego email, student ID) is protected and will never be used for commercial or marketing purposes.
- **Record Retention** — All submitted work logs and their version history are retained for a minimum of **5 years**.

---

## Supported Browsers

| Browser         | Supported |
| --------------- | --------- |
| Google Chrome   | Yes       |
| Mozilla Firefox | Yes       |
| Apple Safari    | Yes       |

---

## Known Limitations

- Laker Logs **does not integrate** with Brightspace (D2L). It is a separate system and does not replace Brightspace for grading purposes.
- Laker Logs is **not optimized for mobile devices** (phones/tablets).
- There is **no real-time collaboration tracking** — work log editing is individual.
- Laker Logs is **only for CSC480 / HCI 521** at SUNY Oswego. It is not available for other courses.

---

## Glossary

| Term                | Definition                                                                                   |
| ------------------- | -------------------------------------------------------------------------------------------- |
| **Work Log**        | The weekly report submitted by a student to be reviewed by the instructor                    |
| **Task**            | An individual item on a work log with fields for goal, deadline, status, and reflection      |
| **Student User**    | A user who fills out and submits work logs                                                   |
| **Instructor User** | A user who manages rosters and reviews student work logs                                     |
| **Version**         | A saved copy of a work log each time it is submitted or resubmitted                          |
| **Late Submission** | A work log submitted after the deadline — still accepted but flagged as late                 |
| **FERPA**           | Federal law protecting the privacy of student education records                              |
| **WCAG**            | Web Content Accessibility Guidelines — standards for making websites accessible to all users |

---

## Architecture

Laker Logs is a containerized full-stack web application built with a microservices backend, a Next.js frontend, and MongoDB as the database.

---

### System Overview

```
Browser
  │
  ▼
Caddy (Reverse Proxy — port 80/443)
  ├── /         → Frontend (Next.js — port 3000)
  ├── /wl/*     → Worklog Service (Open Liberty — port 9081)
  └── /a/*      → Auth Service (Open Liberty — port 9084)
                           │
                           ▼
                      MongoDB (port 27017)
```

---

### Tech Stack

| Layer              | Technology                                          |
| ------------------ | --------------------------------------------------- |
| **Frontend**       | Next.js 15, React 19, TypeScript, Tailwind CSS 4    |
| **UI Components**  | shadcn/ui, Radix UI, Lucide React                   |
| **State & Data**   | Jotai, TanStack React Query 5, React Hook Form, Zod |
| **Backend**        | Java, Jakarta EE 10, Open Liberty, JAX-RS           |
| **Database**       | MongoDB 7 (direct driver, no ORM)                   |
| **Authentication** | Google OAuth 2.0 + JWT (RS256)                      |
| **Reverse Proxy**  | Caddy 2                                             |
| **Infrastructure** | Docker, Docker Compose, Terraform, AWS EC2          |

---

### Deployment

**Development** — run `make dev` to spin up MongoDB in Docker and all four backend services via Open Liberty dev mode alongside the Next.js dev server.

**Production (AWS)** — Terraform provisions an EC2 `t3.small` instance; `docker-compose.aws.yml` starts all services with Caddy as the reverse proxy terminating TLS via DuckDNS (`lakerlogs.duckdns.org`).

```
docker-compose.dev.yml     # MongoDB only (local dev)
docker-compose.yml         # All services (no proxy)
docker-compose.aws.yml     # All services + Caddy (production)
```

---

## Contributing

For full setup instructions, see [CONTRIBUTING.md](./CONTRIBUTING.md).

**Prerequisites** — Java 21+, Node.js / npm, Docker, Git, Maven (or use the included `mvnw` wrapper).

**Quick start (Mac/Linux):**

```bash
git clone https://github.com/Paul-Austin-Oswego-CSC480-HCI521/-OZ-CSC-480-HCI-521-Spring-2026-Public
cd ./-OZ-CSC-480-HCI-521-Spring-2026-Public
```
Refer to [Secrets](https://drive.google.com/drive/folders/18o940HLTQVe0yTq6HfDeKFZzcWMFWRJ9?usp=sharing) folder for credentials.
```bash
make setup        # install all dependencies
make dev-mongodb  # start MongoDB container
make dev-frontend # start Next.js dev server (http://localhost:3000)
make dev-backend  # start all four Open Liberty services
```

> Windows users: use Git Bash, Chocolatey (`choco install make`), or WSL. See [CONTRIBUTING.md](./CONTRIBUTING.md#windows) for details.

**Running tests** (from a backend service directory):

```bash
./mvnw test     # unit tests
./mvnw verify   # unit + integration tests
```

Feel free to open an issue or pull request — PR and issue templates are provided in the repo.

---

## License

© 2026 SUNY Oswego — CSC480 / HCI 521 Software Design Course. All rights reserved.

This project was created for academic purposes. Redistribution or use outside of the course context requires explicit permission from the authors.

---

_Laker Logs was developed as part of the CSC480 / HCI 521 Software Design course at SUNY Oswego, Spring 2026._
