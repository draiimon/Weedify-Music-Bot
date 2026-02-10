import asyncio
import edge_tts
import sys
import os

async def main():
    if len(sys.argv) < 3:
        print("Usage: python tts_gen.py <text> <output_file>")
        return

    text = sys.argv[1]
    output_file = sys.argv[2]
    voice = "en-US-GuyNeural" # Young Stunna voice

    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(output_file)

if __name__ == "__main__":
    asyncio.run(main())
