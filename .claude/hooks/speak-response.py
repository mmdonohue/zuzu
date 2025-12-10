#!/usr/bin/env python3
import json
import sys
import subprocess
import os

# Read hook input from stdin
try:
    hook_input = json.load(sys.stdin)
    transcript_path = hook_input.get('transcript_path', '')

    print(f"DEBUG: Transcript path: {transcript_path}", file=sys.stderr)

    # Expand ~ to home directory
    transcript_path = os.path.expanduser(transcript_path)

    print(f"DEBUG: Expanded path: {transcript_path}", file=sys.stderr)
    print(f"DEBUG: File exists: {os.path.exists(transcript_path)}", file=sys.stderr)

    if not os.path.exists(transcript_path):
        print("DEBUG: Transcript file not found", file=sys.stderr)
        sys.exit(0)

    # Read last line of transcript (most recent message)
    with open(transcript_path, 'r') as f:
        lines = f.readlines()
        print(f"DEBUG: Read {len(lines)} lines from transcript", file=sys.stderr)

        if lines:
            last_msg = json.loads(lines[-1])
            content = last_msg.get('content', '')

            print(f"DEBUG: Content length: {len(content)}", file=sys.stderr)

            # Clean up content (remove code blocks, backticks, bold)
            clean = content.replace('```', '').replace('**', '').replace('`', '')

            # Limit to first 500 characters for reasonable TTS length
            clean = clean[:500].strip()

            if clean:
                print(f"DEBUG: Speaking: {clean[:50]}...", file=sys.stderr)
                # Speak it (run in background)
                subprocess.Popen(
                    ['/usr/bin/say', clean, '-v', 'Zarvox'],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL
                )
            else:
                print("DEBUG: No content to speak", file=sys.stderr)
except Exception as e:
    print(f"DEBUG: Error: {str(e)}", file=sys.stderr)
    pass

sys.exit(0)