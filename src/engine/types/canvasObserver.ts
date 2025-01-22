import { DisplayType, Type } from './index'
import { CanvasObserverDefinition } from '../../fileFormats/cnv/types'
import { loadTexture } from '../assetsLoader'
import { Point } from 'pixi.js'
import { method } from '../../types'
import { AdvancedSprite } from '../rendering'
import { assert } from '../../errors'

export class CanvasObserver extends Type<CanvasObserverDefinition> {
    @method()
    async SETBACKGROUND(filename: string) {
        const relativePath = this.engine.currentScene?.getRelativePath(filename)
        const texture = await loadTexture(this.engine.fileLoader, relativePath!)
        if (texture == null) {
            throw new Error(`Cannot load image '${filename}'`)
        }

        this.engine.canvasBackground.texture = texture
    }

    @method()
    REFRESH() {}

    @method()
    GETGRAPHICSAT(
        x: number,
        y: number,
        onlyVisible: boolean = false,
        minZ: number = Number.MIN_SAFE_INTEGER,
        maxZ: number = Number.MAX_SAFE_INTEGER,
        includeAlpha: boolean = false
    ) {
        const point = new Point(x, y)

        for (let i = this.engine.app.stage.children.length - 1; i >= 0; i--) {
            const renderObject = this.engine.app.stage.children[i]
            if (!(renderObject instanceof AdvancedSprite)) {
                continue
            }

            if (onlyVisible && !renderObject.visible) {
                continue
            }

            const position = renderObject.getGlobalPosition()
            if (position === null) {
                continue
            }

            let containsPoint = false
            if (includeAlpha) {
                containsPoint = renderObject.containsPoint(point)
            } else {
                containsPoint =
                    point.x > position.x &&
                    point.x < position?.x + renderObject.width &&
                    point.y > position.y &&
                    point.y < position.y + renderObject.height
            }

            if (containsPoint && renderObject.zIndex >= minZ && renderObject.zIndex <= maxZ) {
                const object = Object.values(this.engine.scope).find(
                    (obj) => obj instanceof DisplayType && obj.getRenderObject() === renderObject
                )
                if (object === undefined) {
                    continue
                }
                return object.name
            }
        }

        return null
    }
}
