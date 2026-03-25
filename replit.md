# ModelHero - Plastimodelismo Kit Tracker

## Overview

ModelHero is a productivity dashboard designed for plastic model kit hobbyists. Its primary purpose is to help users organize their kit collections, track build progress, log work hours, manage paints and reference materials, and provide insightful statistics about their hobby. The application aims to be a comprehensive tool for modelers, offering features like AI-powered duplicate purchase detection, sophisticated paint conversion tools, and internationalization with multi-currency support. It is built as a full-stack TypeScript project, leveraging React for the frontend and Express for the backend, targeting both Brazilian and international markets with tailored payment solutions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: React Query for server state, React useState for local state
- **UI Components**: shadcn/ui (Radix UI-based)
- **Styling**: Tailwind CSS with custom CSS variables for design tokens
- **Build Tool**: Vite
- **Design System**: Productivity dashboard aesthetic with a custom color palette (Hunter Green, Spicy Paprika, Muted Teal) and dark/light theme support.

### Backend
- **Runtime**: Node.js with Express
- **Language**: TypeScript
- **API Pattern**: RESTful endpoints (`/api` prefix)
- **Static Serving**: Express serves built frontend assets in production.

### Data Layer
- **ORM**: Drizzle ORM (PostgreSQL dialect)
- **Schema**: Shared in `shared/schema.ts` with drizzle-zod for validation.
- **Migrations**: Managed via drizzle-kit.

### Internationalization (i18n)
- **Library**: react-i18next
- **Supported Languages**: Portuguese (pt), English (en), Spanish (es), French (fr), German (de), Italian (it), Russian (ru), Japanese (ja).
- **Language Selection**: Route prefixes for Home and Auth pages (`/en`, `/es`, etc.) configure language/currency and redirect. `preferredLanguage` stored per user.
- **Translation Structure**: Organized by common UI, navigation, and specific page content.

### Currency Converter
- **Context**: `client/src/contexts/CurrencyContext.tsx`
- **API**: Frankfurter API for exchange rates, cached client-side.
- **Supported Currencies**: BRL, USD, EUR, GBP, JPY, AUD, CAD, CHF, CNY, ARS, MXN, CLP.
- **Features**: User-selectable display currency, per-kit currency selection, `preferredCurrency` stored per user.

### Image Storage
- **Storage**: Replit Object Storage (Google Cloud Storage backed)
- **Flow**: Frontend uploads via presigned URLs (`POST /api/uploads/request-url` → PUT to GCS), returns `/objects/{path}` URLs stored in DB
- **Upload Hook**: `client/src/hooks/use-kit-image-upload.ts` - handles file upload to object storage
- **Server Upload**: `POST /api/images/upload-base64` - accepts base64, saves to object storage, returns `/objects/` URL
- **Serving**: `GET /objects/:objectPath(*)` streams files from object storage
- **Migration**: `POST /api/admin/migrate-all-users-images` (admin only) - migrates all base64 data in DB to object storage
- **Image Fields**: boxImage, instructionImages, buildPhotos, referencePhotos, referenceDocuments - all store `/objects/` URLs
- **Backward Compat**: Frontend renders both `data:` (legacy base64) and `/objects/` URLs via standard `<img src>`

### Key Features & Data Models
- **Kit Tracking**: Core entity (`Kit`) with fields for `kitNumber`, `name`, `brand`, `scale`, `status` (e.g., `na_caixa`, `montado`), `progress`, `hours worked`, `financial values` (with `paidValueCurrency`), `ratings`, `paints`, `reference files`, `startDate`, `endDate`.
    - **Automatic Date Tracking**: `startDate` set on first timer use, `endDate` on `montado` status.
    - **Cross-User Kit Sharing**: Auto-populates kit details from existing kits by `kitNumber`.
    - **Kit List**: Filtering by `Status`, `Destino`, `Type`, `Scale`, `Brand`; sorting by `Mais Recentes`, `Ordem Alfabética`.
- **Duplicate Purchase Detection**:
    - **AI-Powered**: Uses GPT-4o vision (via photo/URL) or text query to compare against user's collection.
    - **Item Types**: Kits, Tintas (Paints), Insumos (Supplies), Ferramentas (Tools), Decais (Decals).
    - **API**: `POST /api/ai/check-duplicate` returns extracted info, potential duplicates with confidence, and recommendations.
- **Paint Converter & Color Scheme Selector**:
    - **Paint Converter**: Uses IPMS Stockholm data, searchable camouflage schemes. Clickable FS chips auto-populate search.
    - **Color Scheme Selector**: On Kit Detail page, allows applying predefined camouflage schemes (USAF, USN, Luftwaffe, etc.) with brand-specific paint selection. Supports FS, RLM, RAL, ANA codes.
- **Materials Management (`/materiais`)**: Inventory for `Tintas`, `Insumos`, `Ferramentas`, `Decais`. Tracks `currentQuantity`, `minQuantity` for low stock warnings. Full CRUD.
- **Navigation**: Desktop sidebar, mobile bottom tab navigation.
- **Payment Integration**:
    - **Dual Gateway**: Kiwify for Brazilian users, Stripe for international users.
    - **Flow**: Redirects to gateway, webhook processes `checkout.session.completed` to update user status (`"pago"`).
- **AI Usage Tracking**: Logs all AI actions (`ia_actions` table) to track `iaUsersCount`, `iaActionsTotal`, `iaUsageDistribution` for admin insights.
- **Admin KPIs Tab (Redesigned)**:
    - **CEO Mode**: Executive-focused view with 6 high-level KPIs, executive funnel visualization, and funnel economy metrics (CAC, payback).
    - **Product Mode**: Detailed diagnostic view with activation/engagement metrics, product usage, collapsible IA usage section, and conversion/monetization data.
    - **Global Period Selector**: 7d/30d/all/custom period affects all metrics across both modes (funnel, metrics, upgrade clicks).
- **Public Sharing**:
    - **Share Token**: Each user gets a unique `shareToken` (UUID) stored in `users` table, generated on first share.
    - **Public Routes**: `/share/:shareToken` (profile with tabs), `/share/:shareToken/kit/:kitId` (kit detail). Query param `?tab=materials|statistics` selects tab.
    - **Public API**: `GET /api/public/:shareToken/profile|kits|kits/:kitId|materials|statistics` - read-only, no auth required.
    - **Share Button**: `ShareButton` component on Kits, KitDetail, Materials, Estatisticas pages. Generates token via `POST /api/user/share-token`, copies public link to clipboard.
    - **Pages**: `PublicProfile.tsx` (tabbed: kits grid, materials, statistics with charts), `PublicKitDetail.tsx` (read-only kit detail with photos).
    - **i18n**: `share.*` translation keys in all 8 locale files.

## File Reference

### Backend (server/)
| Arquivo | Função |
|---|---|
| `server/index.ts` | Entrada do servidor Express. Middleware (sessão, JSON, webhook Stripe), servir frontend, erros, Stripe init, job de emails |
| `server/routes.ts` | Todas as rotas REST: auth, kits, materiais, admin KPIs, IA, gamificação, pagamento, workbench, RSS |
| `server/storage.ts` | Acesso ao banco (Drizzle ORM). CRUD: kits, materiais, usuários, badges, gamificação, métricas, eventos |
| `server/db.ts` | Conexão PostgreSQL (pool + Drizzle) |
| `server/stripeClient.ts` | Cliente Stripe via stripe-replit-sync |
| `server/webhookHandlers.ts` | Webhooks Stripe (checkout, assinatura) |
| `server/resendClient.ts` | Emails via Resend: boas-vindas, follow-ups multilíngue |
| `server/vite.ts` | Integração Vite em dev (HMR) |
| `server/replit_integrations/object_storage/` | Object Storage do Replit (upload/download, ACL, rotas) |

### Shared
| Arquivo | Função |
|---|---|
| `shared/schema.ts` | Schema DB (Drizzle), tipos TS, validação Zod. Tabelas: users, kits, materials, ia_actions, etc. |

### Frontend - Páginas (client/src/pages/)
| Arquivo | Função |
|---|---|
| `Home.tsx` | Dashboard: kits em progresso, stats rápidas |
| `Login.tsx` / `Register.tsx` | Login e cadastro |
| `Kits.tsx` | Lista de kits com filtros e ordenação |
| `KitDetail.tsx` | Detalhes: timer, progresso, fotos, tintas, esquemas de cores |
| `Materials.tsx` | Gestão de materiais (tintas, insumos, ferramentas, decais) |
| `Estatisticas.tsx` | Estatísticas e gráficos |
| `Admin.tsx` | Painel admin: CEO Mode e Product Mode |
| `Wishlist.tsx` | Lista de desejos |
| `WidgetRegisterPT/ES.tsx` | Widgets de registro embutíveis |

### Frontend - Componentes Principais
| Arquivo | Função |
|---|---|
| `AppSidebar.tsx` | Sidebar desktop |
| `BottomNav.tsx` | Nav mobile |
| `KitForm.tsx` | Formulário de kit |
| `PaintConverter.tsx` | Conversor de tintas entre marcas |
| `DuplicateChecker.tsx` | Verificador de duplicatas com IA |
| `TodaySession.tsx` | Timer/workbench |
| `GlobalMilestoneModals.tsx` | Modais de engajamento progressivo |
| `GamificationBadge.tsx` | Badge de nível |

### Frontend - Libs e Contextos
| Arquivo | Função |
|---|---|
| `lib/queryClient.ts` | React Query config + apiRequest |
| `lib/paintCodes.ts` / `paintConversions.ts` | Catálogos e conversão de tintas |
| `lib/paymentInfo.ts` | Links de pagamento (Stripe, Kiwify) |
| `contexts/AuthContext.tsx` | Autenticação (login, logout, sessão) |
| `contexts/CurrencyContext.tsx` | Moeda (conversão, Frankfurter API) |
| `i18n/index.ts` | Configuração i18next (8 idiomas) |

## External Dependencies

### Database
- **PostgreSQL**
- **Drizzle ORM**

### UI Libraries
- **Radix UI**
- **shadcn/ui**
- **Lucide React** (Icons)
- **Recharts** (Charts)
- **Embla Carousel**

### Build & Development
- **Vite**
- **esbuild**
- **tsx**

### Utility Libraries
- **date-fns**
- **class-variance-authority**
- **clsx/tailwind-merge**
- **zod**
- **react-hook-form**
- **Frankfurter API** (Currency exchange rates)
- **Stripe** (Payment gateway)
- **Kiwify** (Payment gateway for Brazil)