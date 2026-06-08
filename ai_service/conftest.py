import os
import sys

# Ensure the root of the AI microservice is in sys.path so tests can import the 'app' package
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
