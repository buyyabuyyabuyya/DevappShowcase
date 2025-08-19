import time

from google import genai


prompt = """A close up of two people staring at a cryptic drawing on a wall, torchlight flickering.

A man murmurs, 'This must be it. That's the secret code.' The woman looks at him and whispering excitedly, 'What did you find?'"""

API_KEY = "2ahUKEwi05JSHnMWMAxUw8bsIHRRCDd0Qk8gLegQIHxAB"

client = genai.Client(api_key=API_KEY)

# Start the generation job

operation = client.models.generate_videos(

    model="google-veo",

    prompt=prompt,

)


# Poll for the result

while not operation.done:

    print("Waiting for video generation to complete...")

    time.sleep(10)

    operation = client.operations.get(operation)


# Download the final video

video = operation.response.generated_videos[0]

video.video.save("dialogue_example.mp4")

print("Generated video saved to dialogue_example.mp4")