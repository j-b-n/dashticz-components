#!/usr/bin/python

import argparse
from os import listdir, getenv
from os.path import isfile, join, dirname, basename
from dotenv import load_dotenv
import shutil
from datetime import datetime
import os

load_dotenv()

parser = argparse.ArgumentParser(description='Update the specials variable in dashticz.js with new components.')
parser.add_argument('--file', default='/home/pi/dashticz/js/dashticz.js', help='Path to the dashticz.js file to update.')
parser.add_argument('--verbose', action='store_true', help='Print verbose output of what the script does.')
parser.add_argument('--force', action='store_true', help='Replace the original file instead of creating backup and updated versions.')
args = parser.parse_args()

sourcepath = getenv('DASHTICZ_COMPONENTS_SOURCE_PATH', '/home/pi/dashticz-components/js/components/')
if not os.path.isdir(sourcepath):
    print(f"Error: Source path {sourcepath} does not exist or is not a directory.")
    exit(1)
current_date = datetime.now().strftime('%Y%m%d')

# Get list of .js files in sourcepath
files = [f for f in listdir(sourcepath) if isfile(join(sourcepath, f)) and f.endswith('.js')]
components = [f[:-3] for f in files]

if args.verbose:
    print(f"Found components in {sourcepath}: {components}")

# Read the target file
try:
    with open(args.file, 'r') as f:
        content = f.read()
except FileNotFoundError:
    print(f"Error: File {args.file} not found.")
    exit(1)

# Find the specials array
pos_start = content.find("var specials = [")
if pos_start == -1:
    print("Error: Could not find 'var specials = [' in the file.")
    exit(1)

pos_end = content.find("];", pos_start)
if pos_end == -1:
    print("Error: Could not find closing '];' for specials array.")
    exit(1)

array_content = content[pos_start:pos_end + 2]
lines = array_content.split('\n')

# Parse existing specials and rebuild with updated comments
new_lines = [lines[0]]  # var specials = [
current_comps = set()
for line in lines[1:-1]:
    stripped = line.strip()
    if args.verbose:
        print(f"Processing line: {repr(stripped)}")
    if stripped.startswith("'") and ',' in stripped:
        parts = stripped.split(',', 1)
        comp = parts[0].strip().strip("'")
        current_comps.add(comp)
        if args.verbose:
            print(f"Added comp: {comp}")
        if comp in components:
            # Update component lines that are in the source with current date comment
            new_line = f"    '{comp}', // Updated by dashticz-components: {current_date}"
        else:
            new_line = line  # Keep other component lines as is
    else:
        new_line = line  # Keep non-component lines as is
    new_lines.append(new_line)

# Add any new components not already present
for c in components:
    if c not in current_comps:
        new_lines.append(f"    '{c}', // Updated by dashticz-components: {current_date}")

if args.verbose:
    print(f"Current comps in file: {sorted(current_comps)}")
    print(f"Components from source: {sorted(components)}")

new_lines.append(lines[-1])  # ];
new_array_content = '\n'.join(new_lines)

# Replace in content
new_content = content[:pos_start] + new_array_content + content[pos_end + 2:]

# Handle file writing based on --force
dir_path = dirname(args.file)
base_name = basename(args.file)
backup_file = join(dir_path, f"{base_name}.{current_date}")
updated_file = join(dir_path, f"{base_name}.UPDATED")

if not args.force:
    # Create backup and updated file
    shutil.copy2(args.file, backup_file)
    if args.verbose:
        print(f"Created backup: {backup_file}")
    
    with open(updated_file, 'w') as f:
        f.write(new_content)
    if args.verbose:
        print(f"Created updated file: {updated_file}")
        print("Use --force to apply the changes to the original file.")
else:
    # Replace original file
    with open(args.file, 'w') as f:
        f.write(new_content)
    if args.verbose:
        print(f"Updated original file: {args.file}")