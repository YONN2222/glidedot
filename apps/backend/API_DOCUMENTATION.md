# Glide API Documentation

Alle Endpoints erfordern eine Authentifizierung via API-Key im Header.

## Authentifizierung & Header

Jeder Request muss folgenden Header enthalten:

| Header         | Beschreibung                               | Beispiel                                         |
|----------------|--------------------------------------------|-------------------------------------------------|
| `x-api-key`    | Der API-Key des Nutzers (Member oder Admin) | `gl_77f2eee9db84dd618b5af983cfa8815fd93991290d8...` |
| `Content-Type` | Erforderlich für POST/PATCH/PUT            | `application/json`                               |

---

## Auth & User Management

### Selbstverwaltung
#### API-Key aktualisieren
- **Endpoint:** `POST /v1/auth/me/api-key`
- **Beschreibung:** Generiert einen neuen API-Key für den aktuellen Nutzer.
- **Response:** `[{ "apiKey": "gl_new_key..." }]`

#### Passwort ändern
- **Endpoint:** `POST /v1/auth/me/password`
- **Payload:**
  ```json
  { "password": "neues_passwort" }
  ```

### Admin-Only Endpoints
#### User erstellen
- **Endpoint:** `POST /v1/auth/users`
- **Payload:**
  ```json
  {
    "username": "marlon",
    "email": "marlon@glide.local",
    "password": "pwd",
    "isAdmin": false
  }
  ```

#### Team erstellen
- **Endpoint:** `POST /v1/auth/teams`
- **Payload:**
  ```json
  { "name": "Marketing Team" }
  ```

#### Member zu Team hinzufügen
- **Endpoint:** `POST /v1/auth/teams/:teamId/members`
- **Payload:**
  ```json
  { "userId": 2 }
  ```

#### Team Zugriff auf Projekt geben
- **Endpoint:** `POST /v1/auth/teams/:teamId/projects`
- **Payload:**
  ```json
  { "projectId": 1 }
  ```

#### Sprachberechtigung für Member setzen
- **Endpoint:** `POST /v1/auth/permissions`
- **Payload:**
  ```json
  {
    "userId": 2,
    "projectId": 1,
    "languageId": 5
  }
  ```

---

## Localization Module

### Sprachen (Languages)
#### Sprachen auflisten
- **Endpoint:** `GET /v1/localization/languages`

#### Sprache erstellen (Admin only)
- **Endpoint:** `POST /v1/localization/languages`
- **Payload:**
  ```json
  { "code": "fr", "name": "French" }
  ```

### Projekte (Projects)
#### Alle Projekte auflisten
- **Endpoint:** `GET /v1/localization/projects`

#### Projekt erstellen (Admin only)
- **Endpoint:** `POST /v1/localization/projects`
- **Payload:**
  ```json
  { "name": "Mobile App", "sourceLanguageId": 1 }
  ```

#### Sprache zu Projekt hinzufügen (Mit Project Access)
- **Endpoint:** `POST /v1/localization/projects/:projectId/languages`
- **Payload:**
  ```json
  { "languageId": 2 }
  ```

### Labels (Mit Project Access)
#### Labels eines Projekts auflisten
- **Endpoint:** `GET /v1/localization/labels/:projectId`

#### Label erstellen
- **Endpoint:** `POST /v1/localization/labels/:projectId`
- **Payload:**
  ```json
  { "name": "Urgent", "color": "#FF0000" }
  ```

### Translation Keys & Translations (Mit Project/Language Access)
#### Keys eines Projekts auflisten
- **Endpoint:** `GET /v1/localization/keys/:projectId`

#### Key erstellen
- **Endpoint:** `POST /v1/localization/keys/:projectId`
- **Payload:**
  ```json
  { "key": "welcome_message", "labelIds": [1, 2] }
  ```

#### Übersetzung speichern/updaten
- **Endpoint:** `POST /v1/localization/keys/:projectId/:keyId/translations`
- **Payload:**
  ```json
  { "languageId": 2, "value": "Willkommen!" }
  ```

#### Auto-Translate (DeepL/MyMemory)
- **Endpoint:** `POST /v1/localization/keys/:projectId/:keyId/auto-translate`
- **Payload:**
  ```json
  {
    "targetLanguageIds": [2, 3],
    "provider": "deepl"
  }
  ```

