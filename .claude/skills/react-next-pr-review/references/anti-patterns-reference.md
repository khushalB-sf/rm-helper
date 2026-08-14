# Anti-Patterns & Non-Flag Zones Reference

The "what to check for / what never to flag" lookup tables for the `react-next-pr-review` skill.
Use alongside `review-methodology.md` (the phases and version-gating rules that decide *whether* a
pattern here even applies to the detected stack).

## Non-Flag Zones (never flag — flagging these erodes trust)

| Pattern | Why it's fine |
|---|---|
| Pre-existing issues in unchanged code | Out of scope — review the PR's diff only |
| `console.log` in test/dev-only files | Expected there |
| TODO/FIXME with a ticket reference | Tracked, not forgotten |
| `index` key in documented never-reorder static lists | Intentional and correct |
| `any` with eslint-disable + stated reason | Acknowledged tech debt |
| Components <150 lines | Normal size |
| Inline styles for genuinely dynamic values | Correct usage |
| `forwardRef` in React <19 | Required API in those versions |
| `getServerSideProps`/`getStaticProps` in Pages Router | Correct API for that router |
| `useEffect` data fetching in React <18 / client-only apps | Suspense for data wasn't stable |
| PropTypes absence in TS | Redundant with types |
| Tailwind config absence in v4 | Intentional v4 paradigm |
| Default-export absence in lib/util files | Named exports preferred there |
| Nested ternaries in JSX | Minor note maximum — style preference |
| `'use client'` on genuinely interactive leaf components | Correct usage |
| Single-letter vars in short arrows (`.map(x => x.id)`) | Clear in context |
| Class components in class-based codebases | Valid pattern |
| Class error boundaries (even React 19) | Only way to implement them |
| `componentDidMount`/`componentWillUnmount` | Correct lifecycle usage |
| `PureComponent`; `setState` updater fn; constructor binding | Valid class patterns |
| `REACT_APP_*` in CRA; `import.meta.env.VITE_*` & `import.meta.hot` in Vite | Correct per build tool |
| HOCs for auth/layout/analytics, single wrapping, or in legacy | Valid cross-cutting pattern |
| `any` with `@ts-expect-error` + clear comment | Acknowledged workaround |
| Inferred return types on simple functions | Explicit types not required |
| `React.FC` in consistent older codebases | Valid if consistent |
| Simple custom hooks returning plain values | Don't need `{data,loading,error}` |
| String enums where used consistently | Team convention |

## Anti-Patterns Quick Reference

Calibration — detect the pattern, confirm it's invalid for the detected version, suggest the
version-appropriate fix. (Examples reference current versions; apply the same reasoning to newer
ones.)

| # | Anti-pattern | Fix |
|---|--------------|-----|
| 1 | Inline object/array/fn in JSX → memoized child | Hoist or `useMemo`/`useCallback` (skip if React Compiler) |
| 2 | Missing `useEffect` deps → stale closure | Include all deps used inside the effect |
| 3 | Prop drilling through many levels | Context provider (`<Ctx value>` in React 19) |
| 4 | Derived state via `useState`+`useEffect` | Compute during render (or `useMemo` if expensive) |
| 5 | Async setState after unmount | `AbortController` + cleanup in effect return |
| 6 | `index` as key in dynamic list | Stable unique id (`item.id`) |
| 7 | Missing error boundaries | Wrap subtree in an `ErrorBoundary` (class) |
| 8 | Inline `onClick={() => handle(id)}` in lists | Extract a child component taking `item` + handler |
| 9 | `useEffect` doing event-handler work | Move logic into the event handler |
| 10 | Premature memoization of trivial values | Compute inline |
| 10a | Pure calc fn / constant (regex, lookup map, config) defined inside component | Hoist outside the component (module scope) — no deps on props/state |
| 11 | Browser API in Server Component (App Router) | Add `'use client'` |
| 12 | Client `useEffect` fetch when a Server Component fits | Fetch in async Server Component (zero client JS) |
| 13 | Next 15 sync `params`/`searchParams`/`cookies()` access | `await` them; type `params` as `Promise<…>`. **Major** — deprecated (warns) in 15.x, may be a runtime error in future versions |
| 14 | `<Ctx.Provider>` in React 19 | Optional `<Ctx value>` shorthand (don't flag existing) |
| 15 | Tailwind v3 `tailwind.config.js` in a v4 project | `@import "tailwindcss"` + `@theme {}` |
| 16 | Class: subscriptions/timers without cleanup | Clean up in `componentWillUnmount` |
| 17 | Class: `setState({x: this.state.x+1})` | Updater fn `setState(prev => …)` |
| 18 | Class: `componentDidUpdate` without guard → loop | Guard `if (prevProps.x !== this.props.x)` |
| 19 | Class: `.bind`/arrow in `render()` | Bind in constructor or class-property arrow |
| 20 | Class: deprecated `componentWill*` | `getDerivedStateFromProps`/`getSnapshotBeforeUpdate`/`componentDidMount`. **Major** in React 18+ — `UNSAFE_`-prefixed since 16.3, removed in StrictMode |
| 21 | Vite: `process.env.REACT_APP_*` | `import.meta.env.VITE_*` / `import.meta.env.DEV` |
| 22 | Raw `fetch` + hardcoded URL/auth in component | Extract a typed service layer |
| 23 | `any` on API response | Define response `interface` (or `unknown` + type guard) |
| 24 | `useState(null)`/`useState([])` mis-inferred | Explicit generic `useState<User\|null>(null)` |
| 25 | Multiple boolean status flags | Discriminated union `{ status: … }` |
| 26 | Event handler typed `any`/`Event` | Specific `React.*Event<HTMLElement>` |
| 27 | Re-defining subsets of a type by hand | `Pick`/`Omit`/`Partial`/`Record` |
| 28 | HOC created inside render | Apply HOC at module level |
| 29 | HOC missing `displayName` | `WithX.displayName = \`withX(${Component.name})\`` |
| 30 | Custom hook swallows loading/error | Return `{ data, isLoading, error, refetch }` |
| 31 | Custom hook with hardcoded endpoint | Accept URL/options as parameters |
| 32 | Handler/effect receives an event but never acts on it (stub disguised as done) | Confirm it actually updates state / calls the mutation the diff claims to add — flag as a functional gap, not a style nit |

### Expanded examples (use these full before/after blocks for the complex cases)

For the non-obvious patterns below, include the corresponding before/after in the finding.

**#5 — Async state update after unmount (race / leak):**
```tsx
// BAD
useEffect(() => { fetchData().then(setData); }, []);
// GOOD — abort on unmount
useEffect(() => {
  const controller = new AbortController();
  fetchData({ signal: controller.signal })
    .then(setData)
    .catch(err => { if (err.name !== 'AbortError') throw err; });
  return () => controller.abort();
}, []);
```

**#12 — Client `useEffect` fetch where a Server Component fits (Next.js App Router):**
```tsx
// BAD — 'use client' + useEffect just to fetch
'use client';
function UserList() {
  const [users, setUsers] = useState([]);
  useEffect(() => { fetch('/api/users').then(r => r.json()).then(setUsers); }, []);
  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}
// GOOD — async Server Component, zero client JS
export default async function UserList() {
  const users: User[] = await fetch('https://api.example.com/users').then(r => r.json());
  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}
```

**#13 — Next.js 15 async dynamic APIs:**
```tsx
// BAD — sync params (deprecated in 15.x)
export default function Page({ params }: { params: { id: string } }) { return <div>{params.id}</div>; }
// GOOD — params is a Promise
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <div>{id}</div>;
}
```

**#25 — Boolean flags → discriminated union (impossible states):**
```tsx
// BAD — can be loading AND error at once
interface State { isLoading: boolean; isError: boolean; data: User[] | null; error: string | null; }
// GOOD
type State =
  | { status: 'idle' } | { status: 'loading' }
  | { status: 'success'; data: User[] } | { status: 'error'; error: string };
```

**#28/#29 — HOC created in render / missing `displayName`:**
```tsx
// BAD — new component type every render → full remount; no DevTools name
function Parent() { const Enhanced = withAuth(Child); return <Enhanced />; }
// GOOD — apply at module level + set displayName
const Enhanced = withAuth(Child);
function withAuth<T extends { user: User }>(Component: React.ComponentType<T>) {
  const WithAuth: React.FC<Omit<T, 'user'>> = (props) => {
    const { user } = useAuth();
    return user ? <Component {...(props as T)} user={user} /> : <Redirect to="/login" />;
  };
  WithAuth.displayName = `withAuth(${Component.displayName || Component.name || 'Component'})`;
  return WithAuth;
}
```

**#30 — Custom hook that swallows loading/error:**
```tsx
// GOOD — expose full state + controls
function useFetchUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const refetch = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setUsers(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally { setIsLoading(false); }
  }, []);
  useEffect(() => { refetch(); }, [refetch]);
  return { users, isLoading, error, refetch };
}
```

**#32 — Handler that receives an event but never applies it:**
```js
// BAD — looks complete, compiles fine, does nothing with the update
socket.onmessage = (event) => {
  console.log('order update', event.data);
};
// GOOD — actually applies the update the feature claims to deliver
socket.onmessage = (event) => {
  const update = JSON.parse(event.data);
  setOrders((prev) => mergeOrderUpdate(prev, update));
};
```

**#16 — Class component missing cleanup:**
```jsx
componentDidMount() {
  this.sub = eventBus.subscribe('status', this.handleStatus);
  this.timer = setInterval(this.poll, 5000);
}
componentWillUnmount() {          // BAD if omitted → leak
  this.sub.unsubscribe();
  clearInterval(this.timer);
}
```
