# 📋 Instructions d'Installation - Barber Box

## Commandes Terminal à Exécuter

### 1. Installation des dépendances

```bash
cd /Users/dancohen/Desktop/barber-box-booking
npm install
```

### 2. Lancement du serveur de développement

```bash
npm run dev
```

### 3. Accès à l'application

Ouvrez votre navigateur et allez sur : **http://localhost:3000**

---

## 🔧 Commandes Disponibles

- `npm run dev` - Lance le serveur de développement
- `npm run build` - Compile l'application pour la production
- `npm run start` - Lance le serveur de production (après build)
- `npm run lint` - Vérifie le code avec ESLint

---

## ⚙️ Configuration Future

Quand vous serez prêt à intégrer l'API WhatsApp, créez un fichier `.env.local` à la racine du projet avec :

```env
WHATSAPP_API_KEY=your_api_key_here
WHATSAPP_PHONE_NUMBER=your_whatsapp_number
```

Le code est déjà préparé pour cette intégration dans `lib/mock-data.ts`.

---

## 📱 Test de l'Application

1. Allez sur la page d'accueil
2. Cliquez sur "התחל הזמנה" (Commencer la réservation)
3. Suivez le flux de réservation en 4 étapes :
   - Sélection du service
   - Sélection du coiffeur
   - Sélection date/heure
   - Formulaire client
4. Vérifiez la page de confirmation

---

## 🎨 Personnalisation

Les données mockées se trouvent dans `lib/mock-data.ts`. Vous pouvez facilement modifier :
- Les services proposés
- Les noms des coiffeurs
- Les créneaux horaires disponibles
