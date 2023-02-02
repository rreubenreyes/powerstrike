import logger from "./logger"
import * as errors from "./errors"

export interface Node<T1, T2 = T1> {
  name: string;
  handler: (params: T1) => T2;
  next: (prev: T2) => string | null;
  end: boolean;
}

export interface StateMachine<T1, T2 = T1> {
  current: Node<T1, T2>;
  states: {
    [index: string]: Node<T1, T2>;
  };
}

function construct<T1, T2 = T1>({ startAt, states }: { startAt: string; states: Node<T1, T2>[] }): StateMachine<T1, T2> {
  const initialState = states.find(s => s.name === startAt)
  if (!initialState) {
    throw new errors.ImplementationError(`invalid startAt: ${startAt}`)
  }

  return {
    current: initialState,
    states: states.reduce((acc: { [index: string]: Node<T1, T2> }, s) => {
      if (!s.next && !s.end) {
        throw new errors.ImplementationError(`invalid state: state with no outgoing edges must be an end state`)
      }
      acc[s.name] = s
      return acc
    }, {}),
  }
}

export function create<T1, T2>({ startAt, states }: { startAt: string; states: Node<T1, T2>[] }) {
  const stateMachine = construct({ startAt, states })

  return {
    next: (params: T1) => {
      try {
        const result = stateMachine.current.handler(params)
        const nextState = stateMachine.current.next(result)
        if (nextState) {
          stateMachine.current = stateMachine.states[nextState]
        }
        return { result, done: stateMachine.current.end }
      } catch (err) {
        const msg = "error in state machine handler"
        logger.error({ err, state: stateMachine.current }, msg)
        throw new errors.ImplementationError(msg, {
          info: { state: stateMachine.current }
        })
      }
    },
    done: () => stateMachine.current.end,
  }
}
