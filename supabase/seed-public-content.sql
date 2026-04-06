insert into public.articles (
  slug,
  title,
  summary,
  category,
  content,
  published_at
)
values
  (
    'nutrition-fatigue-traitement',
    'Nutrition douce pendant les périodes de fatigue',
    'Des repères simples pour manger avec plus de régularité les jours de traitement ou de grande fatigue.',
    'Nutrition',
    '[
      {"type":"paragraph","text":"Misez sur des repas simples, fractionnés et faciles à préparer."},
      {"type":"paragraph","text":"L''objectif est de préserver l''énergie sans culpabiliser les jours plus difficiles."}
    ]'::jsonb,
    timezone('utc', now()) - interval '2 days'
  ),
  (
    'atelier-socio-esthetique-avril',
    'Atelier socio-esthétique: prendre soin de soi avec douceur',
    'Un atelier pensé pour la peau, les gestes simples et l''image de soi pendant le parcours.',
    'Beauté & bien-être',
    '[
      {"type":"paragraph","text":"Cet atelier propose des conseils concrets adaptés aux traitements et à la fatigue."}
    ]'::jsonb,
    timezone('utc', now()) - interval '1 day'
  )
on conflict (slug) do update
set
  title = excluded.title,
  summary = excluded.summary,
  category = excluded.category,
  content = excluded.content,
  published_at = excluded.published_at,
  updated_at = timezone('utc', now());

insert into public.articles (
  slug,
  title,
  summary,
  category,
  content,
  published_at
)
values
  (
    'prendre-soin-de-sa-peau-pendant-chimio',
    'Prendre soin de sa peau pendant la chimiothérapie',
    'Des conseils concrets pour protéger, hydrater et respecter une peau fragilisée par les traitements.',
    'Soins & bien-être',
    '[
      {"type":"heading","text":"Pourquoi la peau change pendant les traitements","level":2},
      {"type":"paragraph","text":"La chimiothérapie agit sur toutes les cellules à division rapide, y compris celles de la peau. Il est courant d''observer une sécheresse accrue, une plus grande sensibilité au soleil et parfois des rougeurs localisées."},
      {"type":"paragraph","text":"Ces effets sont temporaires mais méritent une attention douce et régulière pour éviter les complications cutanées."},
      {"type":"heading","text":"Les gestes essentiels","level":2},
      {"type":"paragraph","text":"Hydratez deux fois par jour avec une crème sans parfum ni alcool. Évitez les savons agressifs et préférez des nettoyants doux à pH neutre."},
      {"type":"quote","text":"Moins c''est plus. Une routine simple et constante est bien plus efficace qu''une accumulation de produits."},
      {"type":"paragraph","text":"Protégez votre peau du soleil même en hiver : SPF 50 sur les zones exposées, chapeau à larges bords lors des sorties."},
      {"type":"heading","text":"Quand consulter","level":2},
      {"type":"paragraph","text":"Si vous constatez des plaies qui ne cicatrisent pas, des rougeurs envahissantes ou des démangeaisons intenses, parlez-en à votre équipe soignante dès le prochain rendez-vous."}
    ]'::jsonb,
    timezone('utc', now()) - interval '3 hours'
  )
on conflict (slug) do update
set
  title = excluded.title,
  summary = excluded.summary,
  category = excluded.category,
  content = excluded.content,
  published_at = excluded.published_at,
  updated_at = timezone('utc', now());

insert into public.events (
  title,
  description,
  starts_at,
  ends_at,
  location_label,
  published_at
)
values
  (
    'Atelier nutrition et traitement',
    'Un temps d''échange avec repères pratiques, questions ouvertes et astuces réalistes pour les jours plus fragiles.',
    timezone('utc', now()) + interval '5 days',
    timezone('utc', now()) + interval '5 days 2 hours',
    'En ligne',
    timezone('utc', now()) - interval '1 day'
  ),
  (
    'Groupe de parole ROSE-SEIN',
    'Un cercle d''écoute bienveillant animé par l''association pour partager les vécus et les ressources utiles.',
    timezone('utc', now()) + interval '12 days',
    timezone('utc', now()) + interval '12 days 2 hours',
    'Bonamoussadi / visio',
    timezone('utc', now()) - interval '12 hours'
  )
on conflict do nothing;
