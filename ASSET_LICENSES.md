# Asset e illustrazioni

Le dimostrazioni verificate sono 94 illustrazioni WebP originali generate per il progetto, conservate localmente in `public/illustrations-v3`. Mostrano le posizioni iniziale e finale di 47 esercizi con personaggi illustrati, senza persone reali. Il componente `src/components/ExerciseArt.tsx` mantiene anche uno schema SVG locale come fallback tecnico.

- nessuna fotografia e nessuna persona reale;
- nessun URL o asset esterno instabile;
- posizione iniziale e finale per ogni esercizio con asset verificato;
- stile crema, blu e verde acqua, con attrezzatura e movimento chiaramente differenziati;
- disponibili offline insieme al bundle della PWA.

La libreria comprende anche esercizi secondari per i quali non è ancora disponibile una dimostrazione verificata. In questi casi l’app non mostra immagini generiche o potenzialmente errate: visualizza un segnaposto dichiarato e mantiene istruzioni tecniche testuali complete. Le immagini caricate dall’utente per gli esercizi personalizzati restano nei dati locali del dispositivo.

L’icona `public/icon.svg` appartiene al progetto. Le illustrazioni sono supporti didattici e non sostituiscono una valutazione professionale.
