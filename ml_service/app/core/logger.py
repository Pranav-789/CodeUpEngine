import logging
import os
from datetime import datetime

# Get absolute path to app/ directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGS_DIR_PATH = os.path.join(BASE_DIR, "logs")

os.makedirs(LOGS_DIR_PATH, exist_ok=True)

LOG_FILE_PATH = os.path.join(LOGS_DIR_PATH, f"ml_service_{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}.log")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filename=LOG_FILE_PATH,
    filemode='a',
    encoding='utf-8'
)

logging.info("logging has started working..")