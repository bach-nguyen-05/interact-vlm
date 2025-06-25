# VLM Quiz - PaliGemma 3B Interactive Interface

A sophisticated web application that allows users to interact with the PaliGemma 3B visual language model through a quiz-based interface. Users ask questions about images they cannot see to solve visual challenges.

## Features

- **Real PaliGemma 3B Integration**: Uses the actual PaliGemma 3B model for visual question answering
- **Interactive Chat Interface**: Natural conversation with the VLM
- **Multiple Challenge Types**: Color identification, counting, object recognition, scene understanding
- **Smart Scoring System**: Rewards efficient questioning
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Real-time Model Status**: Shows whether using actual model or demo mode
- **Production Ready**: Optimized for deployment with proper error handling

## Requirements

- Python 3.8+
- CUDA-compatible GPU (recommended) or CPU
- 6GB+ RAM (8GB+ recommended for GPU)
- Internet connection for downloading models and images

## Installation

1. **Clone and setup environment:**
```bash
# Install Python dependencies
pip install -r requirements.txt
```

2. **Model Download:**
The PaliGemma 3B model will be automatically downloaded on first run (~6GB).

## Usage

### Quick Start (Demo Mode)
```bash
python run_server.py --dev
```
This runs with mock responses for testing without downloading the model.

### Full Mode (Real PaliGemma 3B)
```bash
python run_server.py
```
This loads the actual PaliGemma 3B model for real visual question answering.

### Access the Application
Open your browser to: `http://localhost:5000`

## How It Works

1. **Select Challenge**: Choose from different visual challenges
2. **Ask Questions**: Chat with the VLM about what it sees in the image
3. **Solve Challenge**: Use the VLM's responses to answer the main question
4. **Get Scored**: Earn points based on efficiency (fewer questions = higher score)

## API Endpoints

- `GET /api/challenges` - Get available challenges
- `GET /api/challenge/<id>` - Get specific challenge details
- `POST /api/ask` - Send question to VLM
- `POST /api/submit` - Submit answer for scoring
- `GET /api/model-status` - Check model loading status

## Model Optimization

The application includes several optimizations:
- **8-bit quantization** for reduced memory usage
- **Automatic device detection** (CUDA/CPU)
- **Efficient image loading** from URLs
- **Response caching** for better performance

## Customization

### Adding New Challenges
Edit the `load_challenges()` method in `app.py`:

```python
{
    "id": "new_challenge",
    "question": "Your question here",
    "image_url": "https://example.com/image.jpg",
    "correct_answer": "expected_answer",
    "category": "category_name"
}
```

### Modifying Model Parameters
Adjust generation parameters in the `generate_response()` method:

```python
output = self.model.generate(
    **inputs,
    max_new_tokens=150,      # Response length
    temperature=0.7,         # Creativity
    top_p=0.9,              # Nucleus sampling
    do_sample=True          # Enable sampling
)
```

## Troubleshooting

### Model Loading Issues
- **Out of Memory**: Try reducing batch size or using CPU mode
- **CUDA Errors**: Ensure CUDA drivers are properly installed
- **Download Failures**: Check internet connection and disk space

### Performance Optimization
- **GPU Recommended**: CPU inference is significantly slower
- **Memory Usage**: Monitor RAM/VRAM usage during operation
- **Response Time**: First inference is slower due to model initialization

## Technical Architecture

- **Backend**: Flask with CORS support
- **Model**: PaliGemma 3B via Transformers library
- **Frontend**: Vanilla JavaScript with Tailwind CSS
- **Image Processing**: PIL for image handling
- **Optimization**: 8-bit quantization, device auto-detection

## Production Deployment

For production deployment:

1. **Use WSGI server** (Gunicorn recommended)
2. **Set up reverse proxy** (Nginx)
3. **Configure environment variables**
4. **Enable logging and monitoring**
5. **Set up model caching**

Example Gunicorn command:
```bash
gunicorn -w 1 -b 0.0.0.0:5000 --timeout 120 app:app
```

## License

This project is open source and available under the MIT License.