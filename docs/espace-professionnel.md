# Espace Professionnel — Spécification Fonctionnelle

> Version 1.0 — 2026-04-09 | Basé sur la réunion de cadrage du 2026-04-09

---

## 1. Contexte et Objectif

L'espace professionnel est un espace distinct au sein de ROSE-SEIN permettant aux professionnels de santé et du soin de support de se rendre visibles auprès des patientes, de publier leur agenda et d'accepter des demandes de rendez-vous. Il constitue le principal levier de revenus récurrents de l'association.

**Objectif business** : générer un revenu mensuel récurrent via des forfaits professionnels, pour financer le fonctionnement de la plateforme sur le long terme.

**Dates de lancement stratégiques** :
- Octobre Rose (campagne principale)
- 4 février — Journée mondiale contre le cancer (relance)

---

## 2. Deux parcours professionnels

### 2.1 Parcours Médical
Spécialistes médicaux et paramédicaux directement impliqués dans le traitement du cancer du sein.

Catégories (liste à affiner avec l'association) :
- Oncologue
- Chirurgien(ne) sénologue
- Radiothérapeute
- Médecin généraliste référent cancer
- Infirmier(e) coordinateur(trice)
- Kinésithérapeute
- Pharmacien(ne)
- Radiologue

### 2.2 Parcours Soins de Support
Professionnels de l'accompagnement global, non-médicaux ou paramédicaux à visée de bien-être.

Catégories (liste à affiner avec l'association) :
- Psychologue / Psycho-oncologue
- Nutritionniste / Diététicien(ne)
- Socio-esthéticien(ne)
- Sophrologue
- Coach en activité physique adaptée (APA)
- Assistant(e) social(e)
- Acupuncteur(trice)
- Ostéopathe
- Praticien(ne) yoga / relaxation

> ⚠️ Les catégories doivent être saisies sous forme de liste fermée (enum) dans la base de données. Aucune saisie libre n'est autorisée, pour garantir la cohérence des données.

---

## 3. Types de comptes professionnels

### 3.1 Professionnel libéral
- Crée et gère son propre compte
- Publie et gère son propre agenda
- Ses disponibilités sont visibles sans validation externe
- Son nom et spécialité apparaissent directement dans l'annuaire

### 3.2 Professionnel rattaché à une structure
- Son compte est rattaché à une structure (hôpital, clinique, centre de soin)
- La structure valide les disponibilités avant publication
- Dans l'annuaire, **le nom de la structure apparaît en priorité** (ex : "Centre hospitalier de Lyon — Service Oncologie")
- Le patient est orienté vers le bon praticien via l'interface de la structure
- Le médecin n'apparaît pas nominalement dans les résultats de recherche patients

### 3.3 Compte structure
- Une structure crée un compte unique (ex : clinique, hôpital, réseau de soins)
- Elle peut rattacher plusieurs professionnels
- Elle valide et publie les agendas de ses praticiens
- Elle représente le point de contact visible pour les patientes

---

## 4. Offres et Tarification

Basé sur la communication externe (flyer 2026-04-09) :

| Offre | Prix | Contenu |
|---|---|---|
| **Solidaire** | Gratuit ou 10 €/mois | Profil professionnel, Annuaire, Visibilité simple |
| **Visibilité + Agenda** | 25 à 40 €/mois | Profil pro + Agenda intégré, Prix de RDV, Rappels automatiques, Mise en avant |
| **Partenaire** | 60 à 100 €/mois | Highlights page d'accueil, Animation d'ateliers/webinaires, Statistiques détaillées |

> Les prix exacts et la grille tarifaire finale doivent être confirmés par l'association.

---

## 5. Fonctionnalités par offre

### Offre Solidaire
- Page profil publique (nom, spécialité, localisation, contact)
- Inscription dans l'annuaire des professionnels
- Visibilité dans les résultats de recherche (positionnement de base)

### Offre Visibilité + Agenda
- Tout ce qui est dans Solidaire
- Agenda de disponibilités publié (créneaux horaires)
- Prise de rendez-vous directement depuis l'application
- Confirmation et rappels automatiques par email
- Affichage du tarif de consultation
- Mise en avant dans les résultats de recherche

### Offre Partenaire
- Tout ce qui est dans Visibilité + Agenda
- Bloc "mise en avant" sur la page d'accueil de l'application
- Capacité à créer et animer des ateliers/webinaires
- Tableau de bord statistiques : visites profil, RDV pris, conversions

---

## 6. Agenda et Prise de Rendez-vous

### Flux professionnel libéral
1. Le professionnel crée des créneaux de disponibilité (date, heure, durée, type de consultation)
2. Les créneaux publiés apparaissent sur son profil public (si offre Agenda)
3. Une patiente sélectionne un créneau et soumet une demande
4. Le professionnel confirme ou décline (notification email)
5. Un rappel est envoyé à J-1 et H-2

### Flux structure médicale
1. Le compte structure crée les créneaux pour ses praticiens
2. Les créneaux sont soumis à validation interne avant publication
3. Une fois validés, ils apparaissent sous le profil de la structure
4. La patiente prend rendez-vous via la structure
5. La confirmation est gérée par la structure

### Consultation à distance (visio)
- Un champ "type" sur le créneau permet d'indiquer : présentiel / téléphone / visio
- Pour les consultations internationales, la visio est le mode par défaut recommandé

---

## 7. Communauté et portée géographique

La plateforme n'impose **aucune restriction géographique**. Les professionnels peuvent être basés en France, en Afrique, en Tunisie, en Turquie ou partout ailleurs. Les patientes de tout pays peuvent accéder à l'annuaire et aux agendas. L'objectif est une communauté internationale francophone.

---

## 8. Design et identité visuelle

- Réintroduire du **bleu** pour se rapprocher de l'identité visuelle du logo de l'association
- Le rose reste la couleur primaire de la plateforme patient
- L'espace professionnel peut utiliser une tonalité légèrement différente (bleu + rose) pour signaler son caractère distinct
- Le logo de l'association doit être transmis pour intégration dans l'application

---

## 9. Coûts récurrents estimés

| Poste | Estimation |
|---|---|
| Hébergement Vercel | ~20-50 €/mois |
| Base de données Supabase | ~25-50 €/mois |
| Email transactionnel | ~5-20 €/mois |
| **Total estimé** | **30-120 €/mois** |

Suivi des tickets/support non inclus dans le devis initial — à définir séparément (forfait ou facturation à l'heure/ticket).

---

## 10. Prochaines étapes (actions requises de l'association)

- [ ] Transmettre le logo officiel de ROSE-SEIN
- [ ] Valider et compléter la liste des catégories professionnelles (parcours médical et soins de support)
- [ ] Confirmer la grille tarifaire finale
- [ ] Confirmer le modèle de validation des agendas pour les structures
- [ ] Confirmer si les structures ont un compte unique ou des sous-comptes nominatifs

---

## 11. Ce qui n'est PAS dans ce périmètre (V1)

- Paiement en ligne des consultations (le professionnel gère son encaissement directement)
- Téléconsultation intégrée (un lien de visio externe est fourni, pas une salle de visio propre)
- Notation et avis des professionnels
- Agenda synchronisé avec Google Calendar / Outlook (V2 possible)
- Facturation automatique des abonnements (intégration Stripe en V2)
