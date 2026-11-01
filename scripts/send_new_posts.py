"""Email each new Mandarin Hero blog post to its language's subscribers, once it's live.

Run hourly by .github/workflows/publish-due-posts.yml. A post is sent when it's live on
nuli.nl, dated in the last few days, and has no Resend broadcast named after it yet; that
name is what keeps it to one email per post. --dry-run only prints what it would send.
Sign-ups come from netlify/functions/blog-subscribe.mjs.
"""

import datetime
import glob
import html
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request

BLOG = "site/content/apps/mandarinhero/blog"
SITE = "https://nuli.nl"
SEGMENTS = {
    "en": "10a16077-f4a4-4e44-98a4-ffef0adb4874",  # Mandarin Hero blog (English)
    "nl": "77fcc81a-e0df-4274-b309-b446be163a5d",  # Mandarin Hero blog (Dutch)
}
SENDER = "Joe from Mandarin Hero <hello@mandarinhero.nuli.nl>"
REPLY_TO = "hello@nuli.nl"
# Posts from before sign-ups existed are never emailed.
LAUNCH = datetime.datetime.fromisoformat("2026-11-01T12:00:00+01:00")
RECENT = datetime.timedelta(days=3)

TEXT = {
    "en": {
        "read": "Read the post",
        "why": "You're getting this because you subscribed to the Mandarin Hero blog.",
        "unsubscribe": "Unsubscribe",
    },
    "nl": {
        "read": "Lees het artikel",
        "why": "Je krijgt deze mail omdat je je hebt aangemeld voor de blog van Mandarin Hero.",
        "unsubscribe": "Afmelden",
    },
}


def front_matter(path):
    text = open(path, encoding="utf-8").read()
    head = text.split("---", 2)[1]
    fields = {}
    for key in ("title", "description", "date", "lang"):
        m = re.search(rf"^{key}: (.+)$", head, re.M)
        if m:
            value = m.group(1).strip()
            fields[key] = json.loads(value) if value.startswith('"') else value
    return fields


def resend(method, path, body=None):
    for attempt in range(4):
        req = urllib.request.Request(
            f"https://api.resend.com{path}",
            data=json.dumps(body).encode() if body is not None else None,
            method=method,
            headers={
                "Authorization": f"Bearer {os.environ['RESEND_API_KEY']}",
                "Content-Type": "application/json",
                "User-Agent": "nuli-blog-sender",
            },
        )
        try:
            with urllib.request.urlopen(req) as res:
                return json.load(res)
        except urllib.error.HTTPError as e:
            if e.code != 429 and e.code < 500 or attempt == 3:
                raise SystemExit(f"Resend {method} {path}: {e.code} {e.read().decode(errors='replace')}")
        time.sleep(1 + attempt)


def sent_names():
    names, after = set(), None
    while True:
        page = resend("GET", "/broadcasts?limit=100" + (f"&after={after}" if after else ""))
        names.update(b["name"] for b in page["data"])
        if not page.get("has_more") or not page["data"]:
            return names
        after = page["data"][-1]["id"]


def email_html(post, url, lang):
    t = TEXT[lang]
    title, description = html.escape(post["title"]), html.escape(post.get("description", ""))
    return f"""<!doctype html>
<html lang="{lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;background:#fffdf9;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#171717">
<div style="max-width:560px;margin:0 auto;padding:32px 24px">
  <p style="margin:0 0 24px;font-size:14px;font-weight:700;color:#2f6db3">Mandarin Hero blog</p>
  <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3">{title}</h1>
  <p style="margin:0 0 28px;font-size:17px;line-height:1.55;color:#4a4a4a">{description}</p>
  <a href="{url}" style="display:inline-block;background:#4a90d9;color:#fff;text-decoration:none;font-weight:700;padding:14px 28px;border-radius:999px">{t["read"]}</a>
  <p style="margin:40px 0 0;font-size:13px;line-height:1.5;color:#4a4a4a">{t["why"]}<br>
  <a href="{{{{{{RESEND_UNSUBSCRIBE_URL}}}}}}" style="color:#4a4a4a">{t["unsubscribe"]}</a></p>
</div>
</body></html>"""


def email_text(post, url, lang):
    t = TEXT[lang]
    return (
        f"{post['title']}\n\n{post.get('description', '')}\n\n{t['read']}: {url}\n\n"
        f"{t['why']}\n{t['unsubscribe']}: {{{{{{RESEND_UNSUBSCRIBE_URL}}}}}}\n"
    )


def main():
    dry = "--dry-run" in sys.argv
    live = urllib.request.urlopen(f"{SITE}/sitemap.xml").read().decode()
    now = datetime.datetime.now(datetime.timezone.utc)
    due = []
    for path in sorted(glob.glob(f"{BLOG}/*.md")):
        slug = os.path.basename(path)[:-3]
        post = front_matter(path)
        if slug == "_index" or "date" not in post:
            continue
        date = datetime.datetime.fromisoformat(post["date"])
        if date.tzinfo is None:
            date = date.replace(tzinfo=datetime.timezone.utc)
        if LAUNCH <= date <= now and now - date <= RECENT and f"/blog/{slug}/" in live:
            due.append((slug, post))
    if not due:
        print("No new live posts to email")
        return
    done = sent_names()
    for slug, post in due:
        name = f"Blog: {slug}"
        if name in done:
            print(f"Already emailed: {slug}")
            continue
        lang = "nl" if post.get("lang") == "nl" else "en"
        url = f"{SITE}/apps/mandarinhero/blog/{slug}/"
        if dry:
            print(f"Would email ({lang}): {slug}")
            continue
        resend("POST", "/broadcasts", {
            "name": name,
            "segment_id": SEGMENTS[lang],
            "from": SENDER,
            "reply_to": REPLY_TO,
            "subject": post["title"],
            "preview_text": post.get("description", ""),
            "html": email_html(post, url, lang),
            "text": email_text(post, url, lang),
            "send": True,
        })
        print(f"Emailed ({lang}): {slug}")


if __name__ == "__main__":
    main()
