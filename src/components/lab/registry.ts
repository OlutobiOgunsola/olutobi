import type { ComponentType } from "react";
import { demos as patternDemos } from "@/components/demos/registry";
import { BitsetDemo, BloomDemo, HashTableDemo, LruDemo, TrieDemo } from "./ds/Lookup";
import { DynamicArrayDemo, LinkedListDemo, QueueDemo, RingBufferDemo, StackDemo } from "./ds/Linear";
import { BstDemo, GraphDemo, HeapDemo, UnionFindDemo } from "./ds/Trees";
import { BigODemo, MemoDemo } from "./ds/Complexity";
import { JwtDemo, PasswordHashDemo, SaltDemo } from "./security/Crypto";
import { DebounceDemo } from "./web/Debounce";

/** Hand-built demos, referenced from lab content by `{ kind: "custom", key }`. */
export const customDemos: Record<string, ComponentType> = {
  ...patternDemos,
  "dynamic-array": DynamicArrayDemo,
  stack: StackDemo,
  queue: QueueDemo,
  "ring-buffer": RingBufferDemo,
  "linked-list": LinkedListDemo,
  "hash-table": HashTableDemo,
  bst: BstDemo,
  heap: HeapDemo,
  trie: TrieDemo,
  lru: LruDemo,
  bloom: BloomDemo,
  bitset: BitsetDemo,
  "union-find": UnionFindDemo,
  graph: GraphDemo,
  "big-o": BigODemo,
  memo: MemoDemo,
  "password-hash": PasswordHashDemo,
  salt: SaltDemo,
  jwt: JwtDemo,
  debounce: DebounceDemo,
};
