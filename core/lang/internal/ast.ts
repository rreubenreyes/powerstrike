import * as errors from "./errors"

class Node {
  public kind: string
  private root: Node | null
  protected children: Node[] = []

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

  getRoot(): Node | null {
    return this.root
  }

  child(index: number): Node {
    return this.children[index]
  }

  public addChild(child: Node): void {
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
    this.head().addChild(this)
  }
}

export class IdentifierNode extends ChildNode {}

class BinaryChildNode extends Node {
  private left: Node
  private right: Node

  getLeft(): ChildNode {
    return this.left
  }

  getRight(): ChildNode {
    return this.right
  }

  constructor(kind: string, left: Node, right: Node, root: Node | null) {
    super(kind, root)
    this.head().addChild(this)

    this.left = left
    this.right = right
  }
}

export class BinaryOperationNode extends BinaryChildNode {
  constructor(kind: string, left: Node, right: Node, root: Node | null) {
    super(kind, left, right, root)
    this.head().addChild(this)
  }
}

export class AnonymousStructNode extends ChildNode {
  protected children: BinaryOperationNode[] = []

  getChildren(): BinaryOperationNode[] {
    return this.children
  }

  firstChild(): BinaryOperationNode {
    return this.children[0]
  }

  lastChild(): BinaryOperationNode {
    return this.children[this.children.length - 1]
  }

  constructor(kind: string, root: Node | null) {
    super(kind, root)
    this.head().addChild(this)
  }
}
