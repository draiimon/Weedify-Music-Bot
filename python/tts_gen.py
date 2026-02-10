import sys
import asyncio
import edge_tts

async def generate_tts(text, output_file):
    # Voice: fil-PH-AngeloNeural (Male, Filipino) - Perfect for "Young Stunna"
    voice = "fil-PH-AngeloNeural"
    
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(output_file)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python tts_gen.py <text> <output_file>")
        sys.exit(1)

    text_input = sys.argv[1]
    output_path = sys.argv[2]

    try:
        loop = asyncio.get_event_loop_policy().get_event_loop()
        try:
            loop.run_until_complete(generate_tts(text_input, output_path))
        finally:
            loop.close()
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
