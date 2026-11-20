-- ==============================================================================
-- Ash-Shifa Herbals Seed Data
-- Strict Requirement: Exactly 4 Images per product
-- ==============================================================================

INSERT INTO public.products (
    id, name, scientific_name, category, batch_lot, short_desc, full_desc, 
    dosage, ingredients, price, stock, extract_type, co_a_verified, rating, reviews_count, images
) VALUES 
(
    'prod-001',
    'Black Seed Respiratory Elixir',
    'Nigella sativa & Eucalyptus globulus',
    'Tincture',
    'LOT #702',
    'Cold-pressed Nigella Sativa with eucalyptus',
    'A clinical-grade whole-spectrum cold-pressed black seed (Nigella sativa) extraction infused with steam-distilled blue mallee eucalyptus leaves. Formulated to support bronchial clear-pathways, histamine equilibrium, and pulmonary vitality during seasonal shifts.',
    '1 full dropper (1 mL) twice daily under tongue or mixed with warm herbal infusion.',
    ARRAY['Virgin Cold-Pressed Black Cumin Seed Oil (Nigella sativa)', 'Organic Blue Mallee Eucalyptus Essential Extract', 'Pure Botanical Glycerin', 'Wild Rosemary Oleoresin Antioxidant'],
    549.00,
    45,
    'Extract',
    TRUE,
    4.90,
    84,
    ARRAY[
        'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1546554137-f86b9593a222?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?auto=format&fit=crop&w=800&q=80'
    ]
),
(
    'prod-002',
    'Daily Botanical Immunity Capsules',
    'Ganoderma lucidum, Sambucus nigra & Astragalus membranaceus',
    'Formulation',
    'BATCH 814',
    'Adaptogenic reishi, elderberry & astragalus',
    'Standardized synergistic blend of dual-extracted red reishi fruiting body, Austrian Haschberg elderberry fruit, and high-polysaccharide astragalus root. Encapsulated in pure vegan cellulose for enhanced bioavailability and sustained cellular defense.',
    'Take 2 vegetable capsules every morning with pure water or meal.',
    ARRAY['Red Reishi Mushroom Extract (30% Polysaccharides)', 'Haschberg Elderberry Standardized 10:1 Extract', 'Mongolian Astragalus Root Extract (16% Astragalosides)', 'Organic Brown Rice Powder (Excipient-Free)'],
    689.00,
    60,
    '60 Veg Caps',
    TRUE,
    4.85,
    112,
    ARRAY[
        'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1577401239170-897942555fb3?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1550572017-edd951b55104?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=800&q=80'
    ]
),
(
    'prod-003',
    'Wild Herb Vitality Tonic',
    'Sambucus, Thymus vulgaris & Prunus serotina',
    'Tincture',
    'LOT #409',
    'Organic elderberry, thyme & wild cherry bark',
    'Slow-simmered apothecary tonic featuring Appalachian wild cherry bark, mountainous garden thyme, and raw wildflower honey. Handcrafted according to traditional pharmacopeia decoction methods to soothe mucosal tissue and foster natural endurance.',
    '1 tablespoon (15 mL) up to 3 times daily, or added to warm cider/tea.',
    ARRAY['Wild Black Cherry Bark Decoction', 'Fresh Mountain Thyme Extract', 'Austrian Elderberry Juice Concentrate', 'Organic Raw Wildflower Honey', 'Purified Artesian Spring Water'],
    479.00,
    35,
    'Extract',
    TRUE,
    4.95,
    67,
    ARRAY[
        'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1546554137-f86b9593a222?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=800&q=80'
    ]
),
(
    'prod-004',
    'Chamomile Soothing Salve',
    'Matricaria chamomilla & Calendula officinalis',
    'Topical Balm',
    'BATCH 112',
    'Handcrafted chamomile & calendula infused balm',
    'A restorative dermal ointment prepared by solar-infusing German chamomile blossoms and organic orange calendula petals into cold-pressed jojoba and pure beeswax. Ideal for delicate, reactive epidermis and cracked skin barrier restoration.',
    'Warm a pea-sized amount between clean fingertips and gently massage into affected cutaneous area.',
    ARRAY['Solar Infused Calendula & Chamomile Golden Jojoba Oil', 'Raw Unfiltered Cera Alba (Beeswax)', 'Blue Tansy Essential Oil', 'Non-GMO Vitamin E Tocopherols'],
    379.00,
    50,
    '2 oz Balm',
    TRUE,
    4.78,
    53,
    ARRAY[
        'https://images.unsplash.com/photo-1608248597359-543594833215?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=800&q=80'
    ]
)
ON CONFLICT (id) DO NOTHING;
