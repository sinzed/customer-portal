# Kundenportal - Architektur- und Delivery-Dokumentation

## 3) Dokumentation der Architektur

### A. High-Level-Architekturdiagramm der Komponenten

```
┌─────────────────────────────────────────────────────────────┐
│  Kundenportal (Frontend - Monolith, erweiterbar zu MF)     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Dokumente    │  │ Cases/Tickets │  │ Neues Ticket │    │
│  │ - Liste      │  │ - Übersicht   │  │ - Formular   │    │
│  │ - Download   │  │ - Status      │  │              │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└────────────────────────────┬───────────────────────────────┘
                              │ HTTP/REST (JWT)
┌─────────────────────────────▼───────────────────────────────┐
│  Backend (Monolith, erweiterbar zu Microservices)          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  FastAPI Application                                  │  │
│  │  - /auth, /documents, /cases                         │  │
│  │  - SalesforceService (Abstraktion)                    │  │
│  │  - Event Queue & Sync Layer                          │  │
│  │  - Cache-Datenbank (PostgreSQL)                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│  Event Queue (RabbitMQ/Redis/SQS)                          │
│  - Sync Events für Salesforce-Synchronisation             │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│  Salesforce (Source of Truth)                              │
│  - REST API, OAuth2, ContentDocument, Case Objects         │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│  Cache-Datenbank (PostgreSQL)                               │
│  - documents_cache, cases_cache (Fallback bei Ausfall)     │
└─────────────────────────────────────────────────────────────┘
```

**Komponenten:**
- **Frontend**: React 19 + Vite (Monolith, vorbereitet für Microfrontend-Migration)
- **Backend**: FastAPI (Monolith, modulare Struktur für spätere Microservices)
- **Synchronisation**: Event-driven mit Queue, tägliche Scheduled Jobs
- **Cache**: PostgreSQL als Backup bei Salesforce-Ausfall

---

### B. Beschreibung der Datenflüsse

**1. "Lese Dokumente":**
Frontend → Backend (Cache-First) → Cache-DB oder Salesforce → Response

**2. "Neues Ticket erstellen":**
Frontend → Backend → Cache-DB + Sync Event → Queue → Salesforce (asynchron)

**3. "Bestehende Tickets anzeigen":**
Frontend → Backend (Cache-First) → Cache-DB oder Salesforce → Response

**Synchronisations-Strategie:**
- **Outbound**: Backend erstellt Sync-Events bei Änderungen → Queue → Salesforce
- **Inbound**: Tägliche Scheduled Jobs holen Updates von Salesforce → Update Cache
- **Fallback**: Bei Salesforce-Ausfall werden Daten aus Cache-DB geliefert

---

### C. Sicherheitsüberlegungen und technische Anforderungen

**Authentifizierung:** JWT + OAuth2 mit Salesforce
- JWT Token (30 Min Expiration)
- Passwort-Hashing: bcrypt
- Token-Revocation bei Logout

**Dokumentenschutz:**
- Authorization Check: `document.customer_id == current_user.user_id`
- Zeitlich begrenzte Download-URLs (Production)
- Audit Logging

**Case-Erstellung:**
- Input Validation (Pydantic)
- Rate Limiting (10 Cases/Stunde)
- HTML-Escape, SQL-Injection Prevention

**CORS:** Whitelist-basierte Origins, keine Wildcards in Production

**Input Validation:** Mehrschichtig (Frontend HTML5, Backend Pydantic, Database Constraints)

---

### D. Erweiterbarkeit (Microfrontend & Microservices)

**Architektur-Design:**
Das MVP wird als **Monolith** implementiert, ist aber so strukturiert, dass eine spätere Migration zu **Microfrontend** (Frontend) und **Microservices** (Backend) einfach möglich ist.

**Erweiterbare Features:**
- **Appointment Scheduling**: Als Microfrontend + Microservice
- **Dynamic Forms**: Als Microfrontend + Microservice
- **Journey Tracking**: Als Microfrontend + Microservice
- **Cross-Sell Engine**: Als Microfrontend + Microservice

**Migrations-Strategie:**
- Modulare Code-Struktur (Routes, Services, Models getrennt)
- Klare Schnittstellen zwischen Modulen
- API Gateway vorbereitet (später hinzufügbar)
- Shared Components isoliert

---

## 4) Team- und Delivery-Perspektive

### A. Arbeitspakete für 6-Wochen MVP

**Woche 1: Foundation**
- AP 1.1: Projekt-Setup & Infrastruktur (Tech Lead + DevOps)
- AP 1.2: Salesforce Integration Spike (Backend Engineer)
- AP 1.3: API-Spezifikation (Tech Lead)

**Woche 2-3: Core Development**
- AP 2.1: Backend Authentication (Backend Engineer)
- AP 2.2: Backend Dokumente-API (Backend Engineer)
- AP 2.3: Backend Cases-API (Backend Engineer)
- AP 2.4-2.7: Frontend Setup, Dokumente, Cases, Auth UI (Frontend Engineer)
- AP 2.8: Event Queue & Sync Infrastructure (Backend Engineer)
- AP 2.9: Cache-Datenbank Setup (Backend Engineer)
- AP 2.10: Scheduled Sync Jobs (Backend Engineer)

**Woche 4: Integration & Testing**
- AP 3.1: End-to-End Integration (Backend + Frontend)
- AP 3.2: Security Testing (Tech Lead + Backend)
- AP 3.3: Bug Fixes (Gesamtes Team)

**Woche 5: Security & Operations**
- AP 4.1: Security Hardening (Tech Lead + Backend)
- AP 4.2: Monitoring & Logging (DevOps)
- AP 4.3: Dokumentation (Tech Lead)
- AP 4.4: Deployment Pipeline (DevOps)

**Woche 6: UAT & Launch**
- AP 5.1: User Acceptance Testing (Gesamtes Team)
- AP 5.2: Production Deployment (Tech Lead + DevOps)
- AP 5.3: Launch Support (Gesamtes Team)

---

### B. Team-Verteilung

**Kern-Team (6 Wochen):**
- **Tech Lead**: Architektur, Code Review, Koordination
- **Backend Engineer**: API, Salesforce Integration, Queue, Cache
- **Frontend Engineer**: UI Components, API Integration
- **Fullstack Engineer**: Unterstützung (Woche 2-5)

**Part-Time:**
- **DevOps Engineer**: Woche 1, 5, 6 (Infrastruktur, Monitoring)
- **QA Engineer**: Woche 4, 6 (Testing, UAT)

---

### C. Zentrale Herausforderungen

**1. Salesforce Integration Komplexität**
- Mitigation: Week 1 Spike, Service Layer Abstraktion, Caching

**2. Zeitliche Engpässe (6 Wochen)**
- Mitigation: Strict MVP Scope, Parallel Workstreams, Priorisierung

**3. Authentifizierung & Sicherheit**
- Mitigation: Early Implementation (Week 2), Security Review (Week 5)

**4. Daten-Synchronisation**
- Mitigation: Event-driven Queue, Cache-DB als Fallback, Scheduled Jobs

**5. User Experience**
- Mitigation: Early User Testing (Week 3-4), Clear Error Messages

---

## Fazit

Das Kundenportal wird als **schlankes, monolithisches MVP** in **6 Wochen** umgesetzt. Die Architektur ist **modular strukturiert** und **vorbereitet für spätere Migration** zu Microfrontend und Microservices. Die **event-driven Synchronisation** mit Queue und **Cache-Datenbank** gewährleistet Resilience und Performance auch bei Salesforce-Ausfällen.
