# ScrapMax Global AI Command Agent Engine (`src/lib/ai`)

The **ScrapMax Global AI Command Agent** provides persistent, natural-language operating capabilities (text and voice STT/TTS) across the ScrapMax PWA.

---

## 🏗 Architecture Overview

```
User Input (Text / Voice STT)
           │
           ▼
   IntentResolver (Fast-path Regex + Gemini AI Fallback)
           │
           ▼
   PermissionChecker (Role-based Guards: guest, household, collector, admin)
           │
 ┌─────────┴─────────┐
 │ Allowed?          │
 ▼                   ▼
Yes                  No -> Show User Rejection Message
 │
 ▼
CommandExecutor
 ├── SAFE Action -------------> Immediate Route Navigation / Action
 └── REQUIRES_CONFIRMATION --> Trigger Generic AIConfirmationModal Dialog
```

---

## 📦 Core Modules

- **`commandTypes.ts`**: TypeScript definitions for `CommandIntent`, `CommandContext`, `AppUserRole`, `SafetyLevel`, `AIProvider`, and `ExecutionResult`.
- **`commandRegistry.ts`**: Canonical map of supported intents, natural phrases (English, Hindi/Marathi transliterations), required roles, target routes, and role-based suggestion chips.
- **`permissionChecker.ts`**: Security module enforcing role access rules before executing commands or opening routes.
- **`aiProvider.ts`**: Abstract `AIProvider` interface and `GeminiAIProvider` adapter querying `/api/voice-assistant` with fallback entity parsing (`extractEntitiesFromInput`).
- **`intentResolver.ts`**: Hybrid resolver combining low-latency keyword matching with Gemini AI LLM fallback.
- **`commandExecutor.ts`**: Navigation controller routing users to target pages or returning confirmation dialog payloads.
- **`__tests__/commandEngine.test.ts`**: Unit test suite for intent resolution, permission guards, and entity parsing.

---

## 🔑 Supported Intents & Capabilities

| Intent Name | Description | Target Route / Action | Required Role | Safety Level |
| :--- | :--- | :--- | :--- | :--- |
| `VIEW_DASHBOARD` | Open main dashboard | Dynamic (`/household`, `/collector`, `/admin`) | Any | `SAFE` |
| `VIEW_EARNINGS` | Open recycling earnings | `/household` | `household` | `SAFE` |
| `VIEW_HISTORY` | Open recycling history | `/household/history` | `household` | `SAFE` |
| `VIEW_PENDING_PICKUPS` | Filter pending pickups | `/household/history?status=pending` | `household` | `SAFE` |
| `VIEW_COMPLETED_PICKUPS` | Filter completed pickups | `/household/history?status=completed` | `household` | `SAFE` |
| `VIEW_IMPACT` | View eco impact stats | `/household` | `household` | `SAFE` |
| `OPEN_CHAT` | Open pickup chat | `/chat` | Any | `SAFE` |
| `VIEW_PRICES` | Open scrap rate board | `/safety` | Any | `SAFE` |
| `FIND_COLLECTORS` | Search nearby collectors | `/household` | Any | `SAFE` |
| `VIEW_SAFETY` | Open safety guide | `/safety` | Any | `SAFE` |
| `VIEW_PROFILE` | Open user account profile | `/household/profile` | `household` | `SAFE` |
| `VIEW_COLLECTOR_MAP` | Open collector route map | `/collector/map` | `collector` | `SAFE` |
| `ADMIN_DASHBOARD` | Open Admin console | `/admin` | `admin` | `SAFE` |
| `ADMIN_ANALYTICS` | Open Admin analytics | `/admin/analytics` | `admin` | `SAFE` |
| `SWITCH_LANGUAGE` | Switch app locale | `SWITCH_LANGUAGE` (`en`/`hi`/`mr`) | Any | `SAFE` |
| `PREPARE_PICKUP` | Prepare scrap pickup | `/household/request-pickup` | `household` | `REQUIRES_CONFIRMATION` |

---

## ➕ How to Add a New Intent

1. Add intent name to `CommandIntent` interface in `commandTypes.ts`.
2. Add rule object to `COMMAND_REGISTRY` in `commandRegistry.ts`:
   ```ts
   MY_NEW_INTENT: {
     intent: 'MY_NEW_INTENT',
     phrases: ['my custom phrase', 'another trigger phrase'],
     targetRoute: '/target-path',
     safetyLevel: 'SAFE', // or 'REQUIRES_CONFIRMATION'
     requiredRole: 'household',
   }
   ```
3. Update `permissionChecker.ts` if special role access is required.
4. Update `commandExecutor.ts` feedback message.
5. Add test case to `__tests__/commandEngine.test.ts`.

---

## 🧪 Testing the Command Engine

Run standard verification commands from project root:

```bash
# TypeScript verification
npx tsc --noEmit

# ESLint check
npx eslint src/lib/ai/ src/components/ai/ src/app/layout.tsx
```
