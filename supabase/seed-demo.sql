-- supabase/seed-demo.sql
-- Demo seed data for all features. Run after all migrations.
-- community_threads require a real admin user UUID — seeded via a DO block that
-- gracefully skips if no admin exists yet.

-- ─── RESOURCES (16 rows) ───────────────────────────────────────────────────

insert into public.resources (category, title, summary, format, difficulty, content, published_at) values
-- Nutrition (4)
('nutrition', 'Alimentation douce pendant les jours de fatigue',
 'Des repères simples pour manger avec régularité sans s''épuiser à cuisiner.',
 'article', 'gentle',
 '[{"type":"paragraph","text":"Misez sur des repas fractionnés, faciles à préparer, riches en protéines et pauvres en sucres rapides."},{"type":"quote","text":"L''objectif n''est pas de cuisiner parfaitement — c''est de ne pas se priver."},{"type":"paragraph","text":"Quelques idées : fromage blanc, banane, riz cuit d''avance, œufs mollets, soupes en brique."}]'::jsonb,
 timezone('utc', now()) - interval '5 days'),

('nutrition', 'S''hydrater efficacement pendant le traitement',
 'Boire suffisamment aide à réduire certains effets secondaires. Voici comment y arriver.',
 'article', 'gentle',
 '[{"type":"paragraph","text":"L''eau plate reste la référence. Variez avec tisanes froides, eau citronnée, bouillons légers."},{"type":"paragraph","text":"Évitez les boissons sucrées et l''alcool. En cas de nausées, les petites gorgées fréquentes sont plus efficaces que de grands verres."}]'::jsonb,
 timezone('utc', now()) - interval '4 days'),

('nutrition', 'Maintenir son poids : ni culpabilité ni performance',
 'La relation au corps change pendant le traitement. Quelques repères sans jugement.',
 'article', 'gentle',
 '[{"type":"paragraph","text":"Certaines patientes prennent du poids (hormonothérapie), d''autres en perdent (chimio). Les deux sont normaux."},{"type":"paragraph","text":"L''objectif n''est pas de retrouver un poids idéal mais de maintenir suffisamment d''énergie pour traverser les traitements."}]'::jsonb,
 timezone('utc', now()) - interval '3 days'),

('nutrition', 'Collations légères pour les petits creux',
 'Des idées concrètes pour les moments où l''appétit est réduit mais le corps a besoin de carburant.',
 'article', 'gentle',
 '[{"type":"paragraph","text":"Amandes, noix, crackers au sésame, compote sans sucre ajouté, smoothie protéiné léger."},{"type":"quote","text":"Manger peu mais souvent vaut mieux que de sauter un repas."}]'::jsonb,
 timezone('utc', now()) - interval '2 days'),

-- Activité physique (4)
('activite', 'Yoga doux adapté aux traitements',
 'Une séance de 20 minutes conçue pour les jours de fatigue, à faire assise ou allongée.',
 'video', 'gentle',
 '[{"type":"paragraph","text":"Cette vidéo de 20 minutes guide une pratique douce, axée sur la respiration et la mobilité articulaire."},{"type":"paragraph","text":"Pas besoin de tapis ni d''équipement — un lit ou un fauteuil confortable suffit."}]'::jsonb,
 timezone('utc', now()) - interval '6 days'),

('activite', 'Programme de marche progressive sur 4 semaines',
 'Reprendre le mouvement en douceur, à son rythme, avec des objectifs atteignables.',
 'exercise', 'gentle',
 '[{"type":"paragraph","text":"Semaine 1 : 10 minutes de marche lente, 3 fois par semaine."},{"type":"paragraph","text":"Semaine 2 : 15 minutes, 4 fois. Semaine 3 : 20 minutes, 4 fois. Semaine 4 : 25 minutes, 5 fois."},{"type":"quote","text":"Le rythme est le vôtre. Si une semaine est trop difficile, recommencez-la."}]'::jsonb,
 timezone('utc', now()) - interval '7 days'),

('activite', 'Exercices en chaise pour les jours sans énergie',
 'Bouger sans se lever : 8 exercices adaptés à une chaise ordinaire.',
 'exercise', 'gentle',
 '[{"type":"paragraph","text":"Rotations des chevilles, élévations de jambes, étirements des épaules, respiration consciente — chaque geste compte."},{"type":"paragraph","text":"10 minutes suffisent. L''objectif est de maintenir la circulation et réduire la raideur."}]'::jsonb,
 timezone('utc', now()) - interval '1 day'),

('activite', 'Étirements du matin pour bien commencer la journée',
 '5 minutes d''étirements doux pour réveiller le corps sans fatigue.',
 'exercise', 'gentle',
 '[{"type":"paragraph","text":"Commencez allongée : rotations du cou, étirement des bras vers le plafond, torsion douce du buste."},{"type":"paragraph","text":"Prenez le temps de ressentir chaque geste. Aucune douleur ne doit être présente."}]'::jsonb,
 timezone('utc', now()) - interval '8 hours'),

-- Beauté & image de soi (4)
('beaute', 'Prendre soin de sa peau pendant la chimiothérapie',
 'Des conseils concrets pour protéger et hydrater une peau fragilisée par les traitements.',
 'article', 'gentle',
 '[{"type":"paragraph","text":"Hydratez deux fois par jour avec une crème sans parfum ni alcool."},{"type":"paragraph","text":"Évitez les savons agressifs. SPF 50 même en hiver sur les zones exposées."},{"type":"quote","text":"Moins c''est plus — une routine simple et constante est plus efficace qu''une accumulation de produits."}]'::jsonb,
 timezone('utc', now()) - interval '3 hours'),

('beaute', 'Perruques, foulards et turbans : trouver son style',
 'Repères pratiques pour choisir, porter et vivre avec ses nouvelles coiffures de traitement.',
 'article', 'gentle',
 '[{"type":"paragraph","text":"La perte de cheveux est temporaire. En attendant, les foulards en bambou sont les plus doux pour le crâne sensibilisé."},{"type":"paragraph","text":"Les perruques peuvent être remboursées en partie — renseignez-vous auprès de votre CPAM ou mutuelle."}]'::jsonb,
 timezone('utc', now()) - interval '2 hours'),

('beaute', 'Atelier socio-esthétique : prendre soin de soi avec douceur',
 'Des ateliers animés par des professionnels formés à l''accompagnement des personnes malades.',
 'article', 'gentle',
 '[{"type":"paragraph","text":"Les ateliers socio-esthétiques proposent soins du visage, massage des mains, conseils maquillage — adaptés aux contraintes du traitement."},{"type":"paragraph","text":"ROSE-SEIN est partenaire de la Fédération Nationale de Socio-Esthétique. Contactez l''association pour les prochaines dates."}]'::jsonb,
 timezone('utc', now()) - interval '10 hours'),

('beaute', 'Soin des ongles pendant le traitement',
 'Comment protéger et entretenir des ongles fragilisés par la chimiothérapie.',
 'article', 'gentle',
 '[{"type":"paragraph","text":"Les ongles peuvent devenir cassants, décolorés ou se décoller. Des glaçons pendant la perfusion peuvent limiter cet effet."},{"type":"paragraph","text":"Évitez les faux ongles et l''acetone. Hydratez cuticules et ongles chaque soir avec une huile douce."}]'::jsonb,
 timezone('utc', now()) - interval '5 hours'),

-- Psychologie (4)
('psychologie', 'Exercice de respiration : la cohérence cardiaque',
 'Une technique simple de respiration à pratiquer 5 minutes, 3 fois par jour.',
 'exercise', 'gentle',
 '[{"type":"paragraph","text":"Inspirez 5 secondes, expirez 5 secondes, pendant 5 minutes. C''est tout."},{"type":"quote","text":"La régularité prime sur la durée. 5 minutes 3 fois par jour produisent des effets mesurables en quelques semaines."},{"type":"paragraph","text":"Pratiquez le matin, après le déjeuner et avant de dormir."}]'::jsonb,
 timezone('utc', now()) - interval '9 hours'),

('psychologie', 'Tenir un journal personnel : pourquoi et comment',
 'Écrire ses pensées aide à traverser les périodes difficiles. Un guide pour commencer.',
 'article', 'gentle',
 '[{"type":"paragraph","text":"Pas besoin d''être écrivain. Quelques lignes chaque soir sur ce que vous avez ressenti, ce qui vous a aidée, ce qui vous pèse."},{"type":"paragraph","text":"Le journal n''est pas un outil de performance — c''est un espace pour vous, sans jugement."}]'::jsonb,
 timezone('utc', now()) - interval '4 hours'),

('psychologie', 'Trouver un soutien psychologique adapté',
 'Comment accéder à un accompagnement psy pendant le parcours de soin.',
 'article', 'gentle',
 '[{"type":"paragraph","text":"Les services d''oncologie proposent souvent une psychologue intégrée à l''équipe soignante — demandez à votre coordinatrice de soins."},{"type":"paragraph","text":"ROSE-SEIN peut vous orienter vers des psychologues partenaires formés à la psycho-oncologie. Contactez l''association via la messagerie."}]'::jsonb,
 timezone('utc', now()) - interval '6 hours'),

('psychologie', 'Méditation guidée : retrouver un moment de calme',
 'Une session audio de 10 minutes pour se recentrer, même les jours les plus difficiles.',
 'video', 'gentle',
 '[{"type":"paragraph","text":"Installez-vous confortablement, fermez les yeux, et laissez-vous guider par la voix."},{"type":"paragraph","text":"Cette méditation de 10 minutes est conçue pour les personnes en traitement. Pas besoin d''expérience préalable."}]'::jsonb,
 timezone('utc', now()) - interval '7 hours')

on conflict do nothing;

-- ─── COMMUNITY SPACES (4) ────────────────────────────────────────────────────

insert into public.community_spaces (slug, title, description, icon_name, allowed_kind, sort_order) values
('patientes',    'Espace patientes',   'Un espace réservé aux patientes pour partager vécus, astuces et soutien mutuel.',         'Heart',      'patient',   1),
('aidants',      'Espace aidants',     'Pour les proches aidants : questions, ressources et solidarité entre accompagnants.',      'HandHeart',  'caregiver', 2),
('parole',       'Groupe de parole',   'Un cercle d''écoute bienveillant animé par l''association. Ouvert à tous.',                'MessageCircleHeart', 'all', 3),
('mentorat',     'Mentorat',           'Mise en relation avec des personnes ayant traversé un parcours similaire.',                'Sparkles',   'all',       4)
on conflict (slug) do nothing;

-- ─── COMMUNITY THREADS (requires admin user) ─────────────────────────────────

do $$
declare
  v_patientes uuid;
  v_aidants uuid;
  v_parole uuid;
  v_mentorat uuid;
  v_admin uuid;
begin
  select id into v_patientes from public.community_spaces where slug = 'patientes';
  select id into v_aidants   from public.community_spaces where slug = 'aidants';
  select id into v_parole    from public.community_spaces where slug = 'parole';
  select id into v_mentorat  from public.community_spaces where slug = 'mentorat';

  select user_id into v_admin from public.user_roles where role = 'admin' limit 1;

  if v_admin is null then
    raise notice 'No admin user found — skipping community thread seed. Create an admin user first.';
    return;
  end if;

  insert into public.community_threads (space_id, title, body, created_by, pinned) values
  (v_patientes, 'Comment gérez-vous la fatigue au quotidien ?',
   'La fatigue est l''un des effets secondaires les plus difficiles à vivre. Quelles stratégies vous aident à traverser les jours les plus lourds ? Partagez vos astuces, grandes ou petites.',
   v_admin, true),
  (v_patientes, 'Vos recettes préférées pendant le traitement',
   'Cuisiner quand on a peu d''énergie et l''appétit capricieux, c''est un vrai défi. Partagez ici vos recettes simples, rapides et qui passent bien même les mauvais jours.',
   v_admin, false),
  (v_patientes, 'Conseils pour les rendez-vous médicaux',
   'Comment vous préparez-vous avant un rendez-vous important ? Questions à poser, documents à apporter — partagez vos expériences.',
   v_admin, false),
  (v_aidants, 'Trouver l''équilibre entre soutien et distance',
   'Être présent sans s''effacer, soutenir sans étouffer — c''est un équilibre délicat. Comment trouvez-vous le vôtre ?',
   v_admin, true),
  (v_aidants, 'Parler de la maladie aux enfants',
   'Trouver les bons mots, adapter le discours à l''âge, gérer les questions difficiles... Si vous avez traversé cela, vos retours peuvent aider beaucoup d''autres familles.',
   v_admin, false),
  (v_aidants, 'Prendre soin de soi aussi',
   'En tant qu''aidant, il est facile d''oublier ses propres besoins. Quels gestes vous aident à tenir ?',
   v_admin, false),
  (v_parole, 'Se présenter — dites-nous qui vous êtes',
   'Bienvenue dans le groupe de parole ROSE-SEIN. Prenez le temps de vous présenter en quelques mots.',
   v_admin, true),
  (v_parole, 'Ce qui m''a aidé(e) cette semaine',
   'Un espace pour partager un moment positif, une découverte, une petite victoire.',
   v_admin, false),
  (v_parole, 'Questions pour l''association',
   'Vous avez une question sur le fonctionnement de ROSE-SEIN ? Posez-la ici — un membre de l''équipe répondra.',
   v_admin, false),
  (v_mentorat, 'Présentation des mentors disponibles',
   'Voici les personnes qui ont accepté de partager leur expérience dans un cadre confidentiel et bienveillant.',
   v_admin, true),
  (v_mentorat, 'Comment fonctionne le mentorat ROSE-SEIN ?',
   'Le mentorat est une mise en relation ponctuelle entre une personne qui cherche du soutien et une personne qui a traversé une expérience similaire.',
   v_admin, false),
  (v_mentorat, 'Témoignages — ce que le mentorat a changé',
   'Des témoignages de personnes qui ont bénéficié ou donné du temps dans le cadre du mentorat.',
   v_admin, false)
  on conflict do nothing;

end $$;

-- ─── ADDITIONAL ARTICLES (6 rows for filter demo) ────────────────────────────

insert into public.articles (slug, title, summary, category, content, published_at) values
('vivre-avec-incertitude',
 'Vivre avec l''incertitude du diagnostic',
 'Des repères psychologiques pour traverser la période d''attente et d''annonce.',
 'Médical',
 '[{"type":"paragraph","text":"L''attente des résultats est souvent décrite comme l''une des périodes les plus difficiles du parcours."},{"type":"paragraph","text":"Des techniques de pleine conscience et de structuration du quotidien peuvent aider à traverser cette phase."}]'::jsonb,
 timezone('utc', now()) - interval '6 days'),

('organisation-quotidienne-traitement',
 'Organiser son quotidien pendant le traitement',
 'Conseils pratiques pour gérer agenda, énergie et vie sociale pendant les cures.',
 'Quotidien',
 '[{"type":"paragraph","text":"Planifiez les tâches importantes les jours où vous avez le plus d''énergie — souvent 5 à 10 jours après une cure."},{"type":"paragraph","text":"N''hésitez pas à déléguer, simplifier, et dire non sans culpabilité."}]'::jsonb,
 timezone('utc', now()) - interval '4 days'),

('atelier-cuisine-adaptee',
 'Atelier cuisine adaptée : ce que vous pouvez faire chez vous',
 'Les principes de base d''une alimentation adaptée aux effets secondaires des traitements.',
 'Nutrition',
 '[{"type":"paragraph","text":"Les nausées, les mucites et la fatigue changent le rapport à la nourriture. Cuisiner simplement et sans contrainte est possible."}]'::jsonb,
 timezone('utc', now()) - interval '3 days'),

('maquillage-pendant-chimio',
 'Se maquiller pendant la chimio : le guide doux',
 'Produits adaptés, gestes simples et permissions qu''on ne se donne pas toujours.',
 'Beauté & bien-être',
 '[{"type":"paragraph","text":"Le maquillage peut être un geste de soin, pas une obligation. Si ça vous fait du bien, voici comment adapter votre routine."}]'::jsonb,
 timezone('utc', now()) - interval '2 days'),

('soutien-psycho-oncologie',
 'La psycho-oncologie : une spécialité au service des patients',
 'Ce qu''est la psycho-oncologie, ce qu''elle propose, et comment y accéder.',
 'Soins',
 '[{"type":"paragraph","text":"La psycho-oncologie accompagne le vécu émotionnel du cancer : annonce, traitement, rémission, rechute."}]'::jsonb,
 timezone('utc', now()) - interval '1 day'),

('evenement-octobre-rose',
 'Octobre Rose 2026 : les événements ROSE-SEIN',
 'Toutes les dates et activités prévues par l''association pour le mois d''octobre.',
 'Événements',
 '[{"type":"paragraph","text":"Cette année, ROSE-SEIN organise des ateliers, des marches solidaires, des conférences et des temps de partage tout au long du mois d''octobre."}]'::jsonb,
 timezone('utc', now()) - interval '12 hours')

on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  category = excluded.category,
  content = excluded.content,
  published_at = excluded.published_at,
  updated_at = timezone('utc', now());

-- ─── COMMUNITY REPLIES ───────────────────────────────────────────────────────
do $$
declare
  v_admin uuid;
  v_thread uuid;
begin
  select user_id into v_admin from public.user_roles where role = 'admin' limit 1;
  if v_admin is null then
    raise notice 'No admin user found — skipping community reply seed.';
    return;
  end if;

  -- Replies for "Comment gérez-vous la fatigue au quotidien ?"
  select id into v_thread from public.community_threads where title = 'Comment gérez-vous la fatigue au quotidien ?' limit 1;
  if v_thread is not null then
    insert into public.community_replies (thread_id, author_id, body, is_anonymous) values
    (v_thread, v_admin, 'Je fais des micro-siestes de 20 minutes après le déjeuner. Ça m''aide vraiment à tenir le reste de la journée.', false),
    (v_thread, v_admin, 'J''ai arrêté de culpabiliser quand je dois annuler des plans. La fatigue n''est pas un échec.', true),
    (v_thread, v_admin, 'La marche lente le matin, même 10 minutes, change vraiment mon énergie pour la journée.', false)
    on conflict do nothing;
  end if;

  -- Replies for "Vos recettes préférées pendant le traitement"
  select id into v_thread from public.community_threads where title = 'Vos recettes préférées pendant le traitement' limit 1;
  if v_thread is not null then
    insert into public.community_replies (thread_id, author_id, body, is_anonymous) values
    (v_thread, v_admin, 'Le risotto au parmesan — simple, crémeux, et toujours facile à avaler même les mauvais jours.', false),
    (v_thread, v_admin, 'Des smoothies banane-lait d''amande-miel. Rapide, nourrissant, et ne nécessite aucune cuisson.', true),
    (v_thread, v_admin, 'La soupe de carottes gingembre. Douce, anti-nausées, et elle se congèle bien pour les jours sans énergie.', false)
    on conflict do nothing;
  end if;

  -- Replies for "Se présenter — dites-nous qui vous êtes"
  select id into v_thread from public.community_threads where title = 'Se présenter — dites-nous qui vous êtes' limit 1;
  if v_thread is not null then
    insert into public.community_replies (thread_id, author_id, body, is_anonymous) values
    (v_thread, v_admin, 'Bonjour à tous. Je m''appelle Marie, j''ai 43 ans, en cours de chimio depuis 3 mois. Heureuse de trouver cet espace.', false),
    (v_thread, v_admin, 'Je suis l''aidante de ma femme. C''est parfois difficile de savoir quoi faire. Merci pour cet espace.', true),
    (v_thread, v_admin, 'Sophie, 51 ans, en rémission depuis 6 mois. Ici pour soutenir et partager ce qui m''a aidée.', false)
    on conflict do nothing;
  end if;

  -- Replies for "Présentation des mentors disponibles"
  select id into v_thread from public.community_threads where title = 'Présentation des mentors disponibles' limit 1;
  if v_thread is not null then
    insert into public.community_replies (thread_id, author_id, body, is_anonymous) values
    (v_thread, v_admin, 'Merci à l''équipe pour cette initiative. Le mentorat a été une bouée de sauvetage pour moi lors de mon parcours.', false),
    (v_thread, v_admin, 'Je serais intéressée pour être mentorée. Comment fonctionne le processus de mise en relation ?', false),
    (v_thread, v_admin, 'Je suis disponible comme mentor pour des patientes en chimio. N''hésitez pas à me contacter via la messagerie.', false)
    on conflict do nothing;
  end if;
end $$;

-- ─── NOTIFICATIONS (demo user) ──────────────────────────────────────────────
-- These will only insert if an admin user exists.
do $$
declare
  v_admin uuid;
begin
  select user_id into v_admin from public.user_roles where role = 'admin' limit 1;
  if v_admin is null then
    raise notice 'No admin user found — skipping notification seed.';
    return;
  end if;

  insert into public.notifications (user_id, kind, title, body, href, created_at) values
  (v_admin, 'message', 'Nouveau message de l''association', 'L''équipe ROSE-SEIN vous a envoyé un message.', '/messages', timezone('utc', now()) - interval '1 hour'),
  (v_admin, 'message', 'Réponse dans votre fil', 'Quelqu''un a répondu à votre message.', '/messages', timezone('utc', now()) - interval '3 hours'),
  (v_admin, 'article', 'Nouvel article publié', 'Un article sur la nutrition pendant le traitement est disponible.', '/actualites', timezone('utc', now()) - interval '5 hours'),
  (v_admin, 'article', 'Atelier disponible', 'Un nouvel atelier socio-esthétique a été ajouté aux ressources.', '/soins/beaute', timezone('utc', now()) - interval '8 hours'),
  (v_admin, 'event', 'Rappel : atelier demain', 'N''oubliez pas l''atelier prévu demain.', '/actualites', timezone('utc', now()) - interval '12 hours'),
  (v_admin, 'event', 'Nouvel événement ajouté', 'Un groupe de parole en ligne a été programmé.', '/actualites', timezone('utc', now()) - interval '1 day'),
  (v_admin, 'community_reply', 'Quelqu''un a répondu dans Espace patientes', 'Une nouvelle réponse a été publiée dans le fil sur la fatigue.', '/communaute/patientes', timezone('utc', now()) - interval '2 days'),
  (v_admin, 'community_reply', 'Nouveau fil dans Groupe de parole', 'Un nouveau sujet de discussion a été ouvert.', '/communaute/parole', timezone('utc', now()) - interval '3 days')
  on conflict do nothing;
end $$;
