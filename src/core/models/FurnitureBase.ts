/**
 * `{itemId}_{orientation}_{n}.png` for an orientation whose art is animated
 * (see swf_to_furniture.py), else `{itemId}_{orientation}.png`.
 *
 * Two patterns rather than one with an optional trailing group: an item id can
 * itself end in a digit (`statut1_2.png`, `banquette1_3.png`), so the id part
 * has to stay greedy — and a single greedy pattern then reads
 * `dancefloor_1_0.png` as id `dancefloor_1`, orientation 0, which turned every
 * animation frame into an orientation of its own and left each one a
 * single-frame still. Matching the animated shape first is unambiguous.
 */
const ANIMATED_FRAME_KEY_RE = /^(.+)_(\d+)_(\d+)\.png$/;
const STATIC_FRAME_KEY_RE = /^(.+)_(\d+)\.png$/;

/** Fallback playback rate when a sheet declares no `meta.animationFps`. */
const DEFAULT_ANIMATION_FPS = 8;

export class FurnitureBase {
    /**
     * One representative frame key per orientation, indexed by
     * `orientation - 1`.
     *
     * Was `Object.keys(spritesheet.frames)` taken as-is, which assumed the
     * JSON lists frames in orientation order. The atlas packer sorts by
     * packing height, not by name, so it doesn't: lit5.json lists
     * `lit5_1, lit5_3, lit5_4, lit5_2`, and rotating that bed to orientation 2
     * picked `lit5_4.png` — the wrong artwork, with the wrong ground-anchor
     * points behind it. Built from the orientation number in the key now.
     */
    public readonly frameKeys: string[];
    /** Frames per orientation number, in animation order (length 1 when static). */
    private readonly framesByOrientation = new Map<number, string[]>();
    /** True when any orientation has more than one frame, i.e. it plays. */
    public readonly isAnimated: boolean;
    public readonly animationFps: number;

    constructor(
        public readonly id: number,
        public readonly type: number,
        public readonly spritesheet: any,
    ) {
        const indexed = new Map<number, { n: number; key: string }[]>();
        const unparsed: string[] = [];

        for (const key of Object.keys(spritesheet.frames ?? {})) {
            const animated = ANIMATED_FRAME_KEY_RE.exec(key);
            const match = animated ?? STATIC_FRAME_KEY_RE.exec(key);
            if (!match) { unparsed.push(key); continue; }
            const orientation = Number(match[2]);
            const frame = animated ? Number(animated[3]) : 0;
            const list = indexed.get(orientation) ?? [];
            list.push({ n: frame, key });
            indexed.set(orientation, list);
        }

        for (const [orientation, list] of indexed) {
            list.sort((a, b) => a.n - b.n);
            this.framesByOrientation.set(orientation, list.map(f => f.key));
        }

        const orientations = [...this.framesByOrientation.keys()].sort((a, b) => a - b);
        this.frameKeys = orientations.length
            // Sparse on purpose: an item with only orientations 1 and 3 must
            // still answer frameKeys[2] for orientation 3, not shift it down.
            ? Array.from({ length: Math.max(...orientations) },
                         (_, i) => this.framesByOrientation.get(i + 1)?.[0])
                   .filter((k): k is string => k !== undefined)
            // A sheet whose keys don't follow the contract at all: fall back to
            // raw order rather than rendering nothing.
            : unparsed;

        this.isAnimated = [...this.framesByOrientation.values()].some(f => f.length > 1);
        this.animationFps = Number(spritesheet.meta?.animationFps) || DEFAULT_ANIMATION_FPS;
    }

    /** Every frame of `orientation`, in animation order. Falls back to the
     *  first orientation that exists, same as the old frameKeys[0] default. */
    public framesFor(orientation: number): string[] {
        const frames = this.framesByOrientation.get(orientation);
        if (frames?.length) return frames;
        const first = [...this.framesByOrientation.keys()].sort((a, b) => a - b)[0];
        return (first !== undefined ? this.framesByOrientation.get(first) : undefined)
            ?? (this.frameKeys.length ? [this.frameKeys[0]] : []);
    }
}
