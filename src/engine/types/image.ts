import {Type} from './index'
import {Engine} from '../index'
import {ImageDefinition} from '../../fileFormats/cnv/types'
import {NotImplementedError} from '../../utils'
import {Sprite} from "pixi.js";
import {loadSprite} from "../assetsLoader";
import {FileNotFoundError} from "../../filesLoader";

export class Image extends Type<ImageDefinition> {
    private opacity: number = 1

    private sprite: Sprite | null = null

    constructor(engine: Engine, definition: ImageDefinition) {
        super(engine, definition)
    }

    async init() {
        this.sprite = await this.load()

        this.initSprite();

        if (this.definition.ONINIT) {
            this.engine.executeCallback(this, this.definition.ONINIT)
        }
    }

    destroy() {
        if (this.sprite != null)
            this.sprite.destroy()
    }

    ready() {
    }

    private async load() {
        const relativePath = this.engine.currentScene?.getRelativePath(this.definition.FILENAME);
        if (relativePath == undefined)
            throw new FileNotFoundError("Current scene is undefined!")

        return await loadSprite(this.engine.fileLoader, relativePath);
    }

    private initSprite() {
        if (this.sprite == null)
            throw new Error(`Cannot load image '${this.definition.FILENAME}'`);

        this.SETPRIORITY(this.definition.PRIORITY)
        this.sprite.visible = this.definition.VISIBLE
        this.engine.addToStage(this.sprite)

        console.debug(`File ${this.definition.FILENAME} loaded successfully!`)
    }

    SETOPACITY(opacity: number) {
        this.opacity = opacity
    }

    MOVE(xOffset: number, yOffset: number) {
        if (this.sprite == null)
            return;

        this.sprite.x += xOffset
        this.sprite.y += yOffset
    }

    SETPOSITION(x: number, y: number) {
        if (this.sprite == null)
            return;

        this.sprite.x = x
        this.sprite.y = y
    }

    SETPRIORITY(priority: number) {
        if (this.sprite == null)
            return;

        this.sprite.zIndex = -priority;
        this.sprite.sortChildren();
    }

    CLONE() {
        throw new NotImplementedError()
    }

    SHOW() {
        if (this.sprite == null)
            return;

        this.sprite.visible = true
    }

    HIDE() {
        if (this.sprite == null)
            return;

        this.sprite.visible = false
    }

    GETPOSITIONY() {
        return this.sprite != null ? this.sprite.y : 0
    }

    GETALPHA(x: number, y: number) {
        throw new NotImplementedError()
    }
}
