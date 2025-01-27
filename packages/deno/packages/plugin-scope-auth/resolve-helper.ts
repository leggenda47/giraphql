// @ts-nocheck
import { GraphQLResolveInfo } from 'https://cdn.skypack.dev/graphql?dts';
import { GiraphQLOutputFieldConfig, isThenable, MaybePromise, SchemaTypes } from '../core/index.ts';
import { ForbiddenError } from './errors.ts';
import RequestCache from './request-cache.ts';
import ResolveState from './resolve-state.ts';
import { ResolveStep } from './types.ts';
import { GiraphQLScopeAuthPlugin } from './index.ts';
const defaultUnauthorizedResolver = (root: unknown, args: unknown, context: unknown, info: GraphQLResolveInfo, error: ForbiddenError) => {
    throw error;
};
export function resolveHelper<Types extends SchemaTypes>(steps: ResolveStep<Types>[], plugin: GiraphQLScopeAuthPlugin<Types>, fieldConfig: GiraphQLOutputFieldConfig<Types>) {
    const unauthorizedResolver = fieldConfig.giraphqlOptions.unauthorizedResolver ?? defaultUnauthorizedResolver;
    return (parent: unknown, args: {}, context: Types["Context"], info: GraphQLResolveInfo) => {
        const state = new ResolveState(RequestCache.fromContext(context, plugin));
        function runSteps(index: number): MaybePromise<unknown> {
            for (let i = index; i < steps.length; i += 1) {
                const { run, errorMessage } = steps[i];
                const stepResult = run(state, parent, args, context, info);
                if (isThenable(stepResult)) {
                    return stepResult.then((result) => {
                        if (!result) {
                            return unauthorizedResolver(parent as never, args, context, info, new ForbiddenError(typeof errorMessage === "function"
                                ? errorMessage(parent, args, context, info)
                                : errorMessage));
                        }
                        return runSteps(i + 1);
                    });
                }
                if (!stepResult) {
                    return unauthorizedResolver(parent as never, args, context, info, new ForbiddenError(typeof errorMessage === "function"
                        ? errorMessage(parent, args, context, info)
                        : errorMessage));
                }
            }
            return state.resolveValue;
        }
        return runSteps(0);
    };
}
