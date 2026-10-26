#!/usr/bin/env python3
"""
🦥 SlothChat Digest CLI
A delightfully lazy terminal companion that summarizes group chat chaos using local Ollama AI.

Features:
- 100% Python Standard Library (no pip dependencies required)
- Connects directly to local Ollama instance (e.g., llama3.2:latest, gemma2, qwen2.5)
- Automatic fallback / demo mode when Ollama is offline or --demo flag is provided
- Beautiful box-drawing terminal formatting with ANSI color themes
- Computes Laziness ROI (messages skipped, words saved, calories, $0.00 cloud cost)

Usage:
  python sloth_cli.py <path_to_chat.txt> [options]
"""

import argparse
import json
import os
import re
import sys
import textwrap
import unicodedata
import urllib.error
import urllib.parse
import urllib.request

# ---------------------------------------------------------------------------
# ANSI Color & Style Definitions
# ---------------------------------------------------------------------------
AMBER = "\033[1;33m"
CYAN = "\033[1;36m"
GREEN = "\033[0;32m"
BRIGHT_GREEN = "\033[1;32m"
RED = "\033[1;31m"
YELLOW = "\033[1;33m"
DIM = "\033[2m"
BOLD = "\033[1m"
RESET = "\033[0m"

INNER_WIDTH = 50
ANSI_REGEX = re.compile(r"\x1b\[[0-9;]*[mK]")


def setup_terminal():
    """Enable ANSI/VT100 processing and UTF-8 encoding on Windows consoles."""
    # Ensure stdout and stderr handle Unicode characters (emojis, box characters)
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass
    if hasattr(sys.stderr, "reconfigure"):
        try:
            sys.stderr.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

    if sys.platform == "win32":
        try:
            import ctypes
            kernel32 = ctypes.windll.kernel32
            handle = kernel32.GetStdHandle(-11)  # STD_OUTPUT_HANDLE
            mode = ctypes.c_ulong()
            kernel32.GetConsoleMode(handle, ctypes.byref(mode))
            kernel32.SetConsoleMode(handle, mode.value | 0x0004)  # ENABLE_VIRTUAL_TERMINAL_PROCESSING
        except Exception:
            os.system("")  # Fallback to enable VT processing


def strip_ansi(s: str) -> str:
    """Remove ANSI escape codes from string for accurate width calculation."""
    return ANSI_REGEX.sub("", s)


def char_width(ch: str) -> int:
    """Return terminal display column width for a single character."""
    cp = ord(ch)
    # Zero-width control characters / variation selectors
    if cp in (0x200D, 0xFE0E, 0xFE0F):
        return 0
    # Common wide emoji blocks
    if (0x1F300 <= cp <= 0x1FAFF) or (0x2600 <= cp <= 0x27BF) or (0x1F600 <= cp <= 0x1F64F):
        return 2
    # East Asian Wide / Fullwidth characters
    eaw = unicodedata.east_asian_width(ch)
    if eaw in ("W", "F"):
        return 2
    return 1


def str_width(s: str) -> int:
    """Calculate terminal display column width of a string (ignoring ANSI codes)."""
    clean = strip_ansi(s)
    return sum(char_width(ch) for ch in clean)


def make_box_line(content: str = "", border_color: str = AMBER) -> str:
    """Format a single box line ensuring outer borders align at INNER_WIDTH."""
    w = str_width(content)
    pad = max(0, INNER_WIDTH - w)
    return f"{border_color}║{RESET}{content}{' ' * pad}{border_color}║{RESET}"


# ---------------------------------------------------------------------------
# Ollama Integration & Fallback Engine
# ---------------------------------------------------------------------------
def check_ollama(host: str, timeout: float = 3.0) -> bool:
    """Check if the local Ollama server is running and reachable."""
    try:
        url = f"{host.rstrip('/')}/api/tags"
        req = urllib.request.Request(url, headers={"User-Agent": "SlothChat-CLI"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status == 200
    except Exception:
        return False


def build_prompt(chat_text: str, target: str) -> str:
    """Construct the summarization prompt for the AI model."""
    return f"""You are SlothChat Digest AI, the delightfully lazy assistant that summarizes group chats so the user doesn't have to read them.
Analyze the following group chat log and return ONLY a valid, parseable JSON object. No Markdown code fences, no introductory text, no explanations.

Target user to check for pings/mentions: {target}

Group Chat Log:
{chat_text}

Respond ONLY with a JSON object in this exact schema:
{{
  "sloth_summary": "Two punchy sentences summarizing the entire night's chaos lazily.",
  "pings": {{
    "found": true or false,
    "details": "Short explanation of whether and how {target} was mentioned or needed."
  }},
  "drama": {{
    "level": integer between 0 and 100,
    "description": "Short explanation of the drama level and conflict."
  }},
  "lazy_replies": {{
    "ghost": "A low-effort one-liner pretending you never saw it or just catching up.",
    "diplomat": "A neutral, non-committal reply that sounds polite without taking sides.",
    "sloth_king": "An unapologetically lazy response acknowledging the chaos while doing zero work."
  }},
  "stats": {{
    "messages_skipped": integer count of messages,
    "words_not_read": integer count of words
  }}
}}"""


def call_ollama(host: str, model: str, prompt: str, timeout: float = 120.0) -> str:
    """Send prompt to local Ollama /api/generate endpoint."""
    url = f"{host.rstrip('/')}/api/generate"
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "format": "json"
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json", "User-Agent": "SlothChat-CLI"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        res_data = json.loads(resp.read().decode("utf-8"))
        return res_data.get("response", "")


def extract_json(raw_text: str) -> dict:
    """Robustly parse JSON object from LLM output."""
    cleaned = raw_text.strip()

    # 1. Direct parse attempt
    try:
        return json.loads(cleaned)
    except Exception:
        pass

    # 2. Markdown fenced block
    match = re.search(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", cleaned)
    if match:
        try:
            return json.loads(match.group(1))
        except Exception:
            pass

    # 3. Find outer braces { ... }
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(cleaned[start:end + 1])
        except Exception:
            pass

    raise ValueError("Could not extract valid JSON from Ollama response")


def generate_demo_response(chat_text: str, target: str) -> dict:
    """Generate contextual demo response based on input chat characteristics."""
    lines = [line.strip() for line in chat_text.splitlines() if line.strip()]
    line_count = len(lines) if lines else 84
    words = chat_text.split()
    word_count = len(words) if words else 1420

    clean_target = target.lstrip("@").lower()
    has_ping = clean_target in chat_text.lower() if clean_target else False

    if has_ping:
        ping_details = f"Direct mention detected for {target}. Urgent validation was requested."
    else:
        ping_details = f"Zero pings for {target}. You were safely forgotten. Bliss."

    return {
        "sloth_summary": "The group chat devolved into absolute chaos while you were blissfully unconscious. Nobody agreed on anything, which is pretty on-brand.",
        "pings": {
            "found": has_ping,
            "details": ping_details
        },
        "drama": {
            "level": 73,
            "description": "High-stakes argument over trivial logistics and unsolicited opinions."
        },
        "lazy_replies": {
            "ghost": "sorry was asleep lol what happened",
            "diplomat": "valid points on both sides tbh, let's catch up later",
            "sloth_king": f"I've reviewed the {line_count} messages and have decided to take no action. Respectfully."
        },
        "stats": {
            "messages_skipped": line_count,
            "words_not_read": word_count
        }
    }


# ---------------------------------------------------------------------------
# Beautiful Terminal Output Renderer
# ---------------------------------------------------------------------------
def print_terminal_digest(data: dict):
    """Render the SlothChat Digest in formatted box-drawing terminal cards."""
    summary = data.get("sloth_summary", "No summary available.")
    pings = data.get("pings", {})
    ping_found = bool(pings.get("found", False))
    ping_details = pings.get("details", "No details provided.")

    drama = data.get("drama", {})
    try:
        drama_level = int(drama.get("level", 50))
    except (ValueError, TypeError):
        drama_level = 50
    drama_level = max(0, min(100, drama_level))
    drama_desc = drama.get("description", "Normal chatter observed.")

    replies = data.get("lazy_replies", {})
    ghost_reply = replies.get("ghost", "sorry just woke up what happened")
    diplomat_reply = replies.get("diplomat", "good points all around, let's circle back")
    sloth_king_reply = replies.get("sloth_king", "Acknowledged and promptly ignored.")

    stats = data.get("stats", {})
    try:
        messages_skipped = int(stats.get("messages_skipped", 0))
    except (ValueError, TypeError):
        messages_skipped = 0
    try:
        words_not_read = int(stats.get("words_not_read", 0))
    except (ValueError, TypeError):
        words_not_read = 0

    calories = round(words_not_read / 100.0, 1) if words_not_read > 0 else round(messages_skipped * 0.17, 1)

    # Top border & title header
    print(f"{AMBER}╔{'═' * INNER_WIDTH}╗{RESET}")
    print(make_box_line(f"  {BOLD}{AMBER}🦥 SLOTHCHAT DIGEST — Your Lazy Morning Brief{RESET}  "))
    print(f"{AMBER}╠{'═' * INNER_WIDTH}╣{RESET}")
    print(make_box_line(""))

    # SECTION 1: Summary
    print(make_box_line(f"  {BOLD}{CYAN}📜 THE 2-LINE SLOTH SUMMARY{RESET}"))
    print(make_box_line(f"  {DIM}─────────────────────────────{RESET}"))
    for line in textwrap.wrap(summary, width=46):
        print(make_box_line(f"  {line}"))
    print(make_box_line(""))

    # SECTION 2: Pings
    print(make_box_line(f"  {BOLD}{CYAN}🔔 DID ANYONE PING ME?{RESET}"))
    print(make_box_line(f"  {DIM}─────────────────────{RESET}"))
    status_tag = f"{BRIGHT_GREEN}✅ Yes{RESET}" if ping_found else f"{DIM}😴 No{RESET}"
    combined_ping = f"{status_tag} {ping_details}"
    if str_width(f"  {combined_ping}") <= 48:
        print(make_box_line(f"  {combined_ping}"))
    else:
        print(make_box_line(f"  {status_tag}"))
        for line in textwrap.wrap(ping_details, width=46):
            print(make_box_line(f"  {line}"))
    print(make_box_line(""))

    # SECTION 3: Drama Thermometer
    if drama_level >= 70:
        bar_color = RED
    elif drama_level >= 35:
        bar_color = YELLOW
    else:
        bar_color = GREEN

    filled = max(0, min(14, int(round((drama_level / 100.0) * 14))))
    unfilled = 14 - filled
    bar_str = f"[{bar_color}{'#' * filled}{DIM}{'-' * unfilled}{RESET}] {bar_color}{drama_level}%{RESET}"
    print(make_box_line(f"  {YELLOW}🔥 DRAMA THERMOMETER:{RESET} {bar_str}"))
    for line in textwrap.wrap(drama_desc, width=46):
        print(make_box_line(f"  {line}"))
    print(make_box_line(""))

    # SECTION 4: Lazy Replies
    print(make_box_line(f"  {BOLD}{CYAN}💬 LAZY REPLIES (copy-paste ready){RESET}"))
    print(make_box_line(f"  {DIM}─────────────────────────────────{RESET}"))

    reply_items = [
        ("👻 Ghost:      ", ghost_reply),
        ("🕊️  Diplomat:   ", diplomat_reply),
        ("🦥 Sloth King: ", sloth_king_reply),
    ]
    for label, text in reply_items:
        prefix = f"  {BOLD}{CYAN}{label}{RESET}"
        wrapped_parts = textwrap.wrap(text, width=31)
        if not wrapped_parts:
            wrapped_parts = [""]
        print(make_box_line(f"{prefix}{GREEN}{wrapped_parts[0]}{RESET}"))
        for cont in wrapped_parts[1:]:
            print(make_box_line(f"                 {GREEN}{cont}{RESET}"))
    print(make_box_line(""))

    # SECTION 5: Laziness ROI
    print(make_box_line(f"  {BOLD}{CYAN}📊 LAZINESS ROI{RESET}"))
    print(make_box_line(f"  {DIM}─────────────{RESET}"))
    print(make_box_line(f"  📨 Messages Skipped: {GREEN}{messages_skipped:,}{RESET}"))
    print(make_box_line(f"  📝 Words Not Read:   {GREEN}{words_not_read:,}{RESET}"))
    print(make_box_line(f"  🔋 Sloth Calories:   {GREEN}{calories:.1f}{RESET}"))
    print(make_box_line(f"  💰 Cloud Cost:       {GREEN}$0.00 (100% local!){RESET}"))
    print(make_box_line(""))

    # Bottom border
    print(f"{AMBER}╚{'═' * INNER_WIDTH}╝{RESET}\n")


# ---------------------------------------------------------------------------
# CLI Argument Parser & Entry Point
# ---------------------------------------------------------------------------
def parse_arguments():
    """Configure and parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description="🦥 SlothChat Digest CLI — Summarize chaotic group chats with local Ollama AI.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python sloth_cli.py chat_export.txt
  python sloth_cli.py chat_export.txt --model llama3.2:latest --target "@Alex"
  python sloth_cli.py chat_export.txt --demo
        """,
    )
    parser.add_argument("file", help="Path to exported group chat text file (.txt)")
    parser.add_argument(
        "-m", "--model",
        default="llama3.2:latest",
        help="Ollama model to use (default: 'llama3.2:latest')"
    )
    parser.add_argument(
        "-t", "--target",
        default="@YourMajesty",
        help="Target username to check for pings (default: '@YourMajesty')"
    )
    parser.add_argument(
        "--host",
        default="http://localhost:11434",
        help="Ollama host URL (default: 'http://localhost:11434')"
    )
    parser.add_argument(
        "--demo",
        action="store_true",
        help="Use offline demo/fallback mode without contacting Ollama"
    )
    return parser.parse_args()


def main():
    setup_terminal()
    args = parse_arguments()

    # Read chat file
    if not os.path.exists(args.file):
        print(f"{RED}[Error]{RESET} File not found: {args.file}", file=sys.stderr)
        sys.exit(1)

    try:
        with open(args.file, "r", encoding="utf-8", errors="replace") as f:
            chat_text = f.read()
    except Exception as e:
        print(f"{RED}[Error]{RESET} Failed to read '{args.file}': {e}", file=sys.stderr)
        sys.exit(1)

    if not chat_text.strip():
        print(f"{YELLOW}[Warning]{RESET} Chat file is empty. Generating empty brief.", file=sys.stderr)
        chat_text = "[No chat messages recorded]"

    # Mode determination
    digest_data = None
    if args.demo:
        digest_data = generate_demo_response(chat_text, args.target)
    else:
        # Check Ollama connectivity
        ollama_online = check_ollama(args.host)
        if ollama_online:
            prompt = build_prompt(chat_text, args.target)
            try:
                print(f"{DIM}Connecting to Ollama ({args.model})... Digesting lazily...{RESET}")
                raw_response = call_ollama(args.host, args.model, prompt)
                digest_data = extract_json(raw_response)
            except Exception as e:
                print(f"{YELLOW}[!] AI inference failed ({e}). Switching to Demo Mode.{RESET}\n")
                digest_data = generate_demo_response(chat_text, args.target)
        else:
            print(f"{YELLOW}[!] Ollama server offline at {args.host}. Running in Demo Mode.{RESET}\n")
            digest_data = generate_demo_response(chat_text, args.target)

    # Ensure stats reflect actual file if missing or zero
    if not digest_data.get("stats") or digest_data.get("stats", {}).get("messages_skipped", 0) == 0:
        lines = [l for l in chat_text.splitlines() if l.strip()]
        digest_data["stats"] = {
            "messages_skipped": len(lines) if lines else 84,
            "words_not_read": len(chat_text.split()) if chat_text.split() else 1420
        }

    # Print the terminal digest
    print_terminal_digest(digest_data)


if __name__ == "__main__":
    main()
