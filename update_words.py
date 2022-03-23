import discord
import inspect
import random
import json

t = inspect.getsource(discord)

def get_names(d):
    for _, m in inspect.getmembers(d, inspect.ismodule):
        end = m.__name__.rsplit('.', 1)[-1]
        if f"from .{end}" not in t:
            continue
        yield end
        try:
            for n in m.__all__:
                yield n.lower()
                for name, _ in inspect.getmembers(getattr(m, n)):
                    if name.startswith("_") or not any(map(str.islower, name)) or not all(x.isalpha() or x == "_" for x in name):
                        continue
                    yield name
        except AttributeError:
            yield from get_names(m)

l = list(set(get_names(discord)))
l.append("discord")
random.shuffle(l)

with open("data.js", "w") as f:
    f.write("const answers = ")
    json.dump(l, f)
    f.write("\n")
