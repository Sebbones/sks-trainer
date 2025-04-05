from transformers import pipeline
import soundfile as sf
import numpy as np

synthesiser = pipeline("text-to-speech", "suno/bark")

speech = synthesiser("<|de|>Was bedeutet die Abk\u00fcrzung DGPS und nach welchem Prinzip arbeitet DGPS?", forward_params={"do_sample": True})

sampling_rate = speech["sampling_rate"]
audio = np.array(speech["audio"], dtype=np.float32).squeeze()

sf.write("bark_output.wav", audio, speech["sampling_rate"])
