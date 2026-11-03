"use client";

import { useState } from "react";
import Accueil from "./ui/Accueil";
import Qualification from "./ui/Qualification";
import Saisie from "./ui/Saisie";
import Recap from "./ui/Recap";

type Vue = { nom: "accueil" } | { nom: "qualification" } | { nom: "saisie"; id: string } | { nom: "recap"; id: string };

export default function Page() {
  const [vue, setVue] = useState<Vue>({ nom: "accueil" });
  if (vue.nom === "qualification") return <Qualification retour={() => setVue({ nom: "accueil" })} demarrer={(id) => setVue({ nom: "saisie", id })} />;
  if (vue.nom === "saisie") return <Saisie id={vue.id} retour={() => setVue({ nom: "accueil" })} terminer={() => setVue({ nom: "recap", id: vue.id })} />;
  if (vue.nom === "recap") return <Recap id={vue.id} modifier={() => setVue({ nom: "saisie", id: vue.id })} fini={() => setVue({ nom: "accueil" })} />;
  return <Accueil nouvelle={() => setVue({ nom: "qualification" })} reprendre={(id) => setVue({ nom: "saisie", id })} />;
}
