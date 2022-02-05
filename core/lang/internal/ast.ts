class Node {
  public kind: string
  public root: Node | null
  public children: Node[] = []

  constructor(kind: string, root: Node | null) {
    this.kind = kind
    this.root = root
  }

  isRoot(): boolean {
    return this.root === null
  }

  head(): Node {
    if (this.root === null) {
      return this
    }

    return this.root
  }

  addChild(node: Node): void {
    this.children.push(node)
  }
}

export class RootNode extends Node {
  constructor() {
    super("root", null)
  }
}

export class StructFieldNode extends Node {
  constructor(kind: string, root: Node | null) {
    super(kind, root)
  }
}

export class AnonymousStructNode extends Node {
  public fields: StructFieldNode[] = []

  constructor(kind: string, root: Node | null) {
    super(kind, root)
  }
}
