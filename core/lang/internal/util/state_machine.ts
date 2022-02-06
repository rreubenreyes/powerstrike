import logger from "./logger"
import * as errors from "./errors"

export interface Node {
  name: string;
  handler: <T1, T2>(params: T1) => T2;
  next: <T1>(prev: T1) => string | null;
  end: boolean;
}

export interface StateMachine {
  current: Node;
  states: {
    [index: string]: Node;
  };
}

function executeHandler<T1, T2>(stateMachine: StateMachine, params: T1) {
  try {
    const result = stateMachine.current.handler(params) as T2
    return result
  } catch (err) {
    const msg = "error in state machine handler"
    logger.error({ err, state: stateMachine.current }, msg)
    throw new errors.ImplementationError(msg, {
      info: { state: stateMachine.current }
    })
  }
}

function construct({ startAt, states }: { startAt: string; states: Node[] }): StateMachine {
  const initialState = states.find(s => s.name === startAt)
  if (!initialState) {
    throw new errors.ImplementationError(`invalid startAt: ${startAt}`)
  }

  return {
    current: initialState,
    states: states.reduce((acc: StateMachine["states"], s) => {
      if (!s.next && !s.end) {
        throw new errors.ImplementationError(`invalid state: state with no outgoing edges must be an end state`)
      }
      acc[s.name] = s
      return acc
    }, {}),
  }
}

export function create({ startAt, states }: { startAt: string; states: Node[] }) {
  const stateMachine = construct({ startAt, states })
  return {
    next: <T1, T2>(params: T1) => {
      const result = executeHandler(stateMachine, params) as T2
      const nextState = stateMachine.current.next(result)
      if (nextState) {
        stateMachine.current = stateMachine.states[nextState]
      }
      return { result, done: stateMachine.current.end }
    },
    done: () => stateMachine.current.end,
  }
}
