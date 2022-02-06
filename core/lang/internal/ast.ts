import * as errors from "./errors"

class Node {
  public kind: string
  private root: Node | null
  private children: Node[] = []

  constructor(kind: string, root: Node | null) {
    this.kind = kind
    this.root = root
  }

  head(): Node {
    if (this.root === null) {
      throw new errors.ImplementationError("unexpected head() call at AST root")
    }

    return this.root
  }

  child(index: number): Node {
    return this.children[index]
  }

  protected addChild(child: Node): void {
    this.children.push(child)
  }

  getChildren(): Node[] {
    return this.children
  }

  firstChild(): Node {
    return this.children[0]
  }

  lastChild(): Node {
    return this.children[this.children.length - 1]
  }
}

export class RootNode extends Node {
  constructor() {
    super("root", null)
  }
}

class ChildNode extends Node {
  constructor(kind: string, root: Node | null) {
    super(kind, root)
    super.addChild(this)
  }
}

export class AnonymousStructNode extends ChildNode {
  public fields: ChildNode[] = []

  constructor(kind: string, root: Node | null) {
    super(kind, root)
    super.addChild(this)
  }
}
