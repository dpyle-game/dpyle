import discord
from discord.ext import commands, tasks
import inspect
import random
import json

def get_names(d):
    try:
        t = inspect.getsource(d)
    except TypeError:
        return
    if hasattr(d, "__all__"):
        yield from d.__all__
        return
    for name, m in inspect.getmembers(d, inspect.ismodule):
        end = m.__name__.rsplit('.', 1)[-1]
        if end not in t:
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

l = []
l.append("discord")
l.extend(get_names(discord))
l.append("ext")
l.append("commands")
l.extend(get_names(commands))
l.append("tasks")
l.extend(get_names(tasks))
l = list(set(l))
random.shuffle(l)

existing = ["slug"]
for s in existing[::-1]:
    l.remove(s)
    l.insert(0, s)

with open("data.js", "w") as f:
    f.write("const answers = ")
    json.dump(l, f)
    f.write("\n")
