import {
  Carattere,
  Dancing_Script,
  EB_Garamond,
  Great_Vibes,
  Lora,
  Montserrat,
  Pinyon_Script,
  Playfair_Display,
  The_Nautigal,
  Viaoda_Libre,
} from "next/font/google";

const lora = Lora({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-lora",
  display: "swap",
  preload: false,
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
  preload: false,
});

const ebGaramond = EB_Garamond({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-eb-garamond",
  display: "swap",
  preload: false,
});

const viaodaLibre = Viaoda_Libre({
  subsets: ["latin", "vietnamese"],
  weight: ["400"],
  variable: "--font-viaoda",
  display: "swap",
  preload: false,
});

const pinyonScript = Pinyon_Script({
  subsets: ["latin", "vietnamese"],
  weight: ["400"],
  variable: "--font-pinyon",
  display: "swap",
  preload: false,
});

const theNautigal = The_Nautigal({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "700"],
  variable: "--font-nautigal",
  display: "swap",
  preload: false,
});

const carattere = Carattere({
  subsets: ["latin", "vietnamese"],
  weight: ["400"],
  variable: "--font-carattere",
  display: "swap",
  preload: false,
});

const dancingScript = Dancing_Script({
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700"],
  variable: "--font-dancing-script",
  display: "swap",
  preload: false,
});

const greatVibes = Great_Vibes({
  subsets: ["latin", "vietnamese"],
  weight: ["400"],
  variable: "--font-great-vibes",
  display: "swap",
  preload: false,
});

const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-montserrat",
  display: "swap",
  preload: false,
});

export const TEMPLATE_FONT_VARIABLES = [
  lora.variable,
  playfairDisplay.variable,
  ebGaramond.variable,
  viaodaLibre.variable,
  pinyonScript.variable,
  theNautigal.variable,
  carattere.variable,
  dancingScript.variable,
  greatVibes.variable,
  montserrat.variable,
].join(" ");
