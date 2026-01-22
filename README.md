# Barber Box - מערכת הזמנת תורים

Application de réservation complète pour le salon de coiffure "Barber Box" développée avec Next.js 14.

## 🚀 Installation

### Prérequis
- Node.js 18+ installé sur votre machine
- npm ou yarn

### Étapes d'installation

1. **Installer les dépendances**
   ```bash
   npm install
   ```

2. **Lancer le serveur de développement**
   ```bash
   npm run dev
   ```

3. **Ouvrir dans le navigateur**
   - Allez sur [http://localhost:3000](http://localhost:3000)

## 📦 Stack Technique

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui + lucide-react (icônes)
- **Langue**: Hébreu (RTL)

## 🎯 Fonctionnalités V1

- ✅ Page d'accueil moderne avec logo et CTA
- ✅ Flux de réservation en 4 étapes:
  1. Sélection du service
  2. Sélection du coiffeur
  3. Sélection date/heure
  4. Formulaire client (nom, téléphone)
- ✅ Page de confirmation avec récapitulatif
- ✅ Support RTL complet pour l'hébreu
- ✅ Design responsive mobile-first

## 📁 Structure du Projet

```
├── app/
│   ├── booking/
│   │   ├── confirmation/    # Page de confirmation
│   │   └── page.tsx         # Page principale de réservation
│   ├── layout.tsx           # Layout principal avec RTL
│   ├── page.tsx             # Page d'accueil
│   └── globals.css          # Styles globaux
├── components/
│   ├── booking/             # Composants de réservation
│   └── ui/                  # Composants shadcn/ui
└── lib/
    └── utils.ts             # Utilitaires
```

## 🔮 Prochaines Étapes

- [ ] Intégration de l'API WhatsApp
- [ ] Base de données pour stocker les rendez-vous
- [ ] Système d'authentification admin
- [ ] Dashboard de gestion des rendez-vous
- [ ] Notifications et rappels

## 📝 Notes

- Les données sont actuellement "mockées" (simulées) pour permettre de tester le design
- La structure est prête pour l'intégration future de l'API WhatsApp
- Le projet utilise des données statiques pour les services, coiffeurs et créneaux horaires

## 🤝 Contribution

Pour toute question ou suggestion, n'hésitez pas à ouvrir une issue.

---

Développé avec ❤️ pour Barber Box
