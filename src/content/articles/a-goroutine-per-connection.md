---
title: A Goroutine Per Connection: Notes From a Node Developer Learning Go
summary: I've written JavaScript for years. Building a small TCP chat server in Go showed me a lot about what Node does for me behind the scenes.
date: 2026-11-03
order: 9
tags: Go, Concurrency, Learning in public
---

Think about a buka where one woman takes every order, dishes every plate and collects every payment. She can serve twenty customers at once because she never stands still waiting for any one of them. While your amala is being dished, she has already moved on to the next person.

Now think about a restaurant where every table has its own waiter. The waiter stays with you while you decide. If you take five minutes, the waiter waits five minutes, and nobody else is affected because every other table has its own waiter too.

Node.js works like the buka. Go lets you work like the restaurant, and in Go the waiters are very cheap.

I have used Node for years, and I recently started learning Go properly by rebuilding small Unix tools and a TCP chat server. These are my notes so far.

In this article, you will learn

- How Node and Go each handle many connections at once.
- How to write a concurrent TCP server in Go with only the standard library.
- What a goroutine is, and why one per connection is fine.
- How to broadcast messages between clients with channels instead of locks.
- What stood out to me coming from JavaScript.

## HOW NODE DOES IT

In Node, your JavaScript runs on a single thread. To handle thousands of connections, Node makes sure that thread never waits. Anything slow, like reading from a socket, reading a file or calling a database, is handed off, and your callback runs (or your promise resolves) when it's done.

```js
const net = require("net");

net.createServer((socket) => {
  socket.on("data", (chunk) => socket.write(chunk)); // echo back
}).listen(9001);
```

This works very well and scales a long way. The one rule is that you must never block the thread. If one synchronous loop takes 200ms, every connection on that server freezes for 200ms. In buka terms, the woman has stopped to count change and the whole queue is waiting.

## HOW GO DOES IT

Here is the same echo server in Go. This was the first version of `gosh-chat`:

```go
package main

import (
	"fmt"
	"net"
)

func handleConnection(conn net.Conn) {
	defer conn.Close()

	buf := make([]byte, 1024)
	for {
		n, err := conn.Read(buf) // this blocks, and that's fine
		if n > 0 {
			if _, werr := conn.Write(buf[:n]); werr != nil {
				return
			}
		}
		if err != nil {
			return // client disconnected (io.EOF) or the read failed
		}
	}
}

func main() {
	listener, err := net.Listen("tcp", ":9001")
	if err != nil {
		fmt.Println("listen error:", err)
		return
	}
	defer listener.Close()

	for {
		conn, err := listener.Accept()
		if err != nil {
			continue
		}
		go handleConnection(conn) // a new goroutine for every client
	}
}
```

Look at `conn.Read(buf)`. It blocks until the client sends something. In Node that would freeze the server. In Go it's the normal way to write code.

The important part is the `go` keyword in front of `handleConnection(conn)`. It starts a **goroutine**, which is a function running at the same time as everything else. Every client gets its own goroutine (its own waiter), and while one goroutine is waiting for its client, the Go runtime runs other goroutines.

> IN NODE YOU MUST NEVER WAIT. IN GO YOU CAN WAIT AS MUCH AS YOU LIKE, AS LONG AS EACH CLIENT WAITS IN ITS OWN GOROUTINE.

## ISN'T ONE THREAD PER CONNECTION EXPENSIVE?

That was my first question too. Operating system threads are expensive. Each one reserves a large stack, and switching between them costs time, so a server with ten thousand OS threads will struggle.

Goroutines are not OS threads. Each one starts with a small stack of a few kilobytes that only grows when needed, and the Go runtime spreads thousands of them across a handful of real threads. Underneath, Go uses the same kind of efficient network polling that Node uses. The difference is that Go hides it and lets you write simple, blocking code from top to bottom.

So you get roughly the efficiency of the buka with the simplicity of having a waiter per table.

## FROM ECHO TO CHAT

An echo server only talks back to the person who sent the message. The next version of `gosh-chat`, which I'm working on now, needs to send every message to everyone. That means many goroutines need access to the same list of connected clients, and shared state like that is where concurrency bugs usually come from.

Coming from Node, my first thought was to push clients into an array, since everything runs on one thread anyway. In most languages, the usual answer is to protect the list with a mutex. Go encourages a different approach:

> DO NOT COMMUNICATE BY SHARING MEMORY; SHARE MEMORY BY COMMUNICATING.

Instead of letting every goroutine touch the client list, one goroutine (the hub) owns it, and the others send it messages through channels:

```go
type hub struct {
	join      chan net.Conn
	leave     chan net.Conn
	broadcast chan []byte
}

func (h *hub) run() {
	clients := map[net.Conn]bool{} // only this goroutine ever touches it

	for {
		select {
		case c := <-h.join:
			clients[c] = true
		case c := <-h.leave:
			delete(clients, c)
			c.Close()
		case msg := <-h.broadcast:
			for c := range clients {
				c.Write(msg) // a slow client can hold this up; per-client queues come next
			}
		}
	}
}
```

Each connection's goroutine now just reads messages and passes them to the hub:

```go
func (h *hub) serve(conn net.Conn) {
	h.join <- conn
	defer func() { h.leave <- conn }()

	buf := make([]byte, 1024)
	for {
		n, err := conn.Read(buf)
		if n > 0 {
			msg := make([]byte, n)
			copy(msg, buf[:n]) // buf gets reused on the next read, so send a copy
			h.broadcast <- msg
		}
		if err != nil {
			return
		}
	}
}
```

And `main` starts the hub once and gives it every new connection:

```go
h := &hub{join: make(chan net.Conn), leave: make(chan net.Conn), broadcast: make(chan []byte)}
go h.run()
// ...inside the accept loop:
go h.serve(conn)
```

There's no mutex. The map can't be read and written at the same time because only the hub goroutine ever uses it. The `select` statement handles one message at a time, like a single waiter taking one order at a time.

The `copy` line is easy to miss, but it matters. `buf[:n]` is a slice, which points at the same underlying array as `buf`. If you send it straight to the channel, the hub and the reading goroutine share that memory. By the time the hub broadcasts the message, the connection may already have read the next message into the same buffer, and people would see mixed-up text. A single-threaded Node program can't produce that kind of bug.

## WHAT STOOD OUT TO ME

1. **Errors are values.** There's no `try/catch`. Functions return an `error` and you handle it right where it happens. It looks repetitive at first, but every place that can fail is visible in the code.
2. **Blocking is normal.** In Node I learned never to block. In Go, blocking inside a goroutine is the expected way to write code.
3. **The standard library goes a long way.** `net`, `bufio`, `os` and `io` have covered everything so far. I haven't added a single dependency.
4. **Interfaces are small and implicit.** My `gosh` tool runs commands through a one-method `Executable` interface. Any type with an `Execute() error` method satisfies it, without an `implements` keyword.
5. **It helped my Node code.** Understanding what the event loop protects me from has made me more careful about what I put on it.

## WHAT I'M WORKING ON NEXT

I'm learning this in public, and the next steps are:

- Give each client its own buffered outgoing channel, so one slow client can't hold up the broadcast for everyone else.
- Use `bufio.Scanner` to read full lines instead of raw 1KB chunks.
- Shut down cleanly with `context` and signal handling.
- Add named rooms.
- Benchmark it against the same server written in Node, to see where each one starts to struggle.

Both the buka and the restaurant feed people well. They just organise the work differently, and learning how Go does it has helped me understand Node better.
