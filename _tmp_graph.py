import json
from collections import defaultdict, deque, Counter

topo = json.load(open('website/config/world-topology.json', encoding='utf-8'))
places = {p['id']: p for p in topo['places']}
ids = set(places)

out = defaultdict(set)
inc = defaultdict(set)
bad = []
for pid, p in places.items():
    for target in p.get('connectsTo', []):
        if target not in ids:
            bad.append((pid, target))
            continue
        out[pid].add(target)
        inc[target].add(pid)

# reachability from entry
start = topo['entry']
seen = {start}
q = deque([start])
while q:
    cur = q.popleft()
    for nxt in out[cur]:
        if nxt not in seen:
            seen.add(nxt)
            q.append(nxt)

unreachable = sorted(ids - seen)
no_incoming = sorted(i for i in ids if not inc[i])

# one-way seams
oneway = sorted((a, b) for a in ids for b in out[a] if a not in out[b])

# cycles (simple detection via SCC)
def scc():
    index = {}
    low = {}
    onstack = {}
    stack = []
    result = []
    counter = [0]
    def strong(v):
        index[v] = low[v] = counter[0]
        counter[0] += 1
        stack.append(v)
        onstack[v] = True
        for w in out[v]:
            if w not in index:
                strong(w)
                low[v] = min(low[v], low[w])
            elif onstack.get(w):
                low[v] = min(low[v], index[w])
        if low[v] == index[v]:
            comp = []
            while True:
                w = stack.pop()
                onstack[w] = False
                comp.append(w)
                if w == v:
                    break
            if len(comp) > 1:
                result.append(sorted(comp))
    for v in sorted(ids):
        if v not in index:
            strong(v)
    return result

cycles = scc()

# echo not in outgoing edges
echo_gaps = []
for pid, p in places.items():
    r = p.get('returnsTo')
    if r and r not in out[pid]:
        echo_gaps.append((pid, r))

# degree
degree = sorted(((len(out[i]) + len(inc[i]), i, len(out[i]), len(inc[i])) for i in ids), reverse=True)

print('places', len(places), 'edges', sum(len(v) for v in out.values()))
print('unresolved targets', bad)
print('unreachable from entry', len(unreachable), unreachable)
print('no incoming', len(no_incoming), no_incoming)
print('one-way seams', len(oneway))
for a, b in oneway:
    print('  ', a, '->', b)
print('cycles', cycles)
print('echo gaps', len(echo_gaps), echo_gaps)
print('top degree:')
for d, i, o, incd in degree[:8]:
    print('  ', i, 'out', o, 'in', incd)

# containedBy sanity
bad_contain = [(pid, p['containedBy']) for pid, p in places.items() if p.get('containedBy') and p['containedBy'] not in ids]
print('bad containedBy', bad_contain)

# depth of canonical path
canon = topo['canonicalEntryPath']
print('canonical path edges present:')
for a, b in zip(canon, canon[1:]):
    print('  ', a, '->', b, b in out[a], '| echo', places[b].get('returnsTo') == a)

# which unreachable are in the ledger as canonical?
try:
    ledger = json.load(open('website/config/route-layers.json', encoding='utf-8'))
    by_route = {e['route']: e for e in ledger['routes']}
    print('unreachable ledger status:')
    for pid in unreachable:
        e = by_route.get(places[pid]['route'])
        if e:
            print('  ', pid, places[pid]['route'], e['status'], 'orphaned=' + str(e.get('orphaned', False)))
except FileNotFoundError:
    pass
