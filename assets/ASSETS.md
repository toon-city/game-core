# Conventions d'Assets - Toon Live Game Core

## Vue d'ensemble

Ce document décrit les conventions et formats requis pour les assets du jeu (vêtements, meubles, maps) afin d'assurer leur compatibilité avec le moteur de jeu.

## Vêtements (assets/clothes/)

### Structure de dossiers
```
assets/clothes/
├── hair/
│   ├── hair7.json
│   └── hair7_1.png, hair7_2.png, etc.
├── hat/
│   ├── chapeau_paques4.json
│   └── chapeau_paques4_1.png, etc.
├── tshirt/
│   ├── tshirt_april7.json
│   └── tshirt_april7_bd_1.png, etc.
└── [nouvelle-catégorie]/
    ├── [id].json
    └── [id]_[direction].png
```

### Format JSON des vêtements

```json
{
  "frames": {
    "frame_name": {
      "frame": { "x": 0, "y": 0, "w": 64, "h": 64 }
    }
  },
  "meta": {
    "image": "texture_file.png"
  },
  "position": {
    "1": { "x": 0, "y": 0 },
    "2": { "x": 1, "y": -1 },
    "4": { "x": -1, "y": -1 }
  }
}
```

**Champs requis :**
- `frames` : Objet décrivant les frames du spritesheet
- `meta.image` : Nom du fichier PNG associé
- `position` (optionnel) : Corrections de position par direction

### Convention de nommage des textures

**Pattern standard :** `{id}_{direction}.png`
- `hair7_1.png`, `hair7_2.png`, etc.

**Pattern t-shirt :** `{id}_bd_{direction}.png`
- `tshirt_april7_bd_1.png`, `tshirt_april7_bd_2.png`, etc.

**Directions supportées :**
- `1` : Sud (face)
- `2` : Sud-Est
- `4` : Est (profil droit)
- `5` : Nord-Est
- `6` : Nord (dos)
- `8` : Ouest (profil gauche)
- `9` : Nord-Ouest
- `10` : Sud-Ouest

## Meubles (assets/furnitures/)

### Structure
```
assets/furnitures/
├── jardin/
│   ├── banc.json
│   ├── banc.png
│   ├── haie.json
│   └── haie.png
└── [catégorie]/
    ├── [nom].json
    └── [nom].png
```

### Format JSON des meubles

```json
{
  "frames": {
    "frame_0": {
      "frame": { "x": 0, "y": 0, "w": 64, "h": 64 },
      "points": [
        { "x": 0, "y": 32 },
        { "x": 64, "y": 32 },
        { "x": 64, "y": 64 },
        { "x": 0, "y": 64 }
      ]
    }
  },
  "meta": {
    "image": "meuble.png"
  }
}
```

**Champs requis :**
- `frames` : Frames du spritesheet (1-4 orientations)
- `meta.image` : Fichier PNG source

**Champs optionnels :**
- `points` : **Points d'ancrage au sol** - Définissent la zone d'occupation/collision du meuble
  - Ces points représentent l'empreinte au sol réelle du meuble
  - Utilisés pour collision avec autres meubles/avatars
  - Utilisés pour calcul Z-order basé sur position au sol
  - Si absent, utilise bounding box rectangle par défaut

## Maps d'appartements (assets/)

### Format JSON des maps

```json
[
  {
    "SID": "1",
    "SOID": "banc_001",
    "STYPE": 18,
    "SURL": "jardin/banc",
    "PXP": 100,
    "PYP": 200,
    "PR": 1,
    "AREA": 0
  }
]
```

**Champs requis :**
- `SID` : ID unique du meuble
- `SOID` : ID de l'objet
- `STYPE` : Type (17=floor, 18=furniture)
- `SURL` : Chemin vers l'asset (sans extension)
- `PXP`, `PYP` : Position X, Y
- `PR` : Rotation/orientation (1-4)

**Champs optionnels :**
- `AREA` : Zone de la pièce

## Format XML des structures (optionnel)

Le système supporte également les maps en XML avec noeuds `<P>` (points), `<W>` (murs), `<F>` (sols).

## Ajout de nouvelles catégories de vêtements

### 1. Créer les assets

```bash
mkdir assets/clothes/mask
# Ajouter mask.json et mask_1.png, mask_2.png, etc.
```

### 2. Créer la classe de vêtement

```typescript
// src/game/avatar/structure/parts/clothes/parts/Mask.ts
export class Mask extends Clothe {
  constructor(id?: string, direction?: number) {
    super('mask', id || 'mask_default', direction || 1);
  }
}
```

### 3. Enregistrer dans le registry

```typescript
// Dans src/game/avatar/ClotheRegistry.ts
import { Mask } from './structure/parts/clothes/parts/Mask';

// Dans le constructeur
this.register('mask', Mask);
```

### 4. Ajouter à la configuration

```typescript
// Dans src/game/avatar/partsConfig.ts
{ category: 'mask', className: 'Mask', order: 8, id: 'mask_default' }
```

## Validation des assets

Utilisez l'utilitaire de validation pour vérifier vos assets :

```typescript
import { validateAssetFile } from './src/utils/assetValidator';

const result = validateAssetFile('clothes/hair/hair7.json', jsonData);
if (!result.valid) {
  console.error('Erreurs:', result.errors);
}
```

## Outils de développement

- **Grid snapping** : Maintenez `Shift` lors du drag pour aligner sur la grille
- **Rotation** : Clic droit sur un meuble pour le faire tourner
- **Changement vêtement** : `avatar.changeClothing('category', 'id')`

## Troubleshooting

**Problème : Vêtement ne s'affiche pas**
- Vérifiez que le JSON contient `frames` et `meta.image`
- Vérifiez le pattern de nommage des PNG
- Vérifiez la console pour les erreurs de chargement

**Problème : Collision incorrecte des meubles**
- Ajoutez un champ `points` dans les frames du JSON
- Vérifiez que STYPE = 18 pour les meubles draggables

**Problème : Z-order incorrect**
- Le système utilise la position Y et les priorités par couche
- Les avatars sont toujours au-dessus des meubles, eux-mêmes au-dessus des sols/murs