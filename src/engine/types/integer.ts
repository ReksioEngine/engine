import {Type} from './index'
import {Engine} from '../index'
import {callback, IntegerDefinition} from '../../fileFormats/cnv/types'

export class Integer extends Type<IntegerDefinition> {
    value: number
    private readonly onChanged: Record<number, callback>

    constructor(engine: Engine, definition: IntegerDefinition) {
        super(engine, definition)
        this.value = this.definition.VALUE
        this.onChanged = this.definition.ONCHANGED
    }

    INC() {
        this.value++
        this.ONCHANGED()
    }

    DEC() {
        this.value--
        this.ONCHANGED()
    }

    ADD(value: number) {
        this.value += value
        this.ONCHANGED()
    }

    SUB(value: number) {
        this.value -= value
        this.ONCHANGED()
    }

    MUL(value: number) {
        this.value *= value
        this.ONCHANGED()
    }

    DIV(value: number) {
        this.value /= value
        this.ONCHANGED()
    }

    MOD(value: number) {
        this.value %= value
        this.ONCHANGED()
    }

    CLAMP(min: number, max: number) {
        this.value = Math.min(max, Math.max(this.value, min))
        this.ONCHANGED()
    }

    SET(newValue: number) {
        this.value = newValue
        this.ONCHANGED()
    }

    private ONCHANGED() {
        if (this.onChanged && Object.prototype.hasOwnProperty.call(this.onChanged, this.value)) {
            this.engine.executeCallback(this, this.onChanged[this.value])
        }

        if (this.definition.TOINI) {
            // Update in the save file
        }
    }
}
