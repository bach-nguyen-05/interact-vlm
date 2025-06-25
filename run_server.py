#!/usr/bin/env python3
"""
VLM Quiz Server Runner
Handles model loading and server startup with proper error handling
"""

import os
import sys
import logging
from app import app, vlm_system

def main():
    """Main server runner with initialization checks"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    logger = logging.getLogger(__name__)
    
    # Check if running in development mode
    dev_mode = '--dev' in sys.argv
    
    if dev_mode:
        logger.info("Starting in development mode with mock responses")
        vlm_system.model = None
        vlm_system.processor = None
    
    # Print startup information
    logger.info("=" * 50)
    logger.info("VLM Quiz Server - PaliGemma 3B Integration")
    logger.info("=" * 50)
    logger.info(f"Model Status: {'Mock Mode' if not vlm_system.model else 'PaliGemma 3B Loaded'}")
    logger.info(f"Device: {vlm_system.device}")
    logger.info(f"Server URL: http://localhost:5000")
    logger.info("=" * 50)
    
    # Start server
    try:
        app.run(
            debug=True,
            host='0.0.0.0',
            port=5000,
            use_reloader=False  # Disable reloader to prevent model reloading
        )
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Server error: {e}")

if __name__ == '__main__':
    main()