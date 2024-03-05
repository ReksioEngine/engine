import {Type} from './index'
import {EpisodeDefinition} from '../../fileFormats/cnv/types'
import {Engine} from '../index'
import {NotImplementedError} from '../../utils'

export class Episode extends Type<EpisodeDefinition> {
    constructor(engine: Engine, definition: EpisodeDefinition) {
        super(engine, definition)
    }

    start() {
        this.GOTO(this.definition.STARTWITH)
    }

    async GOTO(sceneName: string) {
        if (this.definition.SCENES.includes(sceneName)) {
            await this.engine.changeScene(sceneName)
        }
    }

    BACK() {
        throw new NotImplementedError()
    }
}
