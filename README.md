# PM-B Frontend

Interface web du gestionnaire de projet **PM-B** — une plateforme collaborative de gestion de projets avec vues Kanban et liste, assistant IA et intégration GitHub.

## 🛠️ Stack technique

- **React 19** + **TypeScript**
- **Vite** (build)
- **Tailwind CSS** (styles)
- **React Router** (navigation)
- **dnd-kit** (drag & drop)
- **Framer Motion** (animations)
- **Lucide React** (icônes)

## ✨ Fonctionnalités

- **Dashboard** : vue d'ensemble des projets
- **Board View** : gestion Kanban avec **drag & drop**
- **List View** : affichage en liste
- **Workspaces & Espaces** : organisation des projets
- **Tâches & Sprints** : création, édition, suivi
- **Assistant IA** : posez des questions sur vos dépôts GitHub
- **Notifications** : centre de notifications
- **Invitations** : rejoindre un espace par email
- **Authentification** : login, inscription, MFA

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Configuration

L'URL de base de l'API est configurée dans `src/config/baseURL.tsx`.

### Lancer en développement

```bash
npm run dev
```

L'application est disponible sur `http://localhost:5173`.

### Build de production

```bash
npm run build
npm run preview
```

## 📁 Structure

```
src/
├── api/          # Appels API (auth, workspace, task, ...)
├── components/   # Composants UI (Board, List, Sidebar, ...)
├── config/       # Configuration (baseURL)
├── forms/        # Formulaires
├── pages/        # Pages (Dashboard, Login, Settings, ...)
└── assets/       # Ressources statiques
```

## 🔗 Projets liés

- [PM-B-backend](https://github.com/jadliaissam-edu/PM-B-backend) — API Spring Boot
- [PM-B-ia](https://github.com/jadliaissam-edu/PM-B-ia) — service d'intelligence artificielle
- [PM-B-infra](https://github.com/jadliaissam-edu/PM-B-infra) — déploiement (Docker, Terraform, Ansible)
