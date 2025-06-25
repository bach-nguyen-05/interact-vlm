# VLM Quiz - PaliGemma 3B Interactive Interface

A web UI that allows users to interact with a VLM to answer complex VQAs.

## Requirements

- Python 3.8+
- CUDA-compatible GPU (recommended) or CPU
- 6GB+ RAM (8GB+ recommended for GPU)

## Installation

1. **Clone and setup environment:**
```bash
# Install Python dependencies
pip install -r requirements.txt
```

2. **Model Download:**
The PaliGemma 3B model will be automatically downloaded on first run (~6GB).

## Usage

### Quick Start (Demo): Without downloading the model
```bash
python3 run_server.py --dev
```
### Full Mode (Real PaliGemma 3B)
```bash
python3 run_server.py
```
This loads the actual PaliGemma 3B model for real visual question answering.

### Access the Application
Open your browser to: `http://localhost:5000`

## How It Works

1. **Select Challenge**: Choose from different visual challenges
2. **Ask Questions**: Chat with the VLM about what it sees in the image
3. **Solve Challenge**: Use the VLM's responses to answer the main question

## API Endpoints

- `GET /api/challenges` - Get available challenges
- `GET /api/challenge/<id>` - Get specific challenge details
- `POST /api/ask` - Send question to VLM
- `POST /api/submit` - Submit answer
- `GET /api/model-status` - Check model loading status

## Model Optimization

The application includes several optimizations:
- **8-bit quantization** for reduced memory usage
- **Efficient image loading** from URLs
- **Response caching** for better performance

## Customization

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
