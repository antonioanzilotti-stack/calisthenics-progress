# Calisthenics Progress — Gym Strength & Conditioning

PWA mobile-first in italiano per recupero della forma, forza, definizione, dimagrimento e costanza con macchine, cavi e conditioning senza corsa. Funziona senza account e conserva i dati sul dispositivo.

## Programma

- A — Upper Body completo
- B — Lower Body + Core
- C — Full Body
- E — Conditioning opzionale

Il suggerimento di forza segue A → B → C usando solo l’ultimo allenamento di forza realmente completato. E resta sempre opzionale e non interrompe la rotazione. Ogni seduta base comprende sei esercizi di lavoro eseguiti singolarmente ed è calibrata per consentire l’aggiunta manuale di uno o due esercizi. Il carico non viene mai modificato automaticamente.

## Funzioni principali

- peso, ripetizioni, completamento, RIR e note per ogni serie;
- timer di recupero 30/45/60/75/90/120 secondi, con avvio automatico dopo ogni serie;
- sessioni avviabili, persistenti, pausabili, terminabili o saltate, anche più volte nello stesso giorno;
- esercizi aggiungibili, sostituibili, riordinabili o rimovibili durante una sessione, senza perdere i dati già inseriti;
- serie di riscaldamento e di lavoro aggiungibili o rimovibili;
- conditioning opzionale con Camminata, Camminata inclinata, Vogatore, Corda e Boxe; nessuna corsa, ellittica o stair climber;
- libreria di oltre 65 esercizi con filtri, istruzioni, sostituzioni pertinenti e creazione di esercizi personali con immagine facoltativa;
- Progressi interattivi con viste Forza, Sedute e Conditioning, filtri per periodo, gruppo ed esercizio;
- peso corporeo e misure opzionali separati dai carichi delle macchine;
- backup JSON, import JSON compatibile ed export CSV completo;
- tema chiaro/scuro e PWA offline.

## Avvio locale

Richiede Node.js 20 o superiore.

```bash
npm install
npm run dev
```

Build di produzione e anteprima PWA:

```bash
npm run build
npm run preview
```

## Migrazione e persistenza

Il nuovo schema usa la chiave `calisthenics-progress-gym-v7`. Alla prima apertura migra automaticamente i dati palestra v3, v4, v5 e v6 compatibili, conservando sessioni, carichi, misure corporee, esercizi personali e preferenze. Le vecchie sessioni restano leggibili.

Le operazioni in Impostazioni sono distinte:

- **Cancella tutti i dati** richiede due conferme;
- **Reimposta solo programma** mantiene sessioni, carichi e misure già registrati.

## Pubblicazione

Il progetto è già collegato a GitHub e Vercel. Vercel deve usare preset Vite, comando `npm run build` e directory `dist`; non sono richieste variabili d’ambiente.

## Installazione sul telefono

- Android: aprire il sito HTTPS in Chrome/Edge, menu → **Installa app**.
- iPhone/iPad: aprire il sito in Safari, **Condividi** → **Aggiungi alla schermata Home**.

## Struttura

```text
src/components/   navigazione, illustrazioni e schede tecniche
src/data/         esercizi e programmi A/B/C/E
src/hooks/        stato condiviso e persistenza
src/pages/        Oggi, Progressi, Corpo, Esercizi, Impostazioni
src/storage/      migrazione, localStorage, import/export
src/types/        schema dati TypeScript v7
src/utils/        fasi, sequenza, progressione e volume
vite.config.ts    manifest e service worker PWA
```

Le illustrazioni mostrano posizione iniziale e finale, ma non sostituiscono l’indicazione di un professionista. Interrompere l’esercizio in caso di dolore acuto.
