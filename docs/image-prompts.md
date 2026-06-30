# flyed Image Prompt Library

Tool-neutral prompts for AI image generation. Adapt to your chosen model (Midjourney v7, Flux 1.1, Imagen 4, DALL-E 3, Stable Diffusion XL). Adjust weighting syntax to match your tool.

## Style baseline (append to every prompt)

```
35mm film photography, golden hour, f/2.8 shallow depth of field, warm color grade,
rice-terrace tones (teak, bamboo green, sunset orange, off-white), no UI overlays,
no recognizable faces in tight close-up, candid group dynamics or hands/back views,
Southeast Asian outdoor setting, anamorphic lens flare subtle, organic grain
```

## Hero & destination imagery

### Hero (home page)
`Wide landscape, students hiking a forested ridge at golden hour in northern Thailand, light mist between pine trees, three figures silhouetted walking single-file on dirt trail, teak-orange backlight, deep green canopy, 35mm film photography, candid motion`

### Chiang Mai
`Students learning rice planting in flooded terraced paddy field, Doi Inthanon foothills in soft focus background, late afternoon sun, wide-angle 24mm, earthy teak-and-bamboo palette`

### Phuket / Andaman
`Group of teenagers in lifejackets boarding wooden longtail boat from limestone beach, turquoise water, midday sun, action shot mid-step, 35mm`

### Bangkok
`School group crossing ornate temple courtyard in Bangkok at sunrise, gold-stupa bokeh, candid laughter, mix of back-views and side-profiles`

### Kanchanaburi
`Students walking across the wooden bridge over River Kwai in soft morning light, mist on water, monochrome teak palette`

### Ayutthaya
`Wide shot of students sketching Khmer ruins at golden hour, head-cloth vendor blurred in background, warm amber tones`

### Khao Sok
`Group kayaking on emerald Cheow Lan Lake, dramatic limestone karsts rising from mist, midday overhead light`

### Krabi
`Climbers at base of sea-cliff limestone karst, harnesses and ropes visible, low-angle hero shot, late afternoon`

### Koh Tao
`Underwater half-and-half: divers above and below water line, tropical fish, sun rays penetrating surface`

### Chiang Rai
`Students planting saplings at ethical elephant sanctuary clearing, golden grass, soft backlight, candid movement`

### Sukhothai
`Cycling tour through ancient temple complex, lotus ponds, soft morning haze, golden light on brick stupas`

### Pai
`Backpack silhouettes on motorbike winding through bamboo forest, dappled afternoon light, motion blur on foreground leaves`

### Isan
`Homestay dinner with Thai-Isan family around low wooden table, papaya salad, candlelight, candid warmth, 35mm`

## Category imagery

### Service Learning
`Group of students and villagers building a bamboo school structure together, laughter, dirt under fingernails, golden hour side-light`

### Cultural & Heritage
`Temple dance lesson with young Thai teacher, fabric in motion, courtyard reflection, candid student joy`

### STEM & Environmental
`Marine biologist guide showing reef specimen to student on boat deck, equipment visible, action moment of discovery`

### Sports & Adventure
`Muay Thai training pad work, sweat droplets mid-air, dramatic gym lighting, anonymous silhouette composition`

### Language Immersion
`Student writing Thai alphabet in notebook on homestay porch, neighbor child pointing, dappled light`

### History & Heritage
`Students at Kanchanaburi war cemetery, heads bowed, poppies in hand, soft overcast light, respectful candid`

## Negative prompt (add to every generation)

```
cartoon, illustration, anime, 3D render, CGI, watermark, logo, text overlay,
sharp digital look, oversaturated HDR, plastic skin, stock-photo smile,
face close-up of identifiable minors, hospital / sterile environment,
generic airport / hotel lobby, Disneyland, theme park
```

## Post-processing

After generation:
1. Apply subtle film-grain overlay (3–5%)
2. Lift shadows slightly (avoid crushed blacks)
3. Teak-orange tint in highlights, bamboo-green tint in shadows (curves adjustment)
4. Resize to 3840×2160 max for hero, 1920×1080 for cards, 800×600 for thumbnails
5. Export AVIF + WebP + fallback JPEG

## Guardrails

- Never use real student likenesses
- Prefer group shots (5+ subjects) or back/hands/feet close-ups
- For solo student composition, use silhouette or side profile only
- All subjects ≥ 13 years old visually; never depict younger
- For "authentic Thai" depictions, include authentic details: school uniforms with appropriate patches, wai greeting visible, regional food props, temple etiquette
