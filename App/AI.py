import os
import speech_recognition as sr
import pyttsx3
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# =========================
# 🤖 Gemini API setup
# =========================
# Run: pip install google-generativeai
API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=API_KEY)
model = genai.GenerativeModel('gemini-3-flash-preview')

# =========================
# 🗣️ Text-to-speech
# =========================
engine = pyttsx3.init()
engine.setProperty("rate", 180)

def speak(text):
    print("AI:", text)

    # split by sentence boundaries
    sentences = text.replace("\n", " ").split(". ")

    for s in sentences:
        s = s.strip()
        if len(s) > 0:
            engine.say(s)
            engine.runAndWait()

# =========================
# 🎤 Speech-to-text
# =========================
recognizer = sr.Recognizer()

def listen():
    with sr.Microphone() as source:
        print("\nListening...")
        recognizer.adjust_for_ambient_noise(source, duration=0.5)
        try:
            audio = recognizer.listen(source, timeout=5, phrase_time_limit=10)
            text = recognizer.recognize_google(audio)
            print(f"You: {text}")
            return text
        except sr.UnknownValueError:
            print("System: Could not understand audio.")
            return ""
        except sr.RequestError as e:
            print(f"System: Google Speech Error; {e}")
            return ""
        except Exception as e:
            print(f"System: Error: {e}")
            return ""

# =========================
# 🚀 Main loop
# =========================
speak("Cooking assistant ready.")

while True:
    user_text = listen()

    if not user_text:
        continue

    if "exit" in user_text.lower() or "stop" in user_text.lower():
        speak("Goodbye!")
        break

    try:
        # Simplified prompt handling using the SDK
        prompt = f"As a professional cooking assistant, give ingredients and steps for: {user_text}. Keep the response SHORT (max 8 steps). Do not include extra explanations unless asked."
        response = model.generate_content(prompt)
        speak(response.text)
    except Exception as e:
        speak(f"I ran into an error: {e}")