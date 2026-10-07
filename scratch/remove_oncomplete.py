import os
import re

directory = 'kortex_learning_tools/conceptualiser'

for filename in os.listdir(directory):
    if not filename.endswith('.tsx'):
        continue
    filepath = os.path.join(directory, filename)
    with open(filepath, 'r') as f:
        content = f.read()

    # Find buttons with onClick={onComplete} or onClick={() => onComplete?.()} or similar
    # We will use regex to find `<button ... onClick={onComplete...} ...> ... </button>` and remove it
    
    # Simple regex to match a button tag that contains onComplete
    pattern = re.compile(r'<button[^>]*onClick=\{[^}]*onComplete[^}]*\}[^>]*>.*?</button>', re.DOTALL)
    new_content = pattern.sub('', content)

    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f'Modified {filename}')

