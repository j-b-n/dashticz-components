#!/usr/bin/python

from os import listdir, system, getenv
from os.path import isfile, join
from dotenv import load_dotenv

load_dotenv()

sourcepath = "/home/pi/dashticz-components/js/components/"
targetpath = getenv('DASHTICZ_COMPONENTS_PATH', '/opt/stacks/dashticz/dashticz/js/components/')

files = [f for f in listdir(sourcepath) if isfile(join(sourcepath, f)) and (f[-3:]==".js" or f[-4:]==".css")]

for filename in files:
    if isfile(join(targetpath,filename)):
        print("Found "+targetpath+filename+" will not create symlink!")
    else:
        system("ln -sf "+sourcepath+filename+" "+targetpath+filename)
        print("Created symlink "+targetpath+filename+"!")

files = [f for f in listdir(sourcepath) if isfile(join(sourcepath, f)) and (f[-3:]==".js" or f[-4:]==".css")]

for filename in files:
    if isfile(join(targetpath,filename)):
        print("Found "+targetpath+filename+" will not create symlink!")
    else:
        system("ln -sf "+sourcepath+filename+" "+targetpath+filename)
        print("Created symlink "+targetpath+filename+"!")
