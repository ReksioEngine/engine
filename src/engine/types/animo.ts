import {Type} from './index'
import {AnimoDefinition} from '../../fileFormats/cnv/types'
import {Engine} from '../index'
import {NotImplementedError} from '../../utils'
import * as PIXI from 'pixi.js'
import {Point, Sprite, Texture} from 'pixi.js'
import {FileNotFoundError} from '../../filesLoader'
import {ANN, AnnImage, Frame} from '../../fileFormats/ann'
import {Event as Event} from '../../fileFormats/ann/index'
import {callbacks} from '../../fileFormats/common'

//TODO: Try to use Image class here
export class Animo extends Type<AnimoDefinition> {
    private isPlaying: boolean = false
    private currentFrameIdx: number = 0
    private currentEvent: string = '1'
    private currentLoop: number = 0
    private usingImageIndex = -1

    private annFile: ANN | null = null
    private sprite: Sprite | null = null
    private textures = new Map<number, PIXI.Texture>()

    protected readonly onFinished?: callbacks<string>
    protected readonly onFrameChanged?: callbacks<string>

    constructor(engine: Engine, definition: AnimoDefinition) {
        super(engine, definition)
        this.onFinished = definition.ONFINISHED
        this.onFrameChanged = definition.ONFRAMECHANGED
    }

    async init() {
        this.annFile = await this.loadAnimation()
        this.initAnimatedSprite()
    }

    ready() {
        this.tick(0)
    }

    destroy() {
        if (this.sprite === null) return
        this.engine.removeFromStage(this.sprite)
    }

    tick(delta: number) {
        if (this.sprite == null || !this.sprite.visible || !this.isPlaying) return

        this.ONTICK()
    }

    private async loadAnimation() {
        const relativePath = this.engine.currentScene?.getRelativePath(this.definition.FILENAME)
        if (relativePath == undefined)
            throw new FileNotFoundError('Current scene is undefined!')

        const annFile = await this.engine.fileLoader.getANNFile(relativePath)
        console.debug(`File '${this.definition.FILENAME}' loaded successfully!`)
        return annFile
    }

    private initAnimatedSprite() {
        if (this.annFile === null) return

        this.sprite = new PIXI.Sprite()
        this.sprite.visible = this.definition.VISIBLE
        this.SETPRIORITY(this.definition.PRIORITY)

        this.engine.addToStage(this.sprite)

        if (this.definition.ONINIT) {
            this.engine.executeCallback(this, this.definition.ONINIT)
        }
    }

    getTextureFrom(imageIndex: number): Texture {
        if (this.textures.has(imageIndex)) {
            return this.textures.get(imageIndex)!
        }

        if (this.annFile == null) {
            throw new Error('Animation is not loaded yet!')
        }

        const baseTexture = PIXI.BaseTexture.fromBuffer(
            new Uint8Array(this.annFile.images[imageIndex]),
            this.annFile.annImages[imageIndex].width,
            this.annFile.annImages[imageIndex].height
        )

        const texture = new PIXI.Texture(baseTexture)
        this.textures.set(imageIndex, texture)

        return texture
    }

    ONTICK() {
        if (this.annFile === null || this.sprite === null) return

        const event = this.annFile.events.find(
            event => event.name.toUpperCase() === this.currentEvent
        )
        if (event) {
            this.tickAnimation(event)
        }
    }

    private tickAnimation(event: Event) {
        if (this.annFile === null || this.sprite === null) return

        const eventFrame = event.frames[this.currentFrameIdx]
        const imageIndex = event.framesImageMapping[this.currentFrameIdx]
        const annImage = this.annFile.annImages[imageIndex]

        this.currentFrameIdx += 1

        this.updateSprite(eventFrame, imageIndex, annImage)
        this.invokeIfAnimationCompleted(event)
        this.ONFRAMECHANGED()
    }

    private updateSprite(eventFrame: Frame, imageIndex: number, annImage: AnnImage) {
        //TODO: Sometimes this.sprite.transform === null
        if (this.sprite === null) return

        if (imageIndex != this.usingImageIndex) {
            this.usingImageIndex = imageIndex
            this.sprite.texture = this.getTextureFrom(imageIndex)
        }

        this.sprite.x = annImage.positionX + eventFrame.positionX
        this.sprite.y = annImage.positionY + eventFrame.positionY

        this.sprite.width = annImage.width
        this.sprite.height = annImage.height
    }

    private invokeIfAnimationCompleted(event: Event) {
        if (this.currentFrameIdx < event.framesCount) return

        if (this.currentLoop >= event.loopNumber) {
            this.STOP(false)
            this.ONFINISH()
        }

        this.currentLoop += 1
        this.currentFrameIdx = 0
    }

    private ONFINISH() {
        const index = this.currentEvent.toString()

        if (this.onFinished?.nonParametrized) {
            this.engine.executeCallback(this, this.onFinished.nonParametrized)
        }

        const paramCallback = this.onFinished?.parametrized.get(index.toString())
        if (paramCallback) {
            this.engine.executeCallback(this, paramCallback)
        }
    }

    private ONFRAMECHANGED() {
        if (this.onFrameChanged?.nonParametrized) {
            this.engine.executeCallback(this, this.onFrameChanged.nonParametrized)
        }

        const paramCallback = this.onFrameChanged?.parametrized.get(this.currentEvent)
        if (paramCallback) {
            this.engine.executeCallback(this, paramCallback)
        }
    }

    PLAY(name: string | number) {
        this.isPlaying = true
        this.currentFrameIdx = 0
        this.currentEvent = name.toString().toUpperCase()

        this.SHOW() //I noticed that play method should call show method
    }

    STOP(arg: boolean) {
        this.isPlaying = false
        this.currentFrameIdx = 0
    }

    PAUSE() {
        this.isPlaying = false
    }

    RESUME() {
        this.isPlaying = true
    }

    SETFRAME(frame: string) {
        this.currentEvent = frame
    }

    SETFPS(fps: number) {
        throw new NotImplementedError()
    }

    SHOW() {
        if (this.sprite === null) return

        this.sprite.visible = true
    }

    HIDE() {
        if (this.sprite === null) return
        this.sprite.visible = false
    }

    MOVE(xOffset: number, yOffset: number) {
        if (this.sprite === null) return

        this.sprite.x += xOffset
        this.sprite.y += yOffset
    }

    SETPOSITION(x: number, y: number) {
        if (this.sprite === null) return

        this.sprite.x = x
        this.sprite.y = y
    }

    SETPRIORITY(priority: number) {
        if (this.sprite === null) return

        this.sprite.zIndex = priority
        this.sprite.sortChildren()
    }

    SETASBUTTON(arg1: boolean, arg2: boolean) {
        throw new NotImplementedError()
    }

    GETCENTERX(): number {
        if (this.sprite == null) return 0
        return this.globalPosition.x + (this.sprite.width / 2)
    }

    GETCENTERY(): number {
        if (this.sprite == null) return 0
        return this.globalPosition.y + (this.sprite.height / 2)
    }

    GETPOSITIONX(): number {
        if (this.sprite == null) return 0
        return this.globalPosition.x
    }

    GETPOSITIONY(): number {
        if (this.sprite == null) return 0
        return this.globalPosition.y
    }

    GETFRAMENAME(): string {
        throw new NotImplementedError()
    }

    GETMAXWIDTH(): number {
        throw new NotImplementedError()
    }

    GETNOFINEVENT(): string {
        throw new NotImplementedError()
    }

    GETEVENTNAME(): string {
        throw new NotImplementedError()
    }

    GETFRAME(): string {
        throw new NotImplementedError()
    }

    GETCURRFRAMEPOSX(): number {
        throw new NotImplementedError()
    }

    GETCURRFRAMEPOSY(): number {
        throw new NotImplementedError()
    }

    CLONE(arg: number) {
        throw new NotImplementedError()
    }

    ISPLAYING(animName: string) {
        return this.isPlaying && this.currentEvent == animName
    }

    ISNEAR(objectName: string, arg: number) {
        throw new NotImplementedError()
    }

    private get globalPosition() {
        if (this.sprite === null) return new Point()
        return this.sprite.toGlobal(new Point(0, 0), undefined, true)
    }
}
