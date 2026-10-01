# Calisthenics Progress — Gym Strength & Conditioning

PWA mobile-first in italiano per recupero della forma, forza, definizione, dimagrimento e costanza con macchine, cavi e conditioning senza corsa. Funziona senza account e conserva i dati sul dispositivo.

## Programma

- A — Upper Body 1
- B — Lower Body 1
- C — Upper Body 2
- D — Lower Body 2
- E — Conditioning opzionale

Non esiste un calendario settimanale rigido: il suggerimento di forza segue A → B → C → D usando solo l’ultimo allenamento di forza realmente completato. E resta sempre opzionale e non interrompe la rotazione. Le quattro schede di forza hanno quattro blocchi A1+A2, B1+B2, C1+C2 e D1+D2 con 15 secondi di transizione e recupero dopo il secondo esercizio. La doppia progressione viene proposta solo quando entrambi gli esercizi del blocco raggiungono il limite alto con RIR adeguato; il carico non viene mai modificato automaticamente.

## Funzioni principali

- peso, ripetizioni, completamento, RIR e note per ogni serie;
- pulsante Completa giro, indicatore del giro, ordine A1/A2 scambiabile e modalità separata per macchina occupata;
- timer di recupero 30/45/60/75/90/120 secondi, con avvio automatico dopo il secondo esercizio della coppia;
- sessioni avviabili, persistenti, pausabili, terminabili, saltate o spostate, anche più volte nello stesso giorno;
- esercizi aggiungibili, sostituibili, riordinabili o rimovibili durante una sessione, senza perdere i dati già inseriti;
- serie di riscaldamento e di lavoro aggiungibili o rimovibili;
- conditioning opzionale con Camminata, Camminata inclinata, Vogatore, Corda e Boxe; nessuna corsa, ellittica o stair climber;
- calendario dinamico con stati selezionato, in corso, completato, parziale, saltato, riposo e giorno neutro, più modifica dello storico;
- libreria di oltre 60 esercizi con filtri, istruzioni e creazione di esercizi personali con immagine facoltativa;
- grafici di carichi, ripetizioni, volume, gruppi muscolari, aderenza, durata e conditioning;
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

Il nuovo schema usa la chiave `calisthenics-progress-gym-v6`. Alla prima apertura migra automaticamente i dati palestra v3, v4 e v5 compatibili, conservando sessioni, carichi, misure corporee, esercizi personali, calendario e preferenze. Le vecchie sessioni restano leggibili anche quando non contengono blocchi di superserie.

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
src/data/         esercizi e programmi A/B/C/D/E
src/hooks/        stato condiviso e persistenza
src/pages/        Oggi, Calendario, Progressi, Corpo, Esercizi, Impostazioni
src/storage/      migrazione, localStorage, import/export
src/types/        schema dati TypeScript v6
src/utils/        fasi, pianificazione, aderenza e volume
vite.config.ts    manifest e service worker PWA
```

Le illustrazioni mostrano posizione iniziale e finale, ma non sostituiscono l’indicazione di un professionista. Interrompere l’esercizio in caso di dolore acuto.
