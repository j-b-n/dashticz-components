#!/usr/bin/python

import argparse
from os import listdir, system, getenv
from os.path import isfile, join, islink
from dotenv import load_dotenv

load_dotenv()

parser = argparse.ArgumentParser(description='Create symlinks for Dashticz components.')
parser.add_argument('--debug', action='store_true', help='Print what would happen instead of performing actions.')
args = parser.parse_args()

sourcepath = getenv('DASHTICZ_COMPONENTS_SOURCE_PATH', '/home/pi/dashticz-components/js/components/')
targetpath = getenv('DASHTICZ_COMPONENTS_PATH', '/opt/stacks/dashticz/dashticz/js/components/')

files = [f for f in listdir(sourcepath) if isfile(join(sourcepath, f)) and (f[-3:] == ".js" or f[-4:] == ".css")]

for filename in files:
    target_file = join(targetpath, filename)
    if isfile(target_file):
        if not islink(target_file):
            # It's a regular file, delete it
            if not args.debug:
                system("rm " + target_file)
            print("Deleted regular file " + target_file)
        # Now create the symlink
        if args.debug:
            print("Would create symlink: ln -sf " + sourcepath + filename + " " + target_file)
        else:
            system("ln -sf " + sourcepath + filename + " " + target_file)
            print("Created symlink " + target_file + "!")
    else:
        # File does not exist, create symlink
        if args.debug:
            print("Would create symlink: ln -sf " + sourcepath + filename + " " + target_file)
        else:
            system("ln -sf " + sourcepath + filename + " " + target_file)
            print("Created symlink " + target_file + "!")
