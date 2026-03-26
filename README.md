# VM Operational Admin Dashboard

## Project Description

A React-based admin configuration console that allows administrators to manage **services**, **applications**, and **external service integrations** through a clean, interactive UI. It communicates with a Spring Boot backend (H2 database) via REST APIs to read, create, update, and delete configuration data in real time.

---

## Features

- **Services Management** — View, search, and inline-edit internal services and their descriptions
- **Applications Management** — Drill into a service to view, add, edit, and delete its associated applications (with Prod & Sandbox URLs)
- **External Services Management** — Manage third-party integrations including service URL and integration type
- **Live Status Indicator** — Shows backend connectivity (Online/Offline) with last sync timestamp
- **Search & Filter** — Real-time search across services, applications, and external services
- **Bulk Save** — Save all service and external service configurations in one action
- **Initialize from Database** — Load/reset data from the backend file-based seed endpoint
- **Persistent Sync Messages** — Success/error feedback stored in `localStorage` across sessions
- **Responsive Design** — Fully responsive layout for desktop, tablet, and mobile
- **Auto-refresh** — Dashboard data auto-polls every 30 seconds

---

## Tech Stack

### Frontend
- [React 19](https://react.dev/) — UI library
- [Vite 7](https://vite.dev/) — Build tool and dev server
- CSS (custom, no UI framework) — Styling with Inter font via Google Fonts

### Backend *(external — not included in this repo)*
- Spring Boot — REST API server
- H2 Database — In-memory/file-based relational database
- Maven — Build tool

### DevOps / Tooling
- Docker — Multi-stage build (Maven build → JRE runtime image)
- ESLint — Code linting
- Node.js / npm — Package management

---

## Project Structure

```
vm-operational-admin-dashboard/
├── public/
│   └── vite.svg                  # Favicon
├── src/
│   ├── assets/
│   │   └── react.svg
│   ├── components/
│   │   ├── AdminDashboard.jsx    # Core dashboard component (all logic & UI)
│   │   └── AdminDashboard.css    # Dashboard styles (layout, cards, table, responsive)
│   ├── App.jsx                   # Root component — renders AdminDashboard
│   ├── App.css                   # App-level styles
│   ├── index.css                 # Global base styles
│   └── main.jsx                  # React entry point
├── .env                          # Environment variables (API base URL)
├── Dockerfile                    # Multi-stage Docker build for the backend
├── eslint.config.js              # ESLint configuration
├── index.html                    # HTML entry point
├── package.json                  # Dependencies and scripts
└── vite.config.js                # Vite configuration
```

---

## Prerequisites

Ensure the following are installed before running the project:

- [Node.js](https://nodejs.org/) v18 or higher
- npm v9 or higher
- A running instance of the Spring Boot backend on `http://localhost:8080`

> **Note:** The Dockerfile in this repo is for the Spring Boot backend. The frontend is run separately via Vite.

---

## Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vm-operational-admin-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Edit the `.env` file in the project root:
   ```env
   VITE_API_BASE_URL=http://localhost:8080/api
   ```
   Update the port and path to match your backend configuration.

4. **Start the backend**

   Ensure your Spring Boot backend is running on `http://localhost:8080` before starting the frontend.

---

## How to Run the Project

### Development Mode
```bash
npm run dev
```
The app will be available at `http://localhost:5173` (default Vite port).

### Production Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Lint
```bash
npm run lint
```

---

## API Endpoints

The frontend communicates with the following backend REST endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/services` | Fetch all services |
| `PUT` | `/api/services/:id` | Update a service |
| `POST` | `/api/services/bulk` | Bulk save all services |
| `GET` | `/api/external-services` | Fetch all external services |
| `PUT` | `/api/external-services/:id` | Update an external service |
| `POST` | `/api/external-services/bulk` | Bulk save all external services |
| `GET` | `/api/applications/service/:serviceId` | Fetch applications for a service |
| `POST` | `/api/applications` | Add a new application |
| `PUT` | `/api/applications/:id` | Update an application |
| `DELETE` | `/api/applications/:id` | Delete an application |
| `GET` | `/api/dashboard-config/full` | Fetch full dashboard config & status |
| `POST` | `/api/dashboard-config/init-from-file` | Seed/initialize data from backend file |

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:8080/api` | Base URL for the backend REST API |

> All `VITE_` prefixed variables are exposed to the browser by Vite.

### Ports

| Service | Default Port |
|---------|-------------|
| Frontend (Vite dev server) | `5173` |
| Backend (Spring Boot) | `8080` |

---

## UI Description

The dashboard uses a two-panel layout:

- **Sidebar (left)** — Fixed navigation panel with links to *Services* and *External Services* sections. Collapses to a horizontal tab bar on mobile.

- **Main Content (right)** — Contains:
  - A header with the app title, backend status indicator, last sync time, a *Load from Database* button, and a search bar
  - A green/red sync message banner for operation feedback
  - **Services view** — Responsive card grid; click a card's name/description to inline-edit, click `▶` to drill into its applications
  - **Applications view** — Table with inline editing for application name, Prod URL, and Sandbox URL; supports add and delete
  - **External Services view** — Table with inline editing for service name, URL, and integration type

---

## Future Enhancements

- Add user authentication and role-based access control (RBAC)
- Add confirmation modals instead of browser `confirm()` dialogs
- Introduce pagination or virtual scrolling for large datasets
- Add audit logging for configuration changes
- Support dark mode
- Write unit and integration tests (Jest / React Testing Library)
- Replace H2 with a production-grade database (PostgreSQL, MySQL)
