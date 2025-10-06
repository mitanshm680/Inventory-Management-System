# utils/logging_config.py

import logging
import os
from datetime import datetime


def setup_logging():
    """Configure logging for the application."""
    # Create logs directory if it doesn't exist
    os.makedirs('logs', exist_ok=True)
    
    # Get current timestamp for log file name
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = f'logs/inventory_{timestamp}.log'
    
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(),  # Log to console
            logging.FileHandler(log_file)  # Log to file
        ]
    )
    
    logging.info("Logging configured at level INFO")
    logging.info(f"Writing logs to {log_file}") 