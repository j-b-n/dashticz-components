#!/usr/bin/python

import argparse
from os import listdir, system, getenv
from os.path import isfile, islink, join
from dotenv import load_dotenv

load_dotenv()

parser = argparse.ArgumentParser(description='Remove symlinks and optionally regular files from target path.')
parser.add_argument('--force', action='store_true', help='Also remove regular files with the same name.')
args = parser.parse_args()

sourcepath = getenv('DASHTICZ_COMPONENTS_SOURCE_PATH', '/home/pi/dashticz-components/js/components/')
targetpath = getenv('DASHTICZ_COMPONENTS_PATH', '/home/pi/dashticz/js/components/')

files = [f for f in listdir(sourcepath) if isfile(join(sourcepath, f)) and (f[-3:]==".js" or f[-4:]==".css")]

for filename in files:
    target_file = join(targetpath, filename)
    if islink(target_file):
        system("rm " + target_file)
        print("Delete symlink " + target_file + "!")
    elif args.force and isfile(target_file):
        system("rm -f " + target_file)
        print("Delete regular file " + target_file + "!")
