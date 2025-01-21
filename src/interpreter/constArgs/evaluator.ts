import ReksioLangParser, { BoolContext, IdentifierContext, MethodCallArgumentsContext, NumberContext, StringContext } from '../script/ReksioLangParser'
import ReksioLangLexer from '../script/ReksioLangLexer'
import antlr4 from 'antlr4'
import ReksioLangVisitor from '../script/ReksioLangVisitor'
import { ForceNumber } from '../../types'

export class ConstantArgsEvaluator extends ReksioLangVisitor<any> {
    visitIdentifier = (ctx: IdentifierContext): any => {
        return ctx.IDENTIFIER().getText()
    }

    visitMethodCallArguments = (ctx: MethodCallArgumentsContext): any => {
        return this.visitChildren(ctx)
    }

    visitBool = (ctx: BoolContext): any => {
        return ctx.TRUE() !== null
    }

    visitNumber = (ctx: NumberContext): any => {
        return ForceNumber(ctx.getText())
    }

    visitString = (ctx: StringContext): any => {
        return ctx.STRING().getText().replace(/^"|"$/g, '')
    }
}

export const parseConstantArgs = (argsString: string) => {
    const lexer = new ReksioLangLexer(new antlr4.CharStream(argsString))
    const tokens = new antlr4.CommonTokenStream(lexer)
    const parser = new ReksioLangParser(tokens)
    const tree = parser.methodCallArguments()
    return tree.accept(new ConstantArgsEvaluator())
}
