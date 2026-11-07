# Mapa cest – první verze jen pro GitHub Pages

Tahle verze nepotřebuje žádnou databázi ani přihlašování. Všechno, co si kdo označí, se ukládá v jeho telefonu, v prohlížeči.

## Co je v balíčku

| Soubor | K čemu je |
|---|---|
| `index.html` | stránka appky |
| `app.js` | logika appky (mapa, pas, body, tabulka, sdílení odkazem) |
| `map.js` | mapa světa a seznam zemí |

## Nahrání na GitHub

1. Na https://github.com vytvoř repozitář (**New repository**), třeba `mapa-cest`, nastav ho jako **Public** a klikni *Create repository*.
2. Klikni na **uploading an existing file**, přetáhni `index.html`, `app.js` a `map.js` a dej *Commit changes*.
3. Otevři *Settings → Pages*, u *Source* vyber **Deploy from a branch**, větev **main**, složku **/ (root)** a dej *Save*.
4. Asi za minutu až dvě poběží appka na adrese `https://UZIVATEL.github.io/mapa-cest/`.

Když už na GitHubu starší verze je, stačí nahrát nové soubory přes **Add file → Upload files**. Staré se nahradí. Pokud tam zůstal soubor `firebase-config.js`, nevadí, tahle verze ho nepoužívá.

## Jak to funguje

- **Profil:** při prvním otevření si každý napíše jméno a vybere zemi, odkud je.
- **Přenos zemí ze staré verze:** při vytváření profilu klikni na „Mám kód ze staré verze“ a vlož:

  ```
  AT,CH,CZ,DE,ES,FR,GB,GR,HR,IT,LI,MV,PL,PT,SI,SK
  ```

- **Kamarádi a tabulka:** v sekci Můj profil je tlačítko **Sdílet moji mapu**. Pošle odkaz, kde jsou jméno, domovská země a navštívené země. Kdo odkaz otevře, uvidí tu mapu a může si odesílatele přidat do kamarádů a do tabulky. Když kamarád přidá nové země, pošle nový odkaz a v tabulce se aktualizuje.
- **Záloha a nový telefon:** odkaz ze Sdílet moji mapu je zároveň záloha. Když ho otevřeš na novém telefonu, appka nabídne „Je to moje mapa, obnovit“. Data kamarádů se ale přenést nedají, ty si přidej znovu z jejich odkazů.

## Na co si dát pozor

- **Data jsou jen v telefonu.** Když si někdo vymaže data prohlížeče nebo appku otevře v anonymním okně, jeho mapa zmizí. Proto je dobré si občas poslat odkaz Sdílet moji mapu sám sobě.
- **Každý telefon i prohlížeč má svoje data.** Mapa z mobilu se neukáže na počítači, dokud ji tam nepřeneseš odkazem.
- **Tabulka se neaktualizuje sama.** Ukazuje stav z posledního odkazu, který ti kamarád poslal.
- **Master přehled v téhle verzi není.** Bez databáze appka neví, kolik lidí ji používá. Přidat se dá později s Firebase.
