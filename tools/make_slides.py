#!/usr/bin/env python3
"""Build the Slides player: slides.html, slides/<chapter id>.js and slides-index.js (all build output, not committed).

Sources: src/slides/<chapter id>/narration.json + src/slides/<chapter id>/compositions/<scene id>.html, player shell
src/slides/player.tpl.html, chapter list and numbering from the handbook (tools/list_chapters.js).
There is no voice-over: each narration line gets a reading time from its length, and those times drive the scene
timelines the same way cues.json does for the course videos. The player lists every chapter and loads a chapter's
scenes from slides/<id>.js when it is opened, so the page stays small as chapters are added.

Usage: python3 tools/make_slides.py            (build.sh runs it)
"""
import json, os, re, subprocess, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SLIDES = os.path.join(ROOT, "src", "slides")
LEAD, GAP, TAIL = 0.3, 0.0, 0.9  # seconds before the first line / between lines / after the last line


def read_time(text):
    """Seconds to read one caption line and watch its animation."""
    n = len(re.sub(r"\s", "", text))
    return round(min(max(1.6 + n * 0.17, 4.0), 10.0), 2)


def chapters():
    tmp = tempfile.mktemp(suffix=".json")
    subprocess.check_call(["node", os.path.join(ROOT, "tools", "list_chapters.js"), ROOT, tmp])
    ch = json.load(open(tmp, encoding="utf-8"))
    os.remove(tmp)
    mods = {c["mod"]: c["title"] for c in ch if c["sub"] == 0}
    return [{"id": c["id"], "code": c["code"], "title": c.get("nav") or c["title"], "group": mods.get(c["mod"], c["mod"])}
            for c in ch]


def scene(ch, sc):
    path = os.path.join(SLIDES, ch, "compositions", sc["id"] + ".html")
    t, cues = LEAD, []
    for text in sc["lines"]:
        d = read_time(text)
        cues.append([round(t, 2), round(t + d, 2)])
        t += d + GAP
    dur = round(t - GAP + TAIL, 2)
    if not os.path.exists(path):
        raise SystemExit(f"missing scene file {path}")
    src = open(path, encoding="utf-8").read()
    inner = src[src.index("<template>") + 10: src.rindex("</template>")]
    sid = f"S-{ch}-{sc['id']}"
    if "/*CUES*/{}/*END*/" not in inner:
        raise SystemExit(f"{path}: no /*CUES*/{{}}/*END*/ placeholder")
    inner = (inner.replace("/*CUES*/{}/*END*/", json.dumps({"L": cues, "d": dur}))
                  .replace('id="root"', f'id="{sid}"').replace("#root", "#" + sid))
    inner = re.sub(r'data-duration="[\d.]+"', f'data-duration="{dur}"', inner, count=1)
    js = "\n".join(re.findall(r"<script>(.*?)</script>", inner, re.S))
    html = re.sub(r"<script>.*?</script>", "", inner, flags=re.S).strip()
    return {"id": sc["id"], "title": sc.get("title", sc["id"]), "d": dur,
            "lines": [[c[0], c[1], x] for c, x in zip(cues, sc["lines"])], "html": html, "js": js}


def safe(obj):
    return json.dumps(obj, ensure_ascii=False).replace("</", "<\\/").replace("<!--", "<\\u0021--")


def main():
    chs = chapters()
    os.makedirs(os.path.join(ROOT, "slides"), exist_ok=True)
    for f in os.listdir(os.path.join(ROOT, "slides")):
        os.remove(os.path.join(ROOT, "slides", f))
    idx, pages, secs = {}, 0, 0.0
    for c in chs:
        n = os.path.join(SLIDES, c["id"], "narration.json")
        if not os.path.exists(n):
            continue
        nar = json.load(open(n, encoding="utf-8"))
        scenes = [scene(c["id"], s) for s in nar["scenes"]]
        c["deck"] = nar.get("title", c["title"])
        c["pages"] = sum(len(s["lines"]) for s in scenes)
        open(os.path.join(ROOT, "slides", c["id"] + ".js"), "w", encoding="utf-8").write(
            f"SLIDES_LOADED({json.dumps(c['id'])},{safe(scenes)});\n")
        idx[c["id"]] = {"pages": c["pages"]}
        pages += c["pages"]
        secs += sum(s["d"] for s in scenes)
    tpl = open(os.path.join(SLIDES, "player.tpl.html"), encoding="utf-8").read()
    open(os.path.join(ROOT, "slides.html"), "w", encoding="utf-8").write(tpl.replace("/*DATA*/[]", safe(chs)))
    open(os.path.join(ROOT, "slides-index.js"), "w", encoding="utf-8").write(
        "/* 生成文件：tools/make_slides.py。有 Slides 的章节及页数 */\nH.slides=" + json.dumps(idx) + ";\n")
    print(f"slides.html: {len(idx)}/{len(chs)} chapters, {pages} pages, {secs / 60:.0f} min")


if __name__ == "__main__":
    main()
