# Calisthenics Progress

PWA mobile-first in italiano per pianificare allenamenti calisthenics, registrare serie e recuperi, consultare la tecnica, seguire obiettivi e analizzare l’aderenza. Funziona senza account e conserva i dati sul dispositivo.

## Tecnologie

React, TypeScript, Vite, CSS utility-style personalizzato, Recharts, Lucide React e `vite-plugin-pwa` (manifest, service worker Workbox e cache offline).

## Avvio locale

Richiede Node.js 20 o superiore.

```bash
npm install
npm run dev
```

Aprire l’indirizzo mostrato da Vite. Per creare e provare la build:

```bash
npm run build
npm run preview
```

La PWA e il service worker sono attivi nella build di produzione (`preview`), non durante il normale server di sviluppo.

## Pubblicazione gratuita

### Vercel

Importare il repository, scegliere framework **Vite**, comando build `npm run build` e directory output `dist`. Non servono variabili d’ambiente.

### Netlify

Importare il repository, usare comando build `npm run build` e directory pubblicazione `dist`. In alternativa trascinare la cartella `dist` su Netlify Drop.

## Installazione sul telefono

- Android (Chrome/Edge): visitare il sito HTTPS, aprire il menu e scegliere **Installa app** o **Aggiungi a schermata Home**.
- iPhone/iPad (Safari): aprire il sito HTTPS, toccare **Condividi**, quindi **Aggiungi alla schermata Home**. Su iOS l’invito di installazione non può essere aperto programmaticamente.

## Dati, backup e offline

Allenamenti, calendario, risultati, note, obiettivi e preferenze sono salvati in `localStorage` con chiave `calisthenics-progress-v2`. Il profilo iniziale parte con storico, statistiche e obiettivi a zero. Il refresh e gli aggiornamenti successivi non rimuovono i dati inseriti. **Impostazioni** permette export JSON completo, storico CSV, import JSON, azzeramento esplicito e caricamento facoltativo dei dati dimostrativi.

Il service worker memorizza i file principali dopo la prima visita. La prima apertura richiede rete; in seguito l’interfaccia è disponibile offline. Dati e notifiche non vengono sincronizzati fra dispositivi.

## Immagini e icone

Le dimostrazioni utilizzano 48 illustrazioni tecniche locali, due pose per ciascun esercizio. Le figure sono disegnate, anonime e coerenti fra tutte le schede; non raffigurano persone reali. I dettagli sono documentati in `ASSET_LICENSES.md`. I file WebP si trovano in `public/illustrations/` e sono inclusi nella cache offline. L’icona installabile è `public/icon.svg`; per compatibilità massima con store o browser più vecchi si possono aggiungere PNG 192×192 e 512×512 al manifest in `vite.config.ts`.

## Piano progressivo luglio–settembre

Il calendario contiene il programma dal 6 luglio al 30 settembre 2026. Ogni ciclo usa tre settimane di aumento graduale seguite da una settimana di scarico. Il motore in `src/utils/trainingPlan.ts` controlla le ultime due sessioni dello stesso allenamento:

- due completamenti con almeno il 90% delle serie e difficoltà fino a 7/10 producono un piccolo aumento;
- una sessione parziale, meno del 70% delle serie o difficoltà almeno 9/10 mantiene/riduce il passo;
- nelle settimane di scarico viene rimossa una serie per esercizio;
- gli aumenti sono progressivi: ripetizioni per i movimenti dinamici e 5 secondi per gli esercizi isometrici.

La logica propone il carico, ma non sostituisce il giudizio personale o medico: dolore acuto e peggioramento persistente richiedono interruzione e valutazione professionale.

## Struttura

```text
public/             icona PWA
src/
  components/       navigazione, illustrazioni, scheda tecnica
  data/             esercizi, programmi e dati demo
  hooks/            stato condiviso e persistenza
  pages/            Oggi, Calendario, Progressi, Esercizi, Impostazioni
  storage/          localStorage, import/export
  types/            tipi TypeScript
  App.tsx            composizione pagine
  styles.css         design system responsive e temi
vite.config.ts       manifest, cache e service worker
```

## Problemi comuni

- **Il pulsante di installazione non appare:** servire la build via HTTPS (o localhost), visitare almeno una volta e verificare che il browser supporti PWA. Su iPhone usare il menu Condividi.
- **Offline non attivo in sviluppo:** usare `npm run build && npm run preview`.
- **Dati mancanti su un altro dispositivo/browser:** il salvataggio è volutamente locale; esportare JSON e importarlo sull’altro dispositivo.
- **Cache di una vecchia versione:** chiudere e riaprire l’app; il service worker è configurato con aggiornamento automatico. In caso estremo rimuovere i dati del sito e reinstallare, dopo aver esportato il backup.

## Limitazioni intenzionali

Senza backend non esistono login, sincronizzazione cloud o notifiche push a dispositivo chiuso. La vibrazione del recupero dipende dal supporto del browser. Le illustrazioni sono schematiche e locali, non video clinici.
