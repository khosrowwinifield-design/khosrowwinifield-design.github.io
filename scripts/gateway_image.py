import base64
import os
import re
import sys
import urllib.request
from pathlib import Path

from openai import OpenAI


def main() -> int:
    base_url = os.environ["OPENAI_BASE_URL"]
    api_key = os.environ["OPENAI_API_KEY"]
    prompt = Path(sys.argv[1]).read_text(encoding="utf-8")
    output = Path(sys.argv[2])

    client = OpenAI(base_url=base_url, api_key=api_key, timeout=300)
    response = client.chat.completions.create(
        model="gpt-image-2",
        messages=[{"role": "user", "content": prompt}],
    )
    content = response.choices[0].message.content or ""
    output.parent.mkdir(parents=True, exist_ok=True)

    data_match = re.search(r"data:image/[^;]+;base64,([A-Za-z0-9+/=\s]+)", content)
    if data_match:
        output.write_bytes(base64.b64decode(re.sub(r"\s+", "", data_match.group(1))))
        print(f"saved={output.resolve()}")
        return 0

    url_match = re.search(r"https?://[^\s)\]>'\"]+", content)
    if url_match:
        request = urllib.request.Request(url_match.group(0), headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(request, timeout=300) as source:
            output.write_bytes(source.read())
        print(f"saved={output.resolve()}")
        return 0

    print("Gateway response did not contain an image URL or base64 image.")
    print(content[:2000])
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
