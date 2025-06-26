from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import torch
from transformers import PaliGemmaProcessor, PaliGemmaForConditionalGeneration
from PIL import Image
import requests
import json
import os
import logging
from datetime import datetime
import random
import csv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

class VLMQuizSystem:
    def __init__(self):
        self.processor = None
        self.model = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.current_image = None
        self.challenges = self.load_challenges()
        self.load_model()

    def load_model(self):
        """Load PaliGemma model with optimizations for inference"""
        try:
            logger.info("Loading PaliGemma 3B model...")
            model_id = "google/paligemma-3b-mix-224"

            # Load processor
            self.processor = PaliGemmaProcessor.from_pretrained(model_id)

            # Load model with optimizations
            self.model = PaliGemmaForConditionalGeneration.from_pretrained(
                model_id,
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
                low_cpu_mem_usage=True,
                device_map="auto" if self.device == "cuda" else None,
                load_in_8bit=True if self.device == "cuda" else False
            )

            if self.device == "cpu":
                self.model = self.model.to(self.device)

            logger.info(f"Model loaded successfully on {self.device}")

        except Exception as e:
            logger.error(f"Error loading model: {e}")
            # Fallback to mock responses if model fails to load
            self.model = None
            self.processor = None

    def load_challenges(self):
        """Load only the first 10 quiz challenges from short_subset.json with local image paths and numeric challenge names"""
        dataset_path = os.path.join(os.path.dirname(__file__), 'short_subset.json')
        try:
            with open(dataset_path, 'r') as f:
                data = json.load(f)
            challenges = []
            for idx, entry in enumerate(data[:10]):
                # Format answer: remove parentheses if present
                answer = entry["ground_truth"].strip()
                if answer.startswith("(") and answer.endswith(")") and len(answer) == 3:
                    answer = answer[1]
                local_image_path = os.path.join(os.path.dirname(__file__), entry['path'])
                static_url = f"/static/{entry['path']}"
                challenges.append({
                    "id": str(idx + 1),
                    "question": entry["question"],
                    "image_url": local_image_path,  # for backend/model
                    "image_static_url": static_url, # for frontend
                    "correct_answer": answer,
                    "category": str(idx + 1)  # Use numeric challenge name
                })
            return challenges
        except Exception as e:
            logger.error(f"Error loading dataset: {e}")
            return []

    def load_image_from_url(self, url):
        """Load and process image from URL"""
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            image = Image.open(requests.get(url, stream=True).raw)
            return image.convert('RGB')
        except Exception as e:
            logger.error(f"Error loading image from {url}: {e}")
            return None

    def generate_response(self, question, image_path):
        """Generate VLM response to user question"""
        if not self.model or not self.processor:
            return "[ERROR] VLM model is not loaded. Please check the server logs."
        try:
            # Load image from local path
            image = Image.open(image_path).convert('RGB')

            # Prepare prompt for PaliGemma
            prompt = f"Question: {question}"
            # Process inputs
            inputs = self.processor(prompt, image, return_tensors="pt").to(self.device)

            # Generate response
            with torch.no_grad():
                output = self.model.generate(
                    **inputs,
                    max_new_tokens=150,
                    do_sample=True,
                    temperature=0.7,
                    top_p=0.9,
                    pad_token_id=self.processor.tokenizer.eos_token_id
                )

            # Decode response
            response = self.processor.decode(output[0], skip_special_tokens=True)
            # Extract only the generated response (remove the input prompt)
            if prompt in response:
                response = response.replace(prompt, "").strip()

            return response

        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return "[ERROR] VLM model failed to generate a response."

    def generate_mock_response(self, question, image_url):
        """Generate mock responses when model is not available"""
        question_lower = question.lower()

        # Simple keyword-based responses for demo
        if any(word in question_lower for word in ['color', 'what color']):
            responses = [
                "I can see a prominent red color in the image.",
                "The main color appears to be red.",
            ]
        elif any(word in question_lower for word in ['how many', 'count', 'number']):
            responses = [
                "I can count three distinct objects/people.",
                "There appear to be 3 items in the scene.",
            ]
        elif any(word in question_lower for word in ['animal', 'pet', 'dog', 'cat']):
            responses = [
                "I can see a dog in the image.",
                "There's a canine animal visible.",
                "It appears to be a domestic dog."
            ]
        elif any(word in question_lower for word in ['weather', 'sky', 'sunny', 'cloudy']):
            responses = [
                "The weather looks sunny and clear.",
                "It appears to be a bright, sunny day.",
            ]
        else:
            responses = [
                "I can see details that might help answer your question.",
                "Let me look more carefully at that aspect of the image.",
            ]

        return random.choice(responses)

# Initialize VLM system
vlm_system = VLMQuizSystem()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/challenges')
def get_challenges():
    """Get available challenges"""
    return jsonify(vlm_system.challenges)

@app.route('/api/challenge/<challenge_id>')
def get_challenge(challenge_id):
    """Get specific challenge details"""
    challenge = next((c for c in vlm_system.challenges if c['id'] == challenge_id), None)
    if not challenge:
        return jsonify({'error': 'Challenge not found'}), 404

    # Return challenge without the correct answer and with static image URL for frontend
    safe_challenge = {
        'id': challenge['id'],
        'question': challenge['question'],
        'category': challenge['category'],
        'image_url': challenge['image_static_url']
    }
    return jsonify(safe_challenge)

@app.route('/api/ask', methods=['POST'])
def ask_question():
    """Handle user questions to VLM"""
    data = request.json
    question = data.get('question', '')
    challenge_id = data.get('challenge_id', '')

    if not question or not challenge_id:
        return jsonify({'error': 'Question and challenge_id required'}), 400

    # Find challenge
    challenge = next((c for c in vlm_system.challenges if c['id'] == challenge_id), None)
    if not challenge:
        return jsonify({'error': 'Challenge not found'}), 404

    # Generate VLM response using local image path
    response = vlm_system.generate_response(question, challenge['image_url'])

    return jsonify({
        'response': response,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/submit', methods=['POST'])
def submit_answer():
    """Submit answer for challenge"""
    data = request.json
    answer = data.get('answer', '').strip().lower()
    challenge_id = data.get('challenge_id', '')
    questions_asked = data.get('questions_asked', 0)

    if not answer or not challenge_id:
        return jsonify({'error': 'Answer and challenge_id required'}), 400

    # Find challenge
    challenge = next((c for c in vlm_system.challenges if c['id'] == challenge_id), None)
    if not challenge:
        return jsonify({'error': 'Challenge not found'}), 404

    # Check answer
    correct_answer = challenge['correct_answer'].lower()
    is_correct = answer == correct_answer

    return jsonify({
        'correct': is_correct,
        'correct_answer': challenge['correct_answer'],
        'message': 'Correct! Well done!' if is_correct else f'Not quite right. The answer was "{challenge["correct_answer"]}".'
    })

@app.route('/api/model-status')
def model_status():
    """Get model loading status"""
    return jsonify({
        'model_loaded': vlm_system.model is not None,
        'device': vlm_system.device,
        'using_mock': vlm_system.model is None
    })

@app.route('/api/save-trace', methods=['POST'])
def save_trace():
    """Save human reasoning trace (questions and VLM answers) to a CSV file"""
    data = request.json
    challenge_id = data.get('challenge_id')
    trace = data.get('trace', [])  # List of {question, answer}
    user = data.get('user', 'anonymous')
    if not challenge_id or not trace:
        return jsonify({'error': 'Missing challenge_id or trace'}), 400
    filename = f'traces_{challenge_id}.csv'
    file_exists = os.path.isfile(filename)
    with open(filename, 'a', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        if not file_exists:
            writer.writerow(['user', 'challenge_id', 'question', 'vlm_answer'])
        for entry in trace:
            writer.writerow([user, challenge_id, entry.get('question', ''), entry.get('vlm_answer', '')])
    return jsonify({'status': 'saved'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)