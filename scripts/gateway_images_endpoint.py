import base64
import os
import sys
import urllib.request
from pathlib import Path

from openai import OpenAI


client = OpenAI(
    base_url=os.environ["OPENAI_BASE_URL"],
    api_key=os.environ["OPENAI_API_KEY"],
    timeout=300,
)
prompt = Path(sys.argv[1]).read_text(encoding="utf-8")
output = Path(sys.argv[2])
response = client.images.generate(
    model="gpt-image-2",
    prompt=prompt,
    size="1024x1536",
    quality="high",
)
output.parent.mkdir(parents=True, exist_ok=True)

if not response.data:
    raise SystemExit("Gateway returned an empty image list.")

item = response.data[0]
if item.b64_json:
    output.write_bytes(base64.b64decode(item.b64_json))
elif item.url:
    request = urllib.request.Request(item.url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(request, timeout=300) as source:
        output.write_bytes(source.read())
else:
    raise SystemExit("Gateway response contained neither b64_json nor url.")

print(f"saved={output.resolve()}")
