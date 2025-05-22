# utils/logging_config.py

import logging
import os
from datetime import datetime


def setup_logging(log_level=logging.INFO):
    """
    Configure logging for the application.
    
    Args:
        log_level: The logging level to use
    """
    # Create logs directory if it doesn't exist
    os.makedirs('logs', exist_ok=True)
    
    # Get the current date and time for the log filename
    log_filename = f"logs/inventory_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
    
    # Configure logging
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s - %(levelname)s - %(message)s",
        handlers=[
            logging.FileHandler(log_filename),
            logging.StreamHandler()
        ]
    )
    
    logging.info(f"Logging configured at level {logging.getLevelName(log_level)}")
    logging.info(f"Writing logs to {log_filename}") 