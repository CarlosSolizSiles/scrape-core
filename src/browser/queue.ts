import type { Post } from "./extract/post.js";

type Task = {
  data: {
    kb: number;
    chars: string;
    innerText: string;
    innerHTML: string;
  };
} & Post;

export class AsyncQueue<T> {
  private items: T[] = [];
  private waiters: ((value: T) => void)[] = [];

  push(item: T) {
    const waiter = this.waiters.shift();

    if (waiter) {
      waiter(item);
      return;
    }

    this.items.push(item);
  }

  async pop(): Promise<T> {
    const item = this.items.shift();

    if (item) {
      return item;
    }

    return new Promise<T>((resolve) => {
      this.waiters.push(resolve);
    });
  }
}

export const queue = new AsyncQueue<Task>();
