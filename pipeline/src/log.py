import logging
import threading
import queue

logging.basicConfig(
    level=logging.INFO, format="[%(asctime)s] %(message)s", datefmt="%d/%m/%Y %H:%M:%S"
)

log_queue = queue.Queue()


def log(msg, meta=None):
    log_queue.put((msg, meta))


def process_log_queue():
    while True:
        try:
            log_entry, meta = log_queue.get()
            logging.info(f"{log_entry} {meta}")
            log_queue.task_done()
        except Exception as e:
            logging.error(f"Error processing log entry: {e}")


log_thread = threading.Thread(target=process_log_queue, daemon=True)
log_thread.start()
