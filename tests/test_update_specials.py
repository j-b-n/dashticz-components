#!/usr/bin/python

import os
import shutil
import subprocess
import tempfile

def test_update_specials_no_duplicates():
    # Create a temporary directory
    with tempfile.TemporaryDirectory() as temp_dir:
        # Copy the test dashticz.js
        test_file = os.path.join(temp_dir, 'dashticz.js')
        shutil.copy('tests/dashticz.js', test_file)

        # Run the script the first time
        result1 = subprocess.run([
            'python', 'scripts/update_specials_var.py',
            '--file', test_file,
            '--force'
        ], capture_output=True, text=True)

        if result1.returncode != 0:
            print("First run failed:", result1.stderr)
            return False

        # Read the file after first run
        with open(test_file, 'r') as f:
            content1 = f.read()

        # Count occurrences of a component
        count1 = content1.count("'suncard'")
        print(f"After first run, count of 'suncard': {count1}")
        print("Content snippet around suncard:")
        lines = content1.split('\n')
        for i, line in enumerate(lines):
            if 'suncard' in line:
                print(f"Line {i}: {repr(line)}")

        # Run the script the second time
        result2 = subprocess.run([
            'python', 'scripts/update_specials_var.py',
            '--file', test_file,
            '--force'
        ], capture_output=True, text=True)

        if result2.returncode != 0:
            print("Second run failed:", result2.stderr)
            return False

        # Read the file after second run
        with open(test_file, 'r') as f:
            content2 = f.read()

        # Count occurrences again
        count2 = content2.count("'suncard'")
        print(f"After second run, count of 'suncard': {count2}")
        print("Content snippet around suncard:")
        lines = content2.split('\n')
        for i, line in enumerate(lines):
            if 'suncard' in line:
                print(f"Line {i}: {repr(line)}")

        if count1 != count2:
            print(f"Duplicates detected: {count1} -> {count2}")
            return False

        # Check that the date is updated (assuming run on different day, but since same, check the content is the same)
        if content1 != content2:
            print("Content changed between runs")
            return False

        print("Test passed: No duplicates, content stable")
        return True

if __name__ == '__main__':
    if test_update_specials_no_duplicates():
        print("All tests passed")
    else:
        print("Test failed")
        exit(1)