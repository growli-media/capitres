/**
 * Dev utility for src/lib/analytics/country-match.ts's NAME_OVERRIDES
 * table — not run automatically anywhere. Run it whenever a real
 * visit's country isn't shading on the Analytics map, or whenever
 * world-atlas is upgraded (its country names could change between
 * versions), to see which ISO codes need a new override entry.
 *
 * Usage: npx tsx scripts/verify-country-names.mts
 */
import worldAtlas from "world-atlas/countries-50m.json" with { type: "json" };
import { matchCountryName } from "../src/lib/analytics/country-match";

const ISO_ALPHA2_CODES =
  "AD,AE,AF,AG,AI,AL,AM,AO,AQ,AR,AS,AT,AU,AW,AX,AZ,BA,BB,BD,BE,BF,BG,BH,BI,BJ,BL,BM,BN,BO,BQ,BR,BS,BT,BV,BW,BY,BZ,CA,CC,CD,CF,CG,CH,CI,CK,CL,CM,CN,CO,CR,CU,CV,CW,CX,CY,CZ,DE,DJ,DK,DM,DO,DZ,EC,EE,EG,EH,ER,ES,ET,FI,FJ,FK,FM,FO,FR,GA,GB,GD,GE,GF,GG,GH,GI,GL,GM,GN,GP,GQ,GR,GS,GT,GU,GW,GY,HK,HM,HN,HR,HT,HU,ID,IE,IL,IM,IN,IO,IQ,IR,IS,IT,JE,JM,JO,JP,KE,KG,KH,KI,KM,KN,KP,KR,KW,KY,KZ,LA,LB,LC,LI,LK,LR,LS,LT,LU,LV,LY,MA,MC,MD,ME,MF,MG,MH,MK,ML,MM,MN,MO,MP,MQ,MR,MS,MT,MU,MV,MW,MX,MY,MZ,NA,NC,NE,NF,NG,NI,NL,NO,NP,NR,NU,NZ,OM,PA,PE,PF,PG,PH,PK,PL,PM,PN,PR,PS,PT,PW,PY,QA,RE,RO,RS,RU,RW,SA,SB,SC,SD,SE,SG,SH,SI,SJ,SK,SL,SM,SN,SO,SR,SS,ST,SV,SX,SY,SZ,TC,TD,TF,TG,TH,TJ,TK,TL,TM,TN,TO,TR,TT,TV,TW,TZ,UA,UG,US,UY,UZ,VA,VC,VE,VG,VI,VN,VU,WF,WS,YE,YT,ZA,ZM,ZW".split(
    ",",
  );

const worldAtlasNames = new Set(
  worldAtlas.objects.countries.geometries.map((g) => (g.properties as { name: string }).name),
);

let matched = 0;
const unmatched: string[] = [];
for (const code of ISO_ALPHA2_CODES) {
  const name = matchCountryName(code, worldAtlasNames);
  if (name) matched++;
  else unmatched.push(code);
}

console.log(`= Matched ${matched} / ${ISO_ALPHA2_CODES.length} ISO country codes against world-atlas's names.`);
console.log(
  "= Unmatched (likely tiny/uninhabited territories absent from the -50m dataset — verify before adding an override):",
);
console.log(unmatched.join(", "));
